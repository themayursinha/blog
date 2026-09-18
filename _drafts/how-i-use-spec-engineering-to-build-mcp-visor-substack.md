---
title: "How I Use Spec Engineering to Build MCP Visor"
subtitle: "The policy engine governs what agents may do. A second set of specs governs how I change the policy engine itself."
status: draft
source_url: "https://themayursinha.com/architecture/2026/06/27/spec-engineering-the-missing-layer-in-ai-agent-security/"
---

![An AI reasoning field passes through a structured specification before reaching connected tools.](https://substack-post-media.s3.amazonaws.com/public/images/824a6c0f-eeb1-4b1c-9a4e-1a07f447f4fa_1672x941.png)

We are learning how to ask AI systems for more. We give them tools, access to files, APIs, databases, and the ability to change real systems. Then we describe the boundaries in prose.

“Be careful with production.” “Never expose secrets.” “Ask before doing anything destructive.”

These instructions are useful. They orient the model and communicate intent. Their weakness appears when we expect them to behave like security controls. A model interprets prose probabilistically, in the same context where it also receives user requests, retrieved documents, tool descriptions, and potentially hostile instructions.

A requirement that must hold every time needs a different form.

That form is what I call **spec engineering**.

## What spec engineering means

Spec engineering is the practice of expressing system intent as a structured, machine-readable contract that software can validate and enforce.

The human defines the properties that must hold. The spec records the permitted scope, failure behavior, trust assumptions, and evidence required to demonstrate compliance. A deterministic runtime or verification harness then applies those rules.

Consider a simple security instruction:

> Never let an agent read a `.env` file.

As a prompt, this sentence sits inside the model’s context and competes with every other instruction the model receives. As a spec, it becomes a rule such as:

```yaml
default_action: deny

rules:
  - type: deny_path
    patterns:
      - "**/.env"
```

The model can still request the file. The enforcement layer evaluates the path and rejects the request before execution.

This distinction matters because prompt engineering and spec engineering solve different problems. Prompts guide interpretation, style, planning, and judgment. Specs define boundaries that must survive a confused model, an adversarial input, or an implementation error.

## The anatomy of a useful spec

A useful engineering spec has several properties.

**It is declarative.** The spec describes the state or property that must hold. It does not depend on a model choosing the right sequence of steps.

**It is machine-readable.** YAML, JSON, a schema, or another constrained format lets software parse the requirement without interpreting free-form intent.

**It is enforceable.** A policy engine, compiler, proxy, test harness, or admission controller has a defined point where it can allow, reject, or stop an operation.

**It defines failure behavior.** Security properties become meaningful when the spec explains what happens after a timeout, malformed input, partial write, unavailable dependency, or failed verification.

**It includes scope and non-goals.** A trustworthy spec states which threats and components it covers. It also names the claims the system does not make.

**It produces evidence.** Tests, audit records, digests, command results, or signed receipts let another person inspect whether the requirement was actually enforced.

This approach has familiar ancestors. Infrastructure-as-Code turned infrastructure intent into declarative configuration. API schemas made interface expectations machine-readable. Policy-as-Code moved access decisions into testable rules. Spec engineering applies the same discipline to systems built and operated with AI.

The model remains valuable. It can explore a design, draft a change, explain tradeoffs, and implement code. The spec supplies the stable boundary around that work.

## Why agents make this necessary

Traditional software executes paths that engineers wrote in advance. Agents assemble paths while they run. A file read, database query, and outbound message may each be legitimate in isolation while their sequence creates an exfiltration path.

The [Model Context Protocol](https://modelcontextprotocol.io/specification/draft/server/tools) makes this concrete. MCP tools let models invoke external capabilities through `tools/call`. Once a tool can read files, send messages, execute commands, or mutate infrastructure, a natural-language warning provides weak assurance.

Spec engineering moves the decisive question outside the model:

```text
What action is being requested?
Which identity is requesting it?
Which arguments and prior actions matter?
What rule applies?
What evidence must exist before execution?
```

Those questions can be answered by deterministic code.

## How I use spec engineering in MCP Visor

I built [MCP Visor](https://github.com/themayursinha/mcp-visor) as a deterministic policy enforcement proxy for MCP tool calls. Visor sits between the AI client and the MCP server. The agent requests an action, and Visor evaluates policy before the request reaches the tool.

I use spec engineering in Visor at two connected layers.

The first layer governs what an agent may do at runtime. The second governs how I change the code that makes those decisions.

## Layer one: the runtime policy

Visor consumes a [declarative policy](https://github.com/themayursinha/mcp-visor/blob/main/docs/policy-model.md) that describes servers, tools, argument rules, approvals, redaction, dangerous call sequences, and session state.

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

The policy gives the runtime concrete facts to evaluate. Unknown tools can fail closed. Sensitive paths can be blocked by pattern. A read followed by an outbound send can be denied as a chain. High-risk actions can wait for approval. Audit requirements can determine whether an allowed action is permitted to proceed.

The model may be persuaded by an injected instruction. The policy engine still evaluates the declared rules.

This was the core argument in my earlier essay, [“Spec Engineering: The Missing Layer in AI Agent Security”](https://themayursinha.com/architecture/2026/06/27/spec-engineering-the-missing-layer-in-ai-agent-security/). Building Visor taught me that the same discipline also has to govern the development process.

## Layer two: the development contract

A policy engine can faithfully enforce a flawed specification. The quality of the security boundary therefore depends on how precisely the boundary was designed, reviewed, and tested.

Consider a request such as “make audit logging durable.” It leaves critical decisions unstated:

- Which events require durability?
- Must the record reach the filesystem before relay?
- What happens after a short write?
- Does a failed sink poison later operations?
- Which files may the implementation change?
- Which filesystem attacks fall inside the supported threat model?
- What evidence proves the work is complete?

Before implementation, I encode those answers in a machine-readable [task contract](https://github.com/themayursinha/mcp-visor/blob/main/harness/tasks/template.json). A security task declares:

- the [invariants](https://github.com/themayursinha/mcp-visor/blob/main/harness/invariants.md) it affects;
- the security property that must hold;
- attacker-controlled inputs and explicit failure classes;
- the expected fail-closed behavior for each class;
- trust assumptions and non-goals;
- the files a worker may edit;
- paths that require maintainer approval;
- a maximum attempt budget;
- exact commands for the failing test, target test, race test, and full harness.

The repository’s [project contract](https://github.com/themayursinha/mcp-visor/blob/main/harness/project-contract.md) defines the stable engineering boundary. Each task narrows that boundary for one change.

“Done” then becomes a state derived from artifacts. For a security-sensitive change, the [workflow](https://github.com/themayursinha/mcp-visor/blob/main/harness/loop.md) expects a reviewed specification, a failing test that reproduces the weakness, a passing target test after implementation, the [repository harness](https://github.com/themayursinha/mcp-visor/blob/main/harness/README.md), and an implementation review bound to the exact repository snapshot.

If the contract changes, earlier evidence becomes stale. If the spec revision changes, the red-test cycle begins again. The system cannot promote itself by writing `STATUS=PASSED` into a file. Status is calculated from contracts, command records, digests, reviews, and test outcomes.

## A concrete example: audit before action

One Visor invariant says that a valid tool call cannot be relayed unless its final allow record has been durably committed to the configured audit sink.

The compact version sounds reasonable: “log every allowed action.” The [actual task contract](https://github.com/themayursinha/mcp-visor/blob/main/harness/tasks/T-AUDIT-001-authorization-commit.json) has to be more precise.

It says that the complete newline-terminated record must be appended, a full write is required, and the file must be explicitly synced before the request reaches the MCP server. A marshal error, short write, sync failure, closed file, poisoned logger, or non-durable fallback sink converts the call to a denial with zero relay. Failed authorization cannot advance the in-memory hash chain, session taints, or allow counters.

The contract also names its limits. Visor trusts the configured audit directory and host administration. It makes no claim about surviving a hostile root user who can rename or delete that directory while the process runs. The supported boundary is documented instead of being hidden behind a broader security claim.

Every clause has an operational consequence. It becomes a test case, a review question, a runtime check, or a reason to stop.

## Specs also protect scope

The non-goals are often the most valuable part of a task.

An ambitious security project can accumulate features faster than evidence. Every new abstraction creates another state transition, compatibility surface, and claim that future maintainers must preserve. Visor therefore keeps a [complexity budget](https://github.com/themayursinha/mcp-visor/blob/main/docs/complexity-budget.md) alongside its [architecture](https://github.com/themayursinha/mcp-visor/blob/main/docs/architecture.md) and [threat model](https://github.com/themayursinha/mcp-visor/blob/main/docs/threat-model.md).

A task spec can reject automatic audit-log reopening, distributed audit, a new policy abstraction, or a wider identity claim when the evidence does not justify the complexity. This prevents an AI-assisted change from expanding into an adjacent redesign whose trust boundary nobody can state clearly.

Allowed paths provide another restraint. A worker receives an explicit set of files it may touch. Scope verification detects edits outside that set, including ignored files. The agent cannot redesign the repository because a broader refactor appears cleaner.

The spec preserves intent under execution pressure.

## The workflow is adversarial by design

My [development loop](https://github.com/themayursinha/mcp-visor/blob/main/harness/loop.md) separates several roles:

1. The architect writes the task contract and threat assumptions.
2. A reviewer attacks the spec before implementation and supplies counterexamples for every declared failure class.
3. A worker reproduces the failure, then changes code inside the allowed scope.
4. A planner runs target checks and the full harness against the same repository snapshot.
5. A reviewer examines the implementation evidence.
6. A human decides whether to merge, tag, or release.

Generation and judgment fail differently. A worker searches for a path to green. A reviewer searches for the property the green test forgot to measure. A deterministic harness checks command exits and repository state. The maintainer remains responsible for accepting the boundary.

A fluent explanation can help a reviewer understand a change. It cannot replace a failed red test, missing harness result, or contract mismatch.

## What this practice has taught me

Spec engineering adds friction at the beginning. I have to define what “secure” means for one change, identify failure behavior, name non-goals, and choose the evidence before code exists.

The time returns later. Reviews become concrete. Agents wander less. A subtle disagreement appears as a spec revision instead of an accidental implementation choice. Documentation claims can point to invariants and tests. When evidence no longer matches the current contract, the workflow says so.

The practice has also made me more careful with the phrase “the spec is the product.” A deterministic runtime can enforce an incorrect specification with perfect consistency. Specs therefore need ownership, versioning, adversarial review, and explicit trust assumptions.

For Visor, spec engineering now creates two chains of accountability:

```text
agent request
  -> runtime policy
  -> deterministic evaluation
  -> durable evidence
  -> allow or deny
```

```text
engineering intent
  -> task contract
  -> adversarial spec review
  -> failing test
  -> scoped implementation
  -> deterministic verification
  -> implementation review
  -> human release decision
```

Models can propose, explore, and implement. The authority boundary lives in a structure that can be inspected, tested, versioned, and enforced.

That is what spec engineering means to me, and that is how I use it to build Visor.

An earlier version of the core argument appeared on [themayursinha.com](https://themayursinha.com/architecture/2026/06/27/spec-engineering-the-missing-layer-in-ai-agent-security/).
