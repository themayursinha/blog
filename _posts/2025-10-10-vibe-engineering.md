---
layout: post
title: Vibe Engineering
categories: [AI]
tags: [AI]
description: Vibe Engineering
---


## Stop Vibe coding: Why true engineers are now doing Vibe engineering

Everyone is talking about using AI to write software. It’s fast, it’s exciting, and it changes how we work. But how you use AI matters a lot. If you use it the wrong way, you create a huge mess.

There are two main ways to work with AI tools like Large Language Models (LLMs) and **coding agents**.

### The fast, loose way: Vibe coding

**Vibe coding** is the name for the widely established, fast, loose, and irresponsible way of building software with AI. It originated as playful experimentation that quickly crept into critical workflows. This approach is entirely prompt-driven and pays no attention to how the code actually works.

It is tempting because of its speed. You drop in a prompt, get runnable code, and ship it quickly. Vibe coding thrives early in a project when there is no existing code, no test suite, and no edge cases to worry about.

However, once you are pushing to production, prototyping your way through a sprint can invite regressions, brittle logic, and security gaps. This approach breaks down when correctness, maintainability, and scalability are at stake. What felt like momentum quickly becomes expensive technical debt. Teams are often left cleaning up after code that looked fine but failed under pressure. For example, a generated feature might lack an authorization check, leading to bugs where users access admin-only functionality, especially if no tests were written to catch the issue.

### The professional way: Vibe engineering

**Vibe Engineering** is proposed as the approach on the opposite end of the spectrum. This is a different, harder, and more sophisticated way of working with AI tools to build production software.

The solution to the failures of vibe coding is not to reject AI, but to evolve how it is used. Vibe engineering involves seasoned professionals accelerating their work with LLMs while staying proudly and confidently **accountable** for the software they produce.

This sophisticated approach retains the generative power of AI but embeds it within **structure, intent, and constraint**. The human developer takes on a new role: they define behavior, specify constraints, and orchestrate specialized agents not just to generate code, but to engineer software.

Instead of vaguely prompting "write a billing function," developers must guide the AI with explicit context, such as: “Extend the existing `processInvoice()` logic to support usage-based tiers. Use `formatCurrency()` from utils. Apply the same access checks used in `subscriptions.ts`”. This ensures the AI operates within boundaries, with context and accountability, rather than "freelancing".

The result is code that not only works but **fits** the existing system, respects established patterns, includes tests from the start, and assumes secure defaults.

### How to master Vibe engineering

Working productively with LLMs on non-toy projects is considered *difficult*, and demands that the human participant operate "at the top of your game". AI tools **amplify existing expertise**; the more skills and experience a software engineer has, the faster and better the results they can get from LLMs and coding agents.

Here are the key practices central to Vibe engineering:

1.  **Think beyond the task, think about the system**
    Planning in advance is critical. You should iterate on a high-level plan before handing off the coding task to the agent. Think systemically about what part of the system needs to evolve cleanly and durably to support a change.

2.  **Codify the rules you want AI to follow**
    Define the architectural standards, style conventions, abstraction boundaries, and naming rules that your AI must follow. This ensures the AI writes like a team member, operating within context and accountability.

3.  **Adopt Test-Driven Development (TDD)**
    A robust, stable, and comprehensive test suite allows agentic coding tools (like Claude Code and Codex CLI) to "fly" with the work. TDD forces clarity by transforming uncertainty into executable expectations. Prompt the AI to generate tests that describe the feature’s expected behavior *before* writing implementation code; this exposes assumptions and vague logic early.

4.  **Manage and orchestrate agents**
    Getting good results from a coding agent feels like a "very weird form of management" or collaboration. You must provide clear instructions, ensure the necessary context, and deliver actionable feedback on what they produce. The developer is managing a "growing army of weird digital interns".

5.  **Direct the AI toward reuse and improvement**
    Guide the AI toward the current and clean parts of your codebase, explicitly referencing reusable components and utility functions. You should encourage the agent to evaluate and proactively improve components if it identifies outdated logic or duplication.