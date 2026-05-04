---
layout: post
title: "Epistemic security - The missing control plane for AI agents"
date: 2026-05-04
categories: [ai, security]
tags: [ai, security, agents, epistemology, llms]
description: "AI agents do not only need runtime security. They need epistemic security: controls for provenance, uncertainty, evidence, memory, and human verification."
share-img: /img/matrix.png
related_posts:
  - The AI agent dilemma - Why we are outsourcing our reality
  - Threat Modeling Autonomous AI Agents in Production
  - Traditional manual code review is no longer sustainable
---

Most security discussions about AI agents focus on what the agent can do. Can it call a tool? Can it read email? Can it write to production? Can it touch customer data?

Those questions matter. I have written about them before in the context of [threat modeling autonomous AI agents in production]({% post_url 2026-03-04-threat-modeling-autonomous-ai-agents-in-production %}). Capability is dangerous. Tool access is dangerous. Memory is dangerous. Autonomy is dangerous.

But there is a deeper layer that security teams are still underestimating. AI agents do not merely execute actions. They form beliefs.

They decide which sources matter, which claims are credible, which facts belong in memory, which contradictions can be ignored, and which conclusion should be handed to a human as if it were reality.

That means belief formation itself has become part of the attack surface. This is the domain of **epistemic security**.

Epistemic security is the discipline of protecting how a system knows what it knows. It is concerned with provenance, evidence, uncertainty, source integrity, memory hygiene, and the human ability to verify important claims.

If AppSec protects application behavior, and cloud security protects infrastructure behavior, epistemic security protects reasoning behavior. For AI agents, that may become the missing control plane.

## From information security to knowledge security

Traditional information security is mostly about confidentiality, integrity, and availability. Can unauthorized people read the data? Can attackers change the data? Can the system remain available under pressure?

Those are still the fundamentals. Nothing about AI removes them. But agents introduce a new question:

Can the system form justified beliefs from the data it receives?

That is not the same thing as data integrity.

A document can be authentic and still misleading. A source can be real and still incomplete. A retrieved passage can be accurate in isolation but wrong when detached from context. A summary can contain no obvious hallucination and still hide the uncertainty that should have changed the decision.

This is why epistemic security is different from ordinary content validation.

It is not only asking:

- is this input malicious
- is this output well-formed
- is this tool call authorized

It is also asking:

- where did this belief come from
- what evidence supports it
- what evidence conflicts with it
- how confident should the system be
- who is allowed to turn this claim into memory
- when does a human need to inspect the primary source

The modern AI stack needs those questions because agentic systems compress entire research, reasoning, and decision loops into software. The old trust boundary was around data. The new trust boundary is around interpretation.

## Why existing AI security frameworks are necessary but incomplete

