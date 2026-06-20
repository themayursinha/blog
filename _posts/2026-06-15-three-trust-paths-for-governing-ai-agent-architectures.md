---
layout: post
title: "Three Trust Paths for Governing AI Agent Architectures"
subtitle: "Data movement, transaction integrity, and tool execution each need their own controls."
date: 2026-06-15
categories: [ai, security, architecture]
tags: [ai, security, agents, architecture, mcp, threat-modeling]
description: "Agentic architectures surface three trust paths — data movement, transaction integrity, and tool execution — that share a security model but require different controls, invariants, and failure behavior."
share-img: /img/circuit.svg
related_posts:
  - MCP Visor: Runtime Policy Enforcement
  - MCP Security Is a Supply Chain Risk
  - Epistemic Security for AI Agents
  - Threat Modeling Autonomous AI Agents in Production
---

When I built [MCP Visor]({% post_url 2026-05-25-mcp-visor-runtime-policy-enforcement-for-ai-agents %}), I was focused on one boundary: the tool execution call. An agent invokes a tool. Something deterministic needs to say yes or no, log the decision, and prevent the model from being the only thing standing between a confused instruction and a production mutation. That boundary is real and the proxy works.

But working on agent architectures across MCP servers, protocol integrations, and enterprise platforms has made one pattern clear. Tool execution is one trust path among several. Most agentic architectures surface three distinct trust paths that share a security model but require different controls, different invariants, and different failure behavior. Architectural frameworks that collapse all three into a single boundary tend to produce controls that are too permissive on the data path or too restrictive on the execution path.

The three paths are data movement, transaction integrity, and tool execution. This post maps all three, explains why each needs independent governance, and proposes an architecture that separates centralized trust decisions from distributed domain enforcement.

## The three trust paths

### Data movement: what leaves

When an agent shares data with an external system — a vendor API, a third-party channel, an analytics pipeline — the primary risk is not the API call itself. It is the content that leaves. The model cannot unshare data after export. Classification, minimization, and routing need to be deterministic and independent of whatever the model decided to include in the response. If the policy relies on the model remembering to exclude PII, the policy does not exist.

