---
title: "How I Use Spec Engineering to Build MCP Visor"
subtitle: "The policy engine governs what agents may do. A second set of specs governs how I change the policy engine itself."
status: draft
source_url: "https://themayursinha.com/architecture/2026/06/27/spec-engineering-the-missing-layer-in-ai-agent-security/"
---

![An AI reasoning field passes through a structured specification before reaching connected tools.](https://substack-post-media.s3.amazonaws.com/public/images/824a6c0f-eeb1-4b1c-9a4e-1a07f447f4fa_1672x941.png)

When I began building MCP Visor, the basic architecture was easy to describe. An AI agent requests a tool call. A deterministic proxy evaluates the request before it reaches the [MCP server](https://modelcontextprotocol.io/specification/draft/server/tools). Policy decides whether the call is allowed, denied, redacted, or held for approval.

The difficult part came later. Every security improvement created another question about what the system actually promised.

If Visor writes an audit record before allowing a tool call, does a buffered write count? What happens when the write succeeds but the filesystem sync fails? Can a malformed JSON-RPC message reach the server through a path the ordinary parser does not recognize? If policy changes while an approval is waiting, which version authorizes the action? What exactly does server identity bind: the launcher, its arguments, the entry script, or every transitive dependency?

Those questions cannot be resolved by telling a coding agent to “make the proxy secure.” They need precise answers before implementation begins.

This is where spec engineering became part of how I build [MCP Visor](https://github.com/themayursinha/mcp-visor). I use it at two connected layers. Visor consumes a [declarative policy](https://github.com/themayursinha/mcp-visor/blob/main/docs/policy-model.md) that constrains agent tool use. The Visor repository consumes [task contracts](https://github.com/themayursinha/mcp-visor/blob/main/harness/project-contract.md) that constrain how humans and coding agents change the enforcement system.

One spec governs the agent. The other governs the work on the governor.

## The first spec: what the agent may do

Visor sits at the MCP `tools/call` boundary. The model can request an action, but the policy engine decides whether that action can proceed.

A simplified policy looks like this:

```yaml
version: "1.0"
default_action: deny

servers:
  - name: "filesystem"
    allowed: true
    tools:
      - name: "file_read"
        allowed: true
        rules:
          - type: deny_path
            patterns:
              - "**/.env"
              - "**/*.pem"

tool_chains:
  - name: "prevent_exfiltration"
    sources:
      - server: "*"
        tool_pattern: "file_read"
    sinks:
      - server: "*"
        tool_pattern: "(http_post|slack_send_message)"
    action: deny
    within_calls: 3
```

This moves the security decision out of prose. The agent may be confused by a poisoned web page or persuaded by an injected instruction. The runtime still evaluates a path pattern, tool identity, argument rule, session taint, call sequence, approval requirement, and audit condition according to code.

That was the argument in my earlier essay, [“Spec Engineering: The Missing Layer in AI Agent Security”](https://themayursinha.com/architecture/2026/06/27/spec-engineering-the-missing-layer-in-ai-agent-security/). At the time, I was mainly describing spec engineering as a product architecture: declarative policy in, deterministic enforcement out.

Building Visor pushed the idea further. A policy engine can enforce its specification perfectly and still enforce an incomplete or badly reasoned specification. The quality of the boundary depends on how the boundary was designed.

## The second spec: how the boundary may change

Security work becomes vague very quickly. A request such as “make audit logging durable” leaves several decisions hidden:

- Which events require durability?
- Must the record reach the filesystem before relay?
- What happens after a short write?
- Does a failed sink poison later operations?
- Which files may the implementation change?
- Which filesystem attacks fall inside the supported threat model?
- What evidence proves the work is complete?

I now encode those answers in a [task contract](https://github.com/themayursinha/mcp-visor/blob/main/harness/tasks/template.json) before implementation. A Visor security task declares:

- the [invariants](https://github.com/themayursinha/mcp-visor/blob/main/harness/invariants.md) it affects;
- the security property that must hold;
- the attacker-controlled inputs;
- explicit failure classes and their expected fail-closed behavior;
- non-goals and trust assumptions;
- the files the worker may edit;
- paths that require maintainer approval;
- a maximum attempt budget;
- exact commands for the failing test, target test, race test, and full harness.

The important shift is that “done” stops being a conversational judgment. It becomes a state derived from artifacts.

For a security-sensitive change, the [workflow](https://github.com/themayursinha/mcp-visor/blob/main/harness/loop.md) expects a reviewed specification, a failing test that reproduces the weakness, a passing target test after the implementation, the [repository harness](https://github.com/themayursinha/mcp-visor/blob/main/harness/README.md), and an implementation review bound to the exact repository snapshot. If the task contract changes, earlier evidence becomes stale. If the spec revision changes, the red-test cycle begins again.

The system cannot promote itself by writing `STATUS=PASSED` into a file. Status is calculated from the contract, command records, digests, reviews, and test outcomes that exist.

## A concrete example: audit before action

One Visor invariant says that a valid tool call cannot be relayed unless its final allow record has been durably committed to the configured audit sink.

The appealing version of this requirement is short: “log every allowed action.” The useful version is much less elegant.

The [corresponding task contract](https://github.com/themayursinha/mcp-visor/blob/main/harness/tasks/T-AUDIT-001-authorization-commit.json) has to say that the complete newline-terminated record is appended, that a full write is required, and that the file is explicitly synced before the request reaches the [MCP server](https://modelcontextprotocol.io/specification/draft/server/tools). A marshal error, short write, sync failure, closed file, poisoned logger, or non-durable fallback sink must convert the call to a denial with zero relay. Failed authorization cannot advance the in-memory hash chain, session taints, or allow counters.

The same contract also names its limits. Visor trusts the configured audit directory and host administration. It does not claim to survive a hostile root user renaming or deleting that directory while the process runs. That boundary is documented instead of being obscured by more filesystem code and a broader claim.

This level of detail can feel excessive until a failure occurs. Then every clause becomes a test case, a review question, or a reason to stop.

## Specs include the things I refuse to build

The non-goals are often the most valuable part of the task.

An ambitious security project can accumulate features faster than it accumulates evidence. Every new abstraction creates another state transition, another compatibility surface, and another claim that future maintainers must preserve. Visor therefore keeps a [complexity budget](https://github.com/themayursinha/mcp-visor/blob/main/docs/complexity-budget.md) alongside its [architecture](https://github.com/themayursinha/mcp-visor/blob/main/docs/architecture.md) and [threat model](https://github.com/themayursinha/mcp-visor/blob/main/docs/threat-model.md).

A task spec can reject automatic audit-log reopening, distributed audit, a new policy abstraction, or a wider identity claim when the available evidence does not justify the complexity. This protects the project from a common failure mode in AI-assisted development: the model sees an adjacent problem and helpfully expands the solution until nobody can state the trust boundary clearly.

Allowed paths provide a second form of restraint. If a task concerns the audit commit, the worker receives an explicit set of files it may touch. Scope verification detects edits outside that set, including ignored files. The agent does not get to redesign the repository because a broader refactor looks cleaner.

The spec preserves intent under execution pressure.

## The workflow is adversarial by design

My [development loop](https://github.com/themayursinha/mcp-visor/blob/main/harness/loop.md) separates several roles:

1. The architect writes the task contract and threat assumptions.
2. A reviewer attacks the spec before implementation and supplies counterexamples for every declared failure class.
3. A worker reproduces the failure, then changes code inside the allowed scope.
4. A planner runs the target checks and the full harness against the same repository snapshot.
5. A reviewer examines the implementation evidence.
6. A human decides whether to merge, tag, or release.

These roles matter because generation and judgment fail differently. A worker is rewarded for finding a path to green. A reviewer looks for the property the green test forgot to measure. A deterministic harness checks command exits and repository state. The maintainer remains responsible for accepting the boundary.

The separation also prevents a coding agent from turning its own confidence into evidence. A fluent explanation may help a reviewer understand the change. It cannot replace a failed red test, a missing harness result, or a contract mismatch.

## What I have learned from using it

Spec engineering adds friction at the beginning of a change. I have to decide what I mean by “secure,” identify failure behavior, name non-goals, and choose the evidence before code exists. That opening work is slower than issuing a broad prompt.

The time returns later. Reviews become concrete. Agents wander less. A subtle disagreement appears as a spec revision instead of an accidental implementation choice. Documentation claims can point to invariants and tests. When evidence no longer matches the current contract, the workflow says so.

It has also made me more cautious about the phrase “the spec is the product.” A specification is powerful because a runtime can enforce it, and dangerous because an incorrect specification can make the wrong behavior repeatable. Specs need ownership, versioning, adversarial review, and explicit trust assumptions. Determinism removes persuasion from the decision path. It does not remove human error from the design path.

For Visor, spec engineering now means a chain of accountability:

```text
intent
  -> task contract
  -> adversarial spec review
  -> failing test
  -> scoped implementation
  -> deterministic verification
  -> implementation review
  -> human release decision
```

The product follows the same philosophy:

```text
agent request
  -> policy contract
  -> deterministic evaluation
  -> durable evidence
  -> allow or deny
```

Both chains put uncertainty where it belongs. Models can propose, explore, and implement. The authority boundary lives in a structure that can be inspected, tested, versioned, and enforced.

That is how I use spec engineering in Visor. I use it to define what agents may do, and to define the proof required before I trust a change to the code that decides.

An earlier version of the core argument appeared on [themayursinha.com](https://themayursinha.com/architecture/2026/06/27/spec-engineering-the-missing-layer-in-ai-agent-security/).
