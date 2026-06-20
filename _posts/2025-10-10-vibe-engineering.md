---
layout: post
title: Vibe Engineering
subtitle: "Why intent, taste, and judgment matter more than prompt velocity in AI-assisted engineering."
categories: [ai]
tags: [ai, llms, software-engineering, vibe-coding, agentic-coding]
description: "Vibe coding ships fast and breaks things. Vibe engineering keeps the speed but adds the discipline that makes software survive contact with production."
share-img: /img/vibe-engineering.svg
related_posts:
  - Designing a living ecosystem of AI agents
  - Why Transformer LLMs are better at finding code vulnerabilities than classical neural networks
  - Reframing Application Security
---

There are two ways to use AI for coding. One is fast, loose, and increasingly common. The other is harder, slower in the short term, and the only one that scales.

**Vibe coding** is the first: prompt, generate, ship. It works beautifully in a prototype with no users, no tests, and no existing architecture. It falls apart in production, where generated code has to fit a system, respect security boundaries, and keep working under load. The damage is rarely visible on day one. It shows up six months later as an authorization bug, a brittle abstraction, or a feature no one can maintain.

**Vibe engineering** is the second. It keeps the generative speed of AI but embeds it in structure, intent, and accountability. The human is still responsible for the result. The AI is an accelerator, not an author.

{% include figure.html src="/img/vibe-engineering.svg" label="Fig. 1 · Vibe Coding vs. Vibe Engineering" caption="Vibe coding ships fast and accumulates debt. Vibe engineering adds constraints before generation so the output fits the system." alt="Comparison of vibe coding and vibe engineering workflows" %}

## The difference is curatorship

A vibe coder asks the model to write a billing function. A vibe engineer asks the model to extend the existing `processInvoice()` logic to support usage-based tiers, using `formatCurrency()` from utils and applying the same access checks as `subscriptions.ts`. The second prompt is longer because the human has already done the thinking.

This is the shift. The valuable work moves from typing syntax to defining context. The engineer becomes a curator: choosing constraints, setting standards, and verifying that the output belongs in the codebase.

AI tools amplify expertise. They do not replace it. A senior engineer with a clear model of the system will get far more from an LLM than a junior engineer throwing prompts at it, because the senior knows what to specify, what to reject, and what to test.

## Five practices that make the difference

1. **Plan before generating.** Iterate on a high-level plan before handing work to the agent. The plan should answer what part of the system must change, what invariants must hold, and what success looks like.

2. **Codify the rules.** Write down architectural standards, style conventions, abstraction boundaries, and security defaults. Feed them to the agent as context. The AI should write like a member of the team, not a freelancer guessing at your preferences.

3. **Tests first.** Generate tests that describe expected behavior before generating implementation. Tests turn vague intent into executable constraints. They also give the agent a feedback loop it can run against.

4. **Manage the agent.** Working with a coding agent is a strange form of delegation. Provide clear instructions, the right context, and specific feedback on output. Treat it like a talented intern who needs direction, not a replacement for judgment.

5. **Direct toward reuse.** Point the agent at clean, current parts of the codebase. Reference existing utilities and patterns. Good vibe engineering produces code that feels like it was written by the team, not imported from a different project.

## Why this matters now

The pressure to ship with AI is real. Competitors are moving faster. Tools are getting better. But the organizations that win will not be the ones that generate the most code. They will be the ones that generate the right code, within boundaries, with tests and accountability.

Vibe coding feels like acceleration. Vibe engineering is acceleration with guardrails. The first gets you a demo. The second gets you a product.