The control posture is minimize, route, observe, revoke. Before data leaves, the system should classify it, minimize it to the necessary subset, route it through approved channels, observe what was exported, and support revocation. The invariant: no sensitive data leaves without tenant policy and deterministic export controls. A single [RAG](https://arxiv.org/abs/2005.11401) call can extract, compress, and summarize database records, customer PII, business logic, and internal documentation into one paragraph. The old [DLP](https://csrc.nist.gov/glossary/term/data_loss_prevention) boundary was around structured data fields. The new boundary needs to be around what the agent assembled from multiple retrieval sources.

There is also a reverse direction. When external data enters the system — recommendations, lookups, third-party context — the risk flips to [context poisoning](https://genai.owasp.org/llmrisk/llm042025-data-and-model-poisoning/). The agent treats external input as evidence without preserving source trust levels. I covered this in the [epistemic security post]({% post_url 2026-05-04-epistemic-security-the-missing-control-plane-for-ai-agents %}): retrieved content needs provenance labels because not all text entering context arrives with the same authority.

### Transaction integrity: what changes

When an external system or protocol can influence state — creating orders, modifying records, triggering workflows — the risks move from data leakage to state corruption. Three patterns repeat across every architecture I have reviewed.

Capability drift happens when a negotiated capability — "this channel can check prices" — drifts into actual behavior — "this channel is submitting orders." If the protocol negotiates capability at connection time but weakly validates it at execution time, the negotiation was theater. State drift happens when price, quantity, availability, or context changes between the external recommendation and its application. The agent may carry stale state into a fresh transaction. Completion replay happens when a duplicate or stale request is treated as [idempotent](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header) when domain rules require rejection.

The control posture is authenticate the caller, validate current state, authorize the specific mutation, enforce idempotency, and reconcile the outcome. Each step needs to be the responsibility of the domain that owns the state, not the protocol adapter or the agent. This is what I mean by distributed enforcement: the domain authorizes the effect because the domain owns the invariant.

### Tool execution: what chains

This is the trust path MCP Visor was built for. An agent chains tools, and the sequence can produce a cumulative effect that no single call would flag as dangerous. A compromised agent can stay inside individual tool permissions — each `file_read`, `database_query`, and `slack_send_message` looks legitimate — while producing a read-to-exfiltrate pattern, a query-to-mutate pattern, or a fetch-to-deploy pattern. The dangerous behavior is not in any single tool. It is in the sequence.

The control posture is bind identity to actor and tenant, constrain tools through signed manifests and risk tiers, decide policy on intent and scope, enforce in the domain through authorization artifacts, and contain cumulative impact through budgets, loop detection, and kill switches. The key insight from building MCP Visor is that runtime policy needs state. Static review tells you a tool exists. Runtime history tells you what the agent is doing with it across multiple calls.

{% include figure.html src="/img/three-trust-paths.svg" label="Fig. 1 · Three Trust Paths" caption="Agentic architectures surface three distinct trust paths — data movement, transaction integrity, and tool execution — each with its own control posture, invariants, and failure modes." alt="Three trust paths for AI agent architectures" %}

## Why one enforcement boundary creates blind spots

The temptation is to build one control plane that handles all three paths. Identity, authorization, policy, logging — one pipeline, one decision point, one audit trail. The problem is that the invariants differ in ways that matter to the architecture.

Data movement cares about classification, minimization, and provenance. The control should be observable and constrain what leaves, but it should not block low-risk operations with the same friction as financial mutations. Transaction integrity cares about state consistency, domain authorization, and idempotency. The control should fail closed on writes and preserve state on partial failure. Tool execution cares about sequence, budget, and identity binding. The control should evaluate past behavior to judge the next call.

A single boundary that tries to handle all three tends to default to the most conservative posture across the board. That creates friction on data reads and makes the execution path feel sluggish. The more practical architecture is one trust model with three enforcement points, each tailored to the trust path it guards. Shared trust services handle identity, capability policy, data policy, risk decisions, and evidence. The enforcement points apply those decisions in ways that match their path.

In the [MCP security post]({% post_url 2026-05-06-mcp-security-the-new-supply-chain-risk-for-ai-agents %}), I argued that MCP servers are not harmless plugins. They are executable trust boundaries that shape what agents see, believe, and do. The same instinct applies at the architecture level. Data channels, transaction channels, and tool channels are three different kinds of trust boundary. They need different checks, different evidence, and different failure behavior.

## Architecture: one trust model, distributed enforcement

The architecture I keep returning to has three layers. They are not three tiers of the same boundary. They serve different functions and should be allowed to evolve independently.

**Shared trust services** handle identity binding, capability policy, data policy, risk decisions, evidence collection, and revocation. They produce a signed, short-lived, sender-bound authorization artifact. The artifact carries a decision: this caller, in this tenant, with this identity, under this policy, may attempt this operation. The artifact never replaces domain validation. It carries context.

**Authoritative domains** validate current state, perform final object-level authorization, enforce business invariants, and reconcile outcomes. An artifact that says "caller X may place an order" does not mean the order is valid. It means the caller passed the trust gate. The domain must now validate whether the cart is current, the inventory exists, the price is correct, and the payment method is authorized. No artifact, no matter how cryptographically sound, substitutes for checking that the state the mutation depends on is still current.

**Runtime containment** sits outside both layers. Budgets, [circuit breakers](https://martinfowler.com/bliki/CircuitBreaker.html), tenant isolation, replay defense, loop detection, and kill switches catch what policy and domain authorization miss. Containment does not prevent every failure. It limits the blast radius when something gets through.

This layered model directly informed what I built in MCP Visor. The proxy sits at the execution boundary, deciding tool calls against YAML policy, detecting chains, requiring approval, and logging structured evidence. That is the third trust path implemented as a runtime control. The data trust path needs its own equivalent — something that minimizes, classifies, and observes before data leaves. The transaction trust path needs its own equivalent — something that carries authorization artifacts from identity to domain to reconciliation.

{% include figure.html src="/img/agentic-distributed-enforcement.svg" label="Fig. 2 · Distributed Enforcement" caption="One trust model, distributed enforcement. Shared trust services produce authorization artifacts. Authoritative domains validate state and authorize effects. Runtime containment limits blast radius." alt="Distributed enforcement for agentic systems" %}

## Threat model: distinct breakpoints per path

The threat model differs across the three paths, and the breakpoints need to be understood separately.

On the data path, the primary threats are over-sharing and context poisoning. An agent retrieves more data than needed and includes it in a response to an external system. The model decided what to include. The system should have minimized it first. Or an external system returns content containing hidden instructions — the [MCP tool poisoning](https://owasp.org/www-community/attacks/MCP_Tool_Poisoning) pattern. The model reads the content as evidence. It should have been labeled as untrusted, and the system should prevent untrusted content from driving high-stakes behavior without corroboration. The breakpoints are classify and minimize before export, route through approved channels, observe what left, support revocation, and label incoming content by trust tier.

On the transaction path, the sequence from external recommendation to incorrect order is predictable and dangerous. A valid external channel produces a recommendation. The capability negotiated at connection time drifts at execution time. State drifts between the recommendation and the order. A duplicate request is replayed. An incorrect order lands against inconsistent state. Customer impact is refunds, support burden, financial loss, and trust erosion. The breakpoints are authenticate the caller, validate current state, authorize the specific mutation, enforce idempotency, and reconcile the outcome against domain invariants. The control that matters most is domain authorization — the final check that the state the mutation depends on is still current before the mutation is applied.

On the execution path, tool chaining and resource exhaustion are the primary risks. A poisoned context steers the agent toward an overbroad tool. Each call passes per-tool policy. The cumulative sequence mutates domain state. The blast radius includes scaled mutations, cost spikes, and operational degradation. The breakpoints are bind identity, constrain tools, budget loops, contain tenant, and prove outcome. The hardest breakpoint to get right is budget — the model can loop, retry, and escalate without ever violating per-call authorization. Rate limiting helps. A hard wallet per tenant or session is stronger.

## Risk tiers: permit, constrain, gate, block

Across all three paths, I use [four risk tiers](https://www.nist.gov/itl/ai-risk-management-framework) that have proven useful in architecture reviews.

**Permit** discovery and read operations with minimized data, read scope, and object-level authorization. Trigger approval on bulk reads, sensitive segments, or anomalous routes.

**Constrain** reversible updates with scoped writes, state validation, idempotency, and rollback. Gate on new channels, unusual volume, or customer-specific data.

**Gate** irreversible mutations — financial movement, customer mutation, credential changes — behind bound authority, domain authorization, and reconciliation. These should fail closed on any uncertainty.

**Block** cross-tenant, credential-level, and destructive operations by default. Require formal risk acceptance with expiry and containment proof before enabling.

This tiered model is useful because it lets teams ship reversible value quickly while building controls for irreversible outcomes deliberately. The most common mistake I see is applying the same posture to reads and writes. Reads can be permissive with strong observability. Mutations that change money, state, or customer records need the full chain.

## Failure behavior: define it before an incident does

Every architecture works until a dependency fails. The real threat is not availability. It is the system silently switching to [fail-open](https://owasp.org/www-project-developer-guide/draft/foundations/security_principles/#fail-securely) semantics because no one defined the failure path.

Policy unavailable: writes fail closed. A bounded cache may serve low-risk reads during the outage, but no mutation proceeds without policy. Domain dependency unreachable: preserve state and degrade to a safe fallback — standard processing without the agent path, not a half-executed transaction. Inconsistent outcome detected: quarantine state into an asynchronous exception queue for human reconciliation. These are launch requirements, not post-incident improvements. I have seen teams define happy-path controls in detail and discover during an incident that the policy engine was unreachable and the system defaulted to allow.

## Evidence as a side effect, not a separate pipeline

Agent architectures produce identity assertions, policy decisions, tool calls, data exports, transaction records, and reconciliation logs. All of it is evidence. If generated as a normal byproduct of operation — not assembled after the fact — it serves three purposes simultaneously: security investigation, compliance evidence, and customer trust.

A customer who can see why an action happened, who approved it, which policy applied, and how the outcome was reconciled no longer needs to trust the model. They need to trust the controls around it. That is the same argument I made for [MCP Visor's audit trail]({% post_url 2026-05-25-mcp-visor-runtime-policy-enforcement-for-ai-agents %}), applied to the full architecture.

## The practical path

The more agent architectures I work on, the more I return to a simple decomposition. Any agentic system that handles data, transactions, and tools needs three things: a way to control what leaves, a way to validate what changes, and a way to constrain what chains.

MCP Visor addresses the third path. The first two — data movement controls and transaction integrity controls — are the next layers in the stack. My working architecture separates shared trust services from authoritative domains from runtime containment because the trust services should be centralized and consistent while domain authorization should stay close to the state it protects. The authorization artifact carries the decision. The domain enforces the effect. The containment layer limits what survives.

If you are building an agent platform that handles data, state, or tool execution, start with the invariants. What are you willing to let leave? What state are you willing to let change? What tool sequences are you willing to let run? The controls follow the invariants. The architecture follows the controls.
