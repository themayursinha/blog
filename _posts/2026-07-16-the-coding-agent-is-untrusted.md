---
layout: post
title: "The Coding Agent Is Untrusted"
subtitle: "How I use contracts, invariants, and adversarial tests to build MCP Visor with AI."
date: 2026-07-16
published: false
categories: [ai, security, architecture]
tags: [ai, agents, mcp, software-engineering, security-testing, harness-engineering, spec-engineering]
description: "Coding agents can propose security-critical changes, but they should not define or certify success. This is the verification harness I use to keep AI-assisted development of MCP Visor bounded, observable, and reviewable."
share-img: /img/untrusted-coding-agent-harness.svg
related_posts:
  - "Spec Engineering: The Missing Layer in AI Agent Security"
  - Your System Prompt Is a God Class
  - MCP Visor: Runtime Policy Enforcement
---

I let coding agents modify the proxy that decides whether other agents may execute tools. That creates an uncomfortable recursion: probabilistic software is helping build a deterministic security boundary.

My answer is not to trust the coding agent. I treat it as an untrusted contributor with useful capabilities: it can inspect code, propose a patch, run tests, diagnose a failure, and try again. It cannot decide which security properties matter, weaken those properties to make a test pass, or certify its own work as safe.

The scarce work is no longer generating code. It is defining what must remain true and building an oracle that can observe whether the implementation actually preserves it.

{% include figure.html src="/img/untrusted-coding-agent-harness.svg" label="Fig. 1 · Untrusted proposer, controlled acceptance" caption="The coding agent can propose patches and iterate on failures. Contracts, invariants, observable tests, and human review define what is acceptable. A green harness run is evidence for encoded properties — not a proof that no property is missing." alt="Architecture diagram showing an untrusted coding agent proposing a patch to a verification harness, which either rejects it back into the loop or passes evidence to human review" %}

## Loops generate. Harnesses accept.

Loop engineering is useful. A bounded coding loop can move quickly:

~~~text
inspect → patch → test → diagnose → retry
~~~

But iteration is not verification. A loop answers, “Can the model produce a change that makes this command exit zero?” A harness must answer a harder question: “What does that exit code mean, which security property did we observe, and who is allowed to change the definition of success?”

That distinction matters because a capable model can satisfy a weak oracle. It can preserve the wrong behavior, update a snapshot that should have failed, remove an assertion, mock away the security boundary, or optimize for the name of a test rather than the property the test was meant to establish. None of this requires malice. The agent is simply searching the space it has been given.

For MCP Visor, I separate the two responsibilities:

- The **loop** controls how work repeats.
- The **harness** defines the evidence required to stop.
- The **maintainer** controls changes to the contract, invariants, and residual-risk decision.

The agent may operate the loop. It does not own the acceptance boundary.

## What the MCP Visor harness contains today

The harness is deliberately small. It lives in the public repository beside the code it governs:

~~~text
harness/
  project-contract.md   # purpose, trust assumptions, non-negotiables
  invariants.md         # security property → named verification
  loop.md               # cycle, stop conditions, approval gates
  check.sh              # fmt, vet, tests, local evidence manifest
~~~

