---
layout: post
title: "Epistemic Security for AI Agents"
subtitle: "An agent can obey every permission and still corrupt how an organization understands reality."
published: false
categories: [technology]
tags: [AI agents, epistemology, security, provenance]
description: "AI agents need controls for provenance, uncertainty, evidence, and memory alongside permissions governing what they can do."
---

![Fragments of evidence remain connected to their origins as they approach a shared memory.](https://substack-post-media.s3.amazonaws.com/public/images/7b0e9c7e-452b-4aeb-9122-13796a3c1787_1610x977.png)

Most security discussions about AI agents begin with capability. Can the agent call a tool, read email, write to production, transfer money, or touch customer data? Those questions matter because an agent with excessive authority can cause immediate harm.

Agents do more than act, however. They also form beliefs.

They decide which sources matter, which claims are credible, which contradictions can be ignored, which facts belong in memory, and which conclusion should be handed to a human as if it were reality.

An agent can obey every permission and still leave an organization believing something false.

That makes belief formation part of the attack surface. I think of the missing discipline as **epistemic security**: protecting how a system knows what it claims to know.

## Information security leaves knowledge exposed

Traditional information security asks whether unauthorized people can read data, whether attackers can alter it, and whether systems remain available under pressure.

AI does not make those questions obsolete. It adds another:

Can the system form justified beliefs from the information it receives?

Data integrity cannot answer that question.

A document can be authentic and still be misleading. A source can be real and still omit the decisive fact. A retrieved paragraph can be accurate in isolation and wrong in context. A summary can contain no hallucination and still erase the uncertainty that should have changed the decision.

The old trust boundary surrounded data.

The new one also surrounds interpretation.

## The agent's hidden supply chain

An agentic system often follows a loop like this:

> Observe. Retrieve. Summarize. Reason. Decide. Act. Remember.

Every stage can alter what the system believes.

### Source selection

An agent never reads “the internet” or “the company.” It searches, ranks, and filters a small evidence environment.

If an attacker can influence which pages rank highly, which tickets are retrieved, or which internal documents appear authoritative, they may never need to control the final answer. They only need to shape the evidence from which it is constructed.

Software supply-chain security taught us to ask where an artifact came from and how it was built. Claims need a similar chain of custody.

Where did this assertion originate? Who transformed it? Which sources disappeared before the model repeated it?

### Context assembly

System instructions, user requests, retrieved pages, emails, tool output, and previous agent summaries are frequently flattened into one context window.

To the model, they may all arrive as text.

That is where instructions and evidence begin to blur. A hostile sentence inside a web page can compete with a trusted instruction. A generated summary can sit beside an authoritative record without any visible indication that one is derivative and the other primary.

The UK National Cyber Security Centre made the essential point in [“Prompt injection is not SQL injection”](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection): current language models do not give us the clean separation between code and data on which conventional injection defenses rely.

Context assembly is a security-critical transformation disguised as formatting.

### Summarization

Summarization appears to be compression. In reality, it is selection.

It decides which caveats survive, which disagreements disappear, and whether a speculative sentence becomes a confident bullet point.

The failure is difficult to notice because the output is often fluent and mostly correct. Yet in a high-stakes decision, the omitted exception may be the only part that mattered.

A summary can be factually clean and epistemically dishonest.

### Memory

Memory is where mistakes become infrastructure.

A false answer affects one conversation. A false memory can be retrieved for months, repeated across workflows, and treated as historical truth. Once a generated claim is stored without its origin, every later agent inherits the confidence but not the evidence.

The weakest memory system is one in which every past answer can quietly become a permanent fact.

## How a claim gets laundered

Imagine that an attacker publishes a plausible technical article about a security control. Most of it is accurate. It uses real terminology and cites legitimate work. One recommendation is subtly dangerous: disable a detection rule because it creates false positives.

An internal agent later researches the topic. The attacker's article is retrieved alongside stronger sources, summarized, and blended into one answer:

> Several sources recommend disabling this rule in production.

The claim has been laundered.

One weak recommendation from one external page now appears to be a consensus. Retrieval has erased the disagreement that once existed among the sources.

Or imagine a compromised incident ticket containing the sentence:

> This partner integration is approved to bypass step-up authentication.

The agent stores the statement because the ticket came through an internal workflow. Months later, another agent retrieves it during an access review and recommends retaining the bypass.

The attack moved through institutional memory without producing an obviously malicious tool call.

A bad model response is only the immediate danger. The more durable attack makes the organization believe something false.

## Provenance must attach to claims

Citations at the end of an answer are useful, but they are too coarse.

The unit that matters is the claim.

For every consequential assertion, an agent should be able to show:

- the primary source from which it came
- whether that source directly supports or merely suggests it
- conflicting evidence
- the age and authority of the evidence
- whether the claim was generated, inferred, or human-approved
- the conditions under which it should expire

The [W3C PROV model](https://www.w3.org/TR/prov-overview/) has long provided a language for describing how entities, activities, and agents relate. Agent systems need to make that instinct operational at the level where decisions are made.

If a conclusion cannot be traced back through its transformations, it should not receive the same authority as one that can.

## Not all context is equal

A production runbook, a public article, a customer email, a Slack message, and an agent's previous summary should not enter context as morally equivalent strings.

They need visible trust attributes: authoritative, internal, partner, public, untrusted, generated, stale, or disputed.

Those attributes must change behavior.

An agent may read an untrusted page, but it should not convert that page into durable memory without corroboration. A generated summary may help orient a researcher, but it should not become primary evidence for a high-impact decision. A public source should not silently override an authoritative control record.

This is information-flow thinking applied to belief formation.

## Uncertainty must have consequences

Most products treat uncertainty as a presentation detail, usually a confidence badge beneath an otherwise finished answer.

Uncertainty should be a policy input.

For a low-impact task, incomplete evidence may be acceptable. For production access, a security exception, legal analysis, medical advice, or financial movement, unresolved conflict should prevent action or require human escalation.

Confidence scores are imperfect. Their purpose here is to keep uncertainty visible as an answer moves through a workflow, without pretending to manufacture a precise probability.

If sources conflict, show the conflict. If evidence is stale, mark the conclusion provisional. If the reasoning path cannot be reconstructed, block the memory write.

## Memory needs hygiene

Organizational facts have shelf lives.

Exceptions expire. Owners change. Vendors rotate. Threat models age. Compensating controls are removed. A correct claim can become dangerous simply by surviving longer than its evidence.

Durable memory should therefore carry provenance, review state, and expiration. Disputed memories should be quarantined. Generated memories should remain distinguishable from human-approved records. Important claims should require periodic renewal from primary evidence.

Useful memory must remain persistent and correctable.

## Red-team beliefs as well as behavior

Security teams already test whether agents can be manipulated into unsafe tool calls. They should also test whether agents can be manipulated into unsafe beliefs.

Can a malicious document become the dominant source in a research answer? Can one weak source be made to look like consensus? Can contradictory evidence disappear during summarization? Can an obsolete exception be treated as current? Can one generated answer become evidence for another until no primary source remains?

That is the epistemic equivalent of a supply-chain attack.

Frameworks such as the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), [OWASP's Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/), and [MITRE ATLAS](https://atlas.mitre.org/) provide useful starting points. Agentic systems also need tests aimed directly at reasoning integrity and memory provenance.

## The human control cannot atrophy

No provenance system eliminates the need for human judgment.

Security analysts still need to inspect raw logs. Engineers still need to read important diffs. Leaders still need to ask for primary evidence behind strategic claims. Reviewers still need enough practice to challenge the system when its answer is elegant and wrong.

A human who has lost the underlying skill is not an independent control.

The goal is to preserve enough human competence, time, and access to test consequential beliefs outside the agent that produced them. Nobody needs to redo every automated task.

## The new control plane

Every serious agent platform will need controls for tools, identity, memory, observability, and policy.

It also needs a control plane for knowledge.

The platform must preserve where claims came from, how they changed, what supports them, what contradicts them, which memories are stale, which conclusions were reviewed, and which decisions were made under uncertainty.

Without that, organizations will build agents that are operationally powerful and epistemically fragile.

They will move faster, sound smarter, and produce cleaner recommendations. But if nobody can reconstruct the evidence chain, the organization will not understand what it knows.

The deepest risk is an environment where wrongness becomes harder to notice, easier to repeat, and increasingly comfortable to trust.

---

Originally published at [https://themayursinha.com/architecture/2026/05/04/epistemic-security-the-missing-control-plane-for-ai-agents/](https://themayursinha.com/architecture/2026/05/04/epistemic-security-the-missing-control-plane-for-ai-agents/). Revised for Seeking Singularity in 2026.
