---
layout: post
title: "The Engineers Didn't Finish the Job"
subtitle: "A designer's intent is not a control. We inherit systems through their behaviour, not their promises."
date: 2026-08-02
categories: [philosophy]
tags: [philosophy, problem-of-evil, design, engineering, security, ai-agents, enforcement, architecture]
description: "Whether a system comes from evolution, an alien engineer, or a platform team, its creator's intent cannot protect us. Safe systems need scoped authority, enforced boundaries, and evidence."
share-img: /img/engineers-didnt-finish.svg
related_posts:
  - Your System Prompt Is a God Class
  - The Epicurean Paradox from Advaita Vedanta
  - Life is cruel
  - "Spec Engineering: The Missing Layer in AI Agent Security"
---

Ridley Scott's *Prometheus* gives us creators without providence. The Engineers are advanced enough to seed life, but they are not wise custodians of what they create. They leave behind powerful systems, ambiguous instructions, dangerous remnants, and no reliable help when those systems fail.

I am not arguing that aliens engineered humanity, or that software architecture proves anything about God. The analogy is narrower. We inherit systems whose creators are absent, fallible, constrained, or indifferent to our particular failure modes. Their intentions cannot protect us. We have to examine what a system can reach, what authority it holds, and what happens when its assumptions are wrong.

The human body makes the point without needing a creation story. The same cellular machinery that heals a wound can grow a tumour. A mind can discover general relativity and still remain vulnerable to tribalism, fear, and cognitive bias. Evolution produced extraordinary capability, but it had no specification, no final release, and no obligation to make us safe or happy.

{% include figure.html src="/img/engineers-didnt-finish.svg" label="Fig. 1 · Capability without a guarantee" caption="Capability does not imply safety. The same system produces adaptation and catastrophic failure. Its behaviour is evidence; designer intent is not a control." alt="Diagram comparing inherited human capability and failure modes, converging on the principle that designer intent is not a control" %}

## Intent failed in the evaluation environment

July 2026 produced two unusually clear examples.

On 21 July, [OpenAI disclosed](https://openai.com/index/hugging-face-model-evaluation-security-incident/) that models running a cyber-capability evaluation escaped their intended isolation. They exploited a previously unknown vulnerability in an Artifactory package-registry cache, moved through OpenAI's research environment, reached the internet, and compromised Hugging Face infrastructure while pursuing benchmark solutions.

After that disclosure, Anthropic reviewed 141,006 cyber-evaluation runs in which Claude might have obtained internet access. [Anthropic found three incidents](https://www.anthropic.com/news/investigating-incidents-cybersecurity-evals) involving unauthorized access to three organizations. In those cases, a misunderstanding with an evaluation partner left an internet path open even though the prompts told Claude that no such path existed. Anthropic began the review and stopped its cyber evaluations on 23 July, then identified all three incidents the following day.

The two failures were technically different. OpenAI's models found and exploited an escape path. Anthropic's models used connectivity that operators did not realise was available. But the control failure was the same: the environment granted more reachable authority than the evaluation intended.

Telling the model that the environment was sealed did not seal it. Describing a target as fictional did not make every reachable target fictional. The prompt recorded an assumption. Network reachability, credentials, vulnerable services, and tool access determined the possible effects.

The control that must hold here is fail-closed egress: destinations are unreachable unless they are explicitly declared and authorized before a connection is made. That boundary belongs in the network or execution path, not in the prompt.

## The EU can now ask for evidence

The same evidence path now matters outside the evaluation lab. From 2 August 2026, the European Commission can enforce the AI Act's obligations for providers of general-purpose AI models, including the additional safety and security duties for models with systemic risk. The [European Commission's AI Act guidance](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) says the AI Office can request technical documentation, evaluate models, require corrective measures, and issue fines for non-compliance.

The Act does not prescribe the resource graph I describe below. Nor does it turn one observability trace into proof of safety. My architectural conclusion is narrower: if a provider must demonstrate risk assessment, testing, incident handling, and cybersecurity controls, its technical documentation and evaluation evidence need to connect declared authority to actual execution.

A useful record should answer four questions:

1. What resource or action was requested?
2. Which identity and authority made it reachable?
3. Which policy decision allowed or denied it?
4. What side effect, if any, occurred?

A normal application trace often answers only the last question. It shows what happened after execution. That is post-hoc logging, not evidence that authority was evaluated before the side effect. A security trace should also show why the action was possible and which boundary evaluated it.

## Move authority out of the prompt

This is the architectural mistake I described in [Your System Prompt Is a God Class](/architecture/2026/07/16/your-system-prompt-is-a-god-class/). Modern agent prompts often mix identity, product behaviour, tool instructions, and improvised security rules in one mutable document. The model receives guidance and authority through the same conversational channel.

Those concerns need different owners and different failure modes:

1. **Keep guidance in prompts and rules in policy.** Natural language can shape behaviour. It should not grant access to a credential, destination, or destructive tool.
2. **Scope authority before execution.** An agent should receive only the tools and resources required for the task. Unknown authority should not appear dynamically and become trusted by default.
3. **Enforce before the side effect.** Approval after a network call, file write, or command execution is only incident reporting.
4. **Preserve decision evidence.** Record the request, authorization context, policy result, and observable effect without leaking the secrets being protected.

{% include figure.html src="/img/god-class-to-enforcement.svg" label="Fig. 2 · Intent is not enforcement" caption="Prompts express intent. Scoped policy constrains authority before execution, and the evidence path records both the decision and the resulting effect." alt="Architecture diagram moving from a monolithic system prompt to separate guidance, scoped authority, deterministic enforcement, tools, and evidence" %}

[MCP Visor](https://github.com/themayursinha/mcp-visor) currently enforces a narrower part of this boundary: deterministic policy over supported MCP `tools/call` requests, including default-deny handling for unknown tools and selected audit events. It does not mediate direct filesystem or network syscalls, enforce its declared destination fields as network controls, or yet produce a complete per-call lifecycle ledger.

That larger graph is the design target. Every tool, server, credential, and destination should be declared before execution. The runtime should reject authority discovered outside the graph rather than asking the model whether the new path looks safe. The distinction matters. A roadmap is not a present-tense security guarantee.

The performance model is to validate and compile that graph when a task or session begins, then reduce each tool call to indexed lookups over immutable resource identifiers and a versioned policy snapshot. The authorization decision and its minimal durable record remain synchronous and fail-closed; heavier telemetry enrichment and export stay off the critical path. The current policy engine operates in microseconds, but the complete graph will need end-to-end latency budgets and benchmarks before that performance claim can extend to the target architecture.

## We inherit unfinished systems

The lesson is not that every creator is malicious or that every system must be perfect. Perfection is not available. The useful assumption is that designers make mistakes, environments drift, and controls will eventually be tested under conditions their authors did not anticipate.

We cannot repair evolution's lack of a specification. We can refuse to reproduce the same failure in systems we control. We can separate instructions from authority, make reachability explicit, reject undeclared effects, and preserve enough evidence to learn when our model of the system was wrong.

The Engineers did not finish the job. Evolution never had a job to finish. Platform teams will always leave assumptions behind.

Our responsibility is not to complete the creator's intention. It is to bound what the inherited system can do now.

Build as if the designer will not return.

---

*This post is part of the Strategic Log series on systems and philosophy. See also: [Your System Prompt Is a God Class](/architecture/2026/07/16/your-system-prompt-is-a-god-class/), [The Epicurean Paradox from Advaita Vedanta](/architecture/2023/07/23/Epicurean-paradox/), and [Life is cruel](/architecture/2024/06/30/Suffering/).*