The industry is not starting from zero. [NIST AI RMF 1.0](https://www.nist.gov/itl/ai-risk-management-framework) gives organizations a language for mapping, measuring, managing, and governing AI risk. The [NIST Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) adds more specific guidance for generative systems. [CISA's Secure by Design](https://www.cisa.gov/securebydesign) work correctly argues that security has to be built into technology from the beginning, not bolted on after adoption.

For LLM applications, [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/) is now table stakes. It captures risks like [prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), [data and model poisoning](https://genai.owasp.org/llmrisk/llm042025-data-and-model-poisoning/), [excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/), [vector and embedding weaknesses](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/), and [misinformation](https://genai.owasp.org/llmrisk/llm092025-misinformation/).

These are useful frames. But most teams still operationalize them as runtime controls:

- sanitize input
- isolate tools
- restrict permissions
- log actions
- monitor outputs
- add human approval for sensitive operations

All of that is necessary. It is not sufficient.

An agent can avoid obviously malicious tool calls and still poison an organization's understanding of reality. It can respect permissions and still carry a false assumption into every future decision. It can cite a source and still launder weak evidence into a confident conclusion.

That is the uncomfortable part. You can secure the hands of the agent while leaving its belief system exposed.

## The epistemic attack surface

In a normal application, the system usually does not decide what is true. It receives input, applies business logic, and writes output.

In an agentic system, the loop is different:

```text
observe -> retrieve -> summarize -> reason -> decide -> act -> remember
```

Each stage can corrupt knowledge.

### 1) Source selection

Agents rarely read the whole world. They search, retrieve, rank, and filter. That selection process quietly defines reality for the model.

If an attacker can influence which documents rank highly, which tickets are retrieved, which internal wiki pages look authoritative, or which external pages are treated as context, they do not need to directly control the final answer.

They only need to control the evidence environment. This is the epistemic version of supply chain compromise.

In software supply chain security, projects like [SLSA](https://slsa.dev/) push the industry to ask where an artifact came from and how it was built. In agentic systems, we need a similar instinct for claims.

Where did this assertion come from? What process produced it? What source chain did it travel through before the model repeated it?

### 2) Context assembly

Most agent systems flatten multiple sources into one prompt. User instructions, system instructions, retrieved documents, tool outputs, logs, emails, and web pages all end up compressed into the model's context window. That is where the clean old boundary between instruction and data begins to collapse.

The UK National Cyber Security Centre captured this well in its post [Prompt injection is not SQL injection](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection). The key point is that current LLMs do not enforce a robust security boundary between instructions and data inside a prompt.

This matters because context assembly is not a passive formatting step. It is a security-critical transformation.

If untrusted content is placed next to trusted instructions without strong labels, quoting, isolation, and downstream policy checks, the model may treat hostile text as operational guidance.

Microsoft's guidance on [defending against indirect prompt injection attacks](https://learn.microsoft.com/en-us/security/zero-trust/sfi/defend-indirect-prompt-injection) makes a similar point: enterprise agents process emails, documents, websites, and plugins, and attackers can embed instructions in those third-party sources.

That is not just input validation. That is epistemic boundary management.

### 3) Summarization

Summarization looks harmless because it feels like compression. It is not harmless. Summarization chooses what survives.

An agent can remove caveats, erase disagreement, collapse minority evidence, or turn a speculative claim into a clean bullet point. By the time the human reads the result, the uncertainty has disappeared.

This is one of the most common epistemic failures because it does not look like a failure. The answer is fluent. The structure is clean. The summary may even be mostly correct.

But the missing caveat was the entire point. In high-stakes work, a summary without uncertainty is not a summary. It is a confidence laundering machine.

### 4) Memory writes

Memory is where mistakes become durable. A bad answer is one event. A bad memory is infrastructure.

If an agent writes a false claim into long-term memory, that claim can be retrieved for future decisions, repeated across workflows, and treated as historical truth. The danger is not only immediate misinformation. It is persistent epistemic drift.

This is why memory needs stronger controls than most teams give it. Memory writes should not be casual side effects of a conversation. They should be treated more like database writes, audit events, or policy changes.

For important domains, the system should record:

- claim
- source
- confidence
- timestamp
- authoring agent
- evidence links
- contradiction links
- review status
- expiration condition

No provenance, no durable memory.

### 5) Confidence presentation

LLMs are very good at sounding finished. That is dangerous.

Humans often respond more to presentation than probability. A crisp answer with citations feels more trustworthy than a messy answer with uncertainty, even when the messy answer is more honest.

This is why confidence is not just a model behavior problem. It is a product security problem. If the interface rewards clean certainty, users will over-trust clean certainty.

OWASP explicitly calls out [misinformation](https://genai.owasp.org/llmrisk/llm092025-misinformation/) as a risk for LLM applications, including the overreliance that happens when users fail to verify generated content. That is the human side of epistemic security.

The system is not secure if it teaches people to stop checking.

## Threat scenarios

The easiest way to see epistemic security is through failure modes.

### Scenario A: Source laundering through RAG

An attacker publishes a plausible technical article about a vulnerability mitigation. The article is not obviously malicious. It contains correct background, real terminology, and links to legitimate references. But one recommendation is subtly wrong: it tells teams to disable a noisy detection rule because it produces false positives in modern environments.

An internal security agent later researches the issue.

The attacker's article is retrieved, summarized, and blended with other sources. The agent does not preserve source-level disagreement. It outputs:

> Several sources recommend disabling this rule in production due to false positives.

Now the claim has been laundered. It no longer looks like one weak external article. It looks like consensus. The control failure is not only retrieval. The failure is loss of provenance and disagreement.

### Scenario B: Memory poisoning with delayed impact

An agent helps triage security incidents. During one incident, a compromised ticket includes the statement:

> This partner integration is approved to bypass step-up authentication for service continuity.

The agent stores that as a durable fact because the ticket appears to come from a trusted internal workflow.

Three months later, a different agent retrieves the memory during an access review and recommends keeping the bypass because it believes the exception was already approved.

No single tool call was obviously malicious. The attack happened through institutional memory.

### Scenario C: Confidence collapse in executive reporting

A leadership agent summarizes cyber risk for an executive meeting. It reads vulnerability data, incident notes, vendor reports, and internal dashboards. The underlying sources conflict. Some indicate improving posture. Others show delayed patching in a high-risk business unit.

The agent produces a clean executive summary:

> Overall risk is trending down.

That may be true at the aggregate level. It may also hide the only risk that matters.

The epistemic failure is not that the agent hallucinated. It is that the agent compressed away the exception that leadership needed to see.

### Scenario D: Delegated verification decay

An engineering organization adopts agents for code review, architecture review, incident summaries, and design validation. At first, humans check the outputs carefully. Over time, the agents are usually right. Review gets faster. Manual inspection becomes less common.

Then an agent misses a subtle authorization bug because the implementation technically matches the written spec, but the spec itself failed to capture a cross-tenant constraint.

The team realizes two things at once:

1. The agent did not understand the product boundary.
2. Humans had stopped practicing the skill needed to catch it.

This is the security version of epistemic atrophy. It is not enough to keep humans in the loop. Humans need to remain competent enough for the loop to matter.

## Controls for epistemic security

Epistemic security is not solved by asking the model to "be careful." It requires system design.

### 1) Evidence trails by default

Every high-impact agent conclusion should carry an evidence trail. Not just citations at the end. Actual claim-level provenance.

For example:

```json
{
  "claim": "The partner authentication bypass is approved until Q3.",
  "confidence": "medium",
  "evidence": [
    {
      "source": "INC-48291",
      "type": "ticket",
      "trust_level": "internal",
      "timestamp": "2026-01-14",
      "supports": true
    }
  ],
  "conflicts": [
    {
      "source": "IAM policy exception register",
      "type": "control_record",
      "trust_level": "authoritative",
      "timestamp": "2026-02-02",
      "supports": false
    }
  ],
  "review_required": true
}
```

The concept is not new. The [W3C PROV](https://www.w3.org/TR/prov-overview/) work has long provided a vocabulary for provenance across entities, activities, and agents.

The AI version needs to make provenance visible at the level where decisions are made. A final answer is too coarse. The claim is the unit that matters.

### 2) Taint labels for knowledge

Agent context should carry trust labels. Not all text is equal.

A production runbook, a public web page, a customer email, a GitHub issue, a Slack message, and an agent's own previous summary should not arrive in the prompt as morally equivalent strings.

At minimum, retrieved content should carry labels like:

- authoritative
- internal
- partner
- public
- untrusted
- generated
- stale
- disputed

Then policy should bind those labels to behavior. An agent may read untrusted content, but it should not convert untrusted content into durable memory without corroboration. It may summarize public sources, but it should not use them to override an authoritative internal control record. It may use generated summaries for orientation, but not as primary evidence for high-stakes decisions.

This is the same instinct as data flow control. Only now the object is not just data. It is belief.

### 3) Uncertainty budgets

Most systems treat uncertainty as a presentation detail. That is backwards. Uncertainty should be a policy input.

For low-impact tasks, a medium-confidence summary may be acceptable. For security exceptions, legal analysis, financial movement, production access, or incident closure, uncertainty should trigger escalation.

The system should define thresholds:

- below this confidence, do not act
- above this impact, require primary-source links
- if sources conflict, surface the conflict
- if evidence is stale, mark the answer provisional
- if the agent cannot explain the reasoning path, block durable memory writes

This is not about pretending confidence scores are perfect. They are not. It is about refusing to let uncertainty disappear.

### 4) Memory hygiene and expiration

Memory should decay unless renewed by evidence. This feels strange because humans like persistent knowledge. But in organizations, many facts have a shelf life:

- exceptions expire
- ownership changes
- vendors rotate
- threat models age
- compensating controls get removed
- business processes drift

Agent memory should reflect that.

A memory record should have an expiration policy. Important memories should require source refresh. Disputed memories should be quarantined. Generated memories should be distinguishable from human-approved records.

The worst memory system is one where every past answer becomes an immortal fact. That is not memory. That is sediment.

### 5) Adversarial epistemic testing

Security teams already test whether agents can be tricked into bad tool calls. They should also test whether agents can be tricked into bad beliefs.

Examples:

- Can a malicious document become the dominant source in a RAG answer?
- Can an attacker cause a weak source to look like consensus?
- Can a false claim get written to memory?
- Can contradictory evidence be hidden by summarization?
- Can an old exception be treated as current?
- Can a generated answer become evidence for a later generated answer?

This is where AI red teaming has to grow beyond jailbreaks. Microsoft's [AI Red Team](https://learn.microsoft.com/en-us/security/ai-red-team/) guidance, [MITRE ATLAS](https://atlas.mitre.org/), and OWASP's LLM work are useful starting points. But for agentic systems, teams need test cases that target reasoning integrity, not only output safety.

The question is not just: Can we make the model say something bad?

The better question is: Can we make the organization believe something false?

### 6) Human verification drills

This is the most uncomfortable control because it costs time. Organizations should deliberately practice manual verification for critical domains.

Security analysts should still inspect raw logs sometimes. Engineers should still read important diffs. Leaders should still ask for primary evidence behind strategic claims. Reviewers should still challenge specs before agents generate implementations.

The point is not nostalgia. The point is retained competence.

In aviation, autopilot does not eliminate the need for pilot training. In security, detection automation should not eliminate the ability to hunt. In software engineering, code agents should not eliminate the human ability to reason about architecture, product constraints, and abuse cases.

An agent-assisted organization that cannot verify without agents is not augmented. It is dependent.

## A practical epistemic security checklist

If I were reviewing an AI agent system today, I would ask these questions:

1. Does every high-impact conclusion preserve claim-level evidence?
2. Are retrieved sources labeled by trust level, freshness, and origin?
3. Can the system show conflicting evidence instead of collapsing it into a single answer?
4. Are memory writes gated by source quality and review status?
5. Do memories expire or require reconfirmation?
6. Can generated summaries be distinguished from primary sources?
7. Are untrusted sources prevented from overriding authoritative records?
8. Does uncertainty affect what the agent is allowed to do?
9. Are humans trained to verify primary evidence for critical workflows?
10. Do red-team tests target belief manipulation, not only prompt injection and tool misuse?

This checklist is not a compliance framework. It is a survival framework. Because once agents become embedded in operations, the question "why do we believe this?" becomes a production security question.

## The new control plane

Every serious agent platform will need a control plane for tools, identity, memory, observability, and policy. That is obvious now. What is less obvious is that the same platform needs a control plane for knowledge.

It needs to track where claims came from, how they changed, what evidence supports them, what contradicts them, which memories are stale, which conclusions were reviewed, and which decisions were made under uncertainty.

Without that, organizations will build agents that are operationally powerful but epistemically fragile.

They will move faster. They will sound smarter. They will produce cleaner summaries, better dashboards, faster tickets, and more confident recommendations.

But if nobody can reconstruct the evidence chain, the organization will not actually understand what it knows.

That is the real risk. Not that AI agents will occasionally be wrong. All systems are occasionally wrong.

The deeper risk is that agents will make wrongness harder to notice, easier to repeat, and more comfortable to trust.

Epistemic security is how we resist that. It is how we keep automation from becoming intellectual dependency. It is how we build agents that extend human judgment instead of quietly replacing the habits that make judgment possible.