The [project contract](https://github.com/themayursinha/mcp-visor/blob/main/harness/project-contract.md) defines the boundary before a model touches implementation: default deny, no LLM in authorization decisions, shared enforcement for supported transports, closed startup on invalid policy, and explicit limits around audit and observability.

The [invariant map](https://github.com/themayursinha/mcp-visor/blob/main/harness/invariants.md) connects those claims to named tests. Unknown tools must be denied. Sensitive paths must be blocked. Read-then-send chains must fail. Notification-form <code>tools/call</code> messages, duplicate-key parser differentials, and batches containing tool calls must not bypass the proxy. A denied handshake must not leave a child process hanging.

The [development loop](https://github.com/themayursinha/mcp-visor/blob/main/harness/loop.md) tells an agent how to work:

1. Read the contract and invariants.
2. Identify the property touched by the change.
3. Write or update the failing test first.
4. Make the smallest implementation change.
5. Run <code>harness/check.sh</code>.
6. Inspect the diff for security, privacy, and positioning risk.
7. Stop on success, a clear blocker, repeated failure, or scope expansion.

The local harness runs formatting, vetting, and the complete Go test suite, then writes a gitignored manifest containing the commit, commands, log, and covered invariant names. CI adds separate controls: build and test, golangci-lint, sensitive-content scanning, and <code>govulncheck</code>.

That is meaningful evidence. It is not an independent attestation. The same repository contains the implementation, tests, harness script, and invariant document. An agent that can edit all four can attempt to make the measuring instrument agree with the patch.

This is why changes that weaken default deny, fail-closed behavior, audit expectations, or the no-LLM decision path require human approval. The harness automates verification. It does not remove governance.

## One bypass: a tool call without an ID

The most useful harness work starts with a concrete adversarial shape.

A normal JSON-RPC request carries an <code>id</code>:

~~~json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "tools/call",
  "params": {
    "name": "file_read",
    "arguments": {"path": "/tmp/allowed"}
  }
}
~~~

Remove the <code>id</code> and the same message becomes a notification:

~~~json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "file_read",
    "arguments": {"path": "/tmp/bypass-attempt"}
  }
}
~~~

That small protocol mutation changes the expected response semantics. If a proxy assumes that every <code>tools/call</code> is a request-response exchange, notification form can find a path around code that waits for an authorization result. The invariant cannot merely say “the client received an error.” Notifications do not receive responses.

The security property is:

> A notification-form <code>tools/call</code> must be classified before relay, produce no client response, and cause zero tool calls at the downstream MCP server.

MCP Visor now blocks notification-form tool calls across stdio and the experimental remote transport. The invariant also covers JSON-RPC batches containing <code>tools/call</code>, duplicate <code>method</code> keys that different parsers could interpret differently, leading whitespace, and the post-initialize handshake slot.

{% include figure.html src="/img/tools-call-non-relay-oracle.svg" label="Fig. 2 · Observe the boundary, not the symptom" caption="A forbidden tools/call envelope must stop before relay. No client response is correct notification behavior, but the decisive security oracle is downstream execution count: zero. A subsequent valid request proves the proxy remains usable." alt="Diagram showing a notification-form tools call being denied by an envelope classifier, producing no client response and zero downstream tool executions, followed by a valid request that still succeeds" %}

The current integration test sends the forbidden notification, verifies that no client response appears, and then sends a valid request to prove the proxy is still alive. That is useful, but its name — <code>TestProxyIntegrationNotificationToolsCallNotRelayed</code> — is stronger than the observable assertion. The test infers non-relay from client-side behavior; it does not directly ask the mock downstream server how many tool calls it received.

That is exactly the kind of gap a harness article should admit. A stronger fake server would expose an execution counter or event channel:

~~~go
send(notificationToolsCall("/tmp/bypass-attempt"))

assertNoClientResponse(t, client, 750*time.Millisecond)

if got := downstream.ToolCallCount(); got != 0 {
    t.Fatalf("notification-form tools/call reached downstream: %d", got)
}

send(validToolsCall(2, "/tmp/allowed"))
assertSuccessfulResponse(t, client, 2)
~~~

Three assertions establish three different properties:

1. The proxy respects notification response semantics.
2. The forbidden message did not cross the enforcement boundary.
3. The deny did not corrupt the session or block later valid traffic.

The first is protocol behavior. The second is the security claim. The third is availability after rejection. A test that observes only one should not borrow certainty from the other two.

## Move intelligence out of the prompt

I do give coding agents instructions: keep the patch small, do not weaken tests, preserve default deny, run the full harness, report remaining risk. Those instructions improve behavior, but they are not enforcement.

The durable intelligence belongs in the environment:

- **Fixtures** make malformed envelopes reproducible.
- **Fake downstream servers** expose whether a call actually crossed the boundary.
- **Invariant names** connect a public claim to a concrete test.
- **Transport-parity tests** prevent stdio and HTTP paths from drifting apart.
- **Race tests** exercise cleanup and shared-state assumptions.
- **Fuzzing** explores parser and state-machine inputs that a prompt did not enumerate.
- **Static analysis and vulnerability checks** catch classes of defects outside the feature test.
- **Protected review boundaries** prevent a coding agent from silently redefining acceptance.

This is the same architectural move MCP Visor makes at runtime. Do not ask the probabilistic component to remember the boundary. Put the boundary somewhere it cannot persuade.

## Implementation harness versus discovery harness

There is still a deeper limitation: a harness can verify only the properties we encoded.

I find it useful to separate two systems that are often called “the test loop.”

An **implementation harness** asks:

> Does this patch preserve the properties we already know matter?

It contains the contract, named invariants, regression tests, integration fixtures, linting, static checks, evidence, and review gates. It is optimized for repeatable acceptance or rejection of a bounded change.

A **discovery harness** asks:

> Which important property have we failed to encode?

It mutates messages, corrupts state, varies transports, injects faults, weakens implementations, races cleanup, and searches for counterexamples. Its successful output is not a passing patch. It is a new failure, minimized into a fixture and promoted into a named invariant.

{% include figure.html src="/img/implementation-vs-discovery-harness.svg" label="Fig. 3 · Verification and discovery are different loops" caption="The implementation harness checks known invariants. The discovery harness searches for counterexamples. A discovered failure becomes a regression fixture and expands the implementation harness." alt="Two connected loops comparing an implementation harness that verifies known invariants with a discovery harness that finds counterexamples and promotes them into new invariants" %}

MCP Visor has the beginning of both. The implementation side is explicit today. The notification, batch, duplicate-key, transport-parity, and cleanup cases show discovery work being converted into regression invariants. But mutation testing, systematic transport differentials, broader fault injection, and signed PR evidence bundles are still roadmap—not present-tense guarantees.

The distinction prevents a dangerous form of complacency. A thousand passing tests can mean the implementation satisfies a rich security model. They can also mean the implementation has become excellent at satisfying an incomplete model.

## Capability routing is not authority routing

Different models are useful for different parts of this work.

A smaller model can handle a narrow implementation task when the file scope is constrained and the oracle is sharp. A stronger model is more useful for threat modelling, parser ambiguity, adversarial review, and asking what the current tests fail to observe. Humans remain responsible for changing invariants, approving new dependencies, accepting residual risk, and deciding what public claims the evidence supports.

This is capability routing: choose the least expensive reasoning system that can perform the proposal task well.

It must not become authority routing. A more capable model does not earn the right to weaken default deny, approve its own patch, publish a release, or declare a security boundary complete. Capability changes who proposes. It does not change who controls acceptance.

I am interested in measuring the economics of this split — task size, model cost, retries, rejected patches, and time to accepted evidence. Until those measurements exist, “cheap models are enough” is a hypothesis, not the thesis.

## What a green harness run does not prove

A passing run currently supports a bounded statement:

> At this commit, under this toolchain, the encoded checks passed.

It does not prove that:

- the invariant set is complete;
- the assertions observe the real security boundary;
- an agent did not weaken a test in the same patch;
- the local evidence manifest is tamper-proof;
- every transport, failure mode, or concurrency schedule was exercised;
- passing behavior survives a compromised host, policy file, or binary;
- the implementation is formally correct.

These limitations do not make the harness useless. They make its trust model legible. Security evidence becomes dangerous when a green checkmark silently expands into a claim the check never measured.

## Intelligence proposes. Boundaries decide.

The same principle now shapes both sides of MCP Visor.

At runtime, an AI agent proposes a tool call. MCP Visor applies policy before the call reaches the server.

During development, a coding agent proposes a patch. The harness applies contracts, invariants, observable tests, and review gates before the patch becomes part of the product.

Neither boundary makes the probabilistic component trustworthy. It limits what we must trust it to do.

That is the larger lesson: never place probabilistic intelligence in charge of proving its own correctness. Let it search, generate, and iterate. Keep the definition of success — and the authority to change that definition — outside the loop.
