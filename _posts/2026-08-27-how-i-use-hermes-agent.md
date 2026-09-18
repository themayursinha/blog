---
layout: post
title: "How I Use Hermes Agent as a Personal Operating System"
subtitle: "A technical walkthrough of the gateway, context stack, tools, memory, skills, Kanban, cron, profiles, and private infrastructure behind my daily AI workflow."
date: 2026-08-27
categories: [ai, architecture]
tags: [ai, agents, hermes-agent, automation, kanban, skills, memory, tailscale, telegram, obsidian, security, infrastructure]
description: "How I run Hermes Agent on a private Linux server and use Telegram, Tailscale, persistent memory, skills, Kanban, cron, profiles, tools, and verification gates as one practical AI operating system."
share-img: /img/how-i-use-hermes-agent.svg
related_posts:
  - Your System Prompt Is a God Class
  - The Coding Agent Is Untrusted
  - "Spec Engineering: The Missing Layer in AI Agent Security"
---

Most AI assistants wait inside a browser tab. I wanted something different: an agent that could receive a request from my phone, inspect the real state of my systems, create durable work, execute it, verify the result, and leave behind evidence I could review later.

That is how I use [Hermes Agent](https://github.com/NousResearch/hermes-agent). It runs continuously on a private Linux host. Telegram is my most common control surface. Tailscale gives me private access to its dashboards. Hermes can work with files, terminals, browsers, APIs, scheduled jobs, specialized profiles, and external tools. More importantly, it can preserve context across sessions and turn successful procedures into reusable skills.

Calling this a chatbot misses the useful part. In my setup, Hermes is an operating layer between intent and execution. The language model reasons about the request, but the surrounding system carries the state: the gateway keeps sessions alive, Kanban tracks work, Git records code, Obsidian preserves knowledge, cron wakes recurring jobs, and verification checks whether an action produced the expected result.

This article explains that architecture, including the parts that work well, the failure modes I have hit, and the security boundaries I use. It is a description of my current system, not a claim that an AI agent should have unrestricted access to every machine or account.

## The architecture in one view

My setup has six layers:

1. **Control surfaces:** Telegram for daily interaction, plus the CLI, desktop application, and private dashboards when I need more detail.
2. **The gateway:** a persistent service that routes messages, restores sessions, runs scheduled jobs, and sends results back to the right conversation.
3. **The context stack:** identity, user context, project rules, bounded memory, session recall, and on-demand skills.
4. **The execution plane:** terminal commands, file operations, browsers, APIs, MCP servers, computer control, and delegated workers.
5. **Durable state:** Hermes Kanban for work, Git for code, Obsidian for knowledge, and SQLite-backed session history for recall.
6. **The private boundary:** Private dashboard listeners are reachable through my tailnet, not through a public listener.

{% include figure.html src="/img/how-i-use-hermes-agent.svg" label="Fig. 1 · My Hermes Agent operating architecture" caption="Telegram is the daily control surface. The gateway joins model reasoning to a layered context system, real execution tools, and durable systems of record. The dashboard listeners are restricted to Tailscale addresses and tailnet policy." alt="Architecture diagram showing Telegram, CLI and desktop clients reaching a Hermes gateway on a private Linux server, connected to model routing, context, execution tools, Kanban, Git, Obsidian and private dashboards" %}

The important design choice is separation. I do not ask one conversation to remember every fact, hold every task, and preserve every artifact. Conversations are temporary. The systems around them are durable.

## The always-on execution host

Hermes can run on a laptop or server. Its terminal and file execution can target local, Docker, SSH, Singularity, Modal, Daytona, and Vercel Sandbox backends. I use a dedicated Linux machine because I want the agent available when my laptop is closed. The host holds the working directories, repositories, local dashboards, automation scripts, model tooling, and the default Hermes profile.

The installation itself is simple:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
hermes setup
hermes doctor
```

The [official installation documentation](https://hermes-agent.nousresearch.com/docs/getting-started/installation) covers the supported platforms and installation modes. I use the Git-based installation because I sometimes inspect the source and carry a tightly scoped local fix while waiting for an upstream change.

The persistent component is the [Hermes messaging gateway](https://hermes-agent.nousresearch.com/docs/user-guide/messaging). On Linux, I run it as a user systemd service with linger enabled, so it survives logout and returns after reboot:

```bash
hermes gateway install
hermes gateway start
hermes gateway status
```

The gateway does more than connect Telegram. It maps incoming messages to sessions, restores conversation state, runs the cron scheduler, and delivers output back to the originating platform. This means a phone message can start work on the private host without an SSH session or an open terminal on my MacBook.

I still use the CLI for setup, debugging, repository work, and anything where I want a dense stream of tool output. The [desktop application and web dashboard](https://hermes-agent.nousresearch.com/docs/user-guide/features/web-dashboard) are useful for session browsing, configuration, and Kanban. Telegram remains the default because it lowers the activation energy. I can capture an idea, approve a safe next step, or ask for a status check while away from my desk.

## Private access through Tailscale

I do not expose the Hermes dashboard or my personal dashboards to the public internet. Each service binds to the machine's Tailscale address. My other devices reach it through the tailnet. [MagicDNS](https://tailscale.com/kb/1081/magicdns) lets me use the machine name rather than memorize an address. It is only name resolution. [Tailnet grants or ACLs](https://tailscale.com/docs/features/access-control) define which identities can reach a service.

A simplified dashboard command looks like this:

```bash
hermes dashboard \
  --no-open \
  --host <tailscale-ip> \
  --port 9119
```

When a service binds to a non-loopback address, I configure its authentication first. I also verify the listener after every deployment change:

```bash
tailscale ip -4
ss -lntp | grep ':9119'
curl -fsS http://<tailscale-ip>:9119/api/status |
  jq '{auth_required, auth_providers}'
```

The expected result is a listener on the specific tailnet address, not `0.0.0.0` or `[::]`, plus `auth_required: true` and at least one configured authentication provider. `/api/status` is intentionally public, so tailnet policy must restrict who can reach the port. Tailscale provides encrypted transport. My tailnet policy controls which identities can reach the service, while application authentication protects the dashboard itself.

I use the same pattern for temporary blog previews. Jekyll binds to the current Tailscale address on port 4000. I can review the rendered article from another device without pushing a draft to GitHub Pages:

```bash
bundle exec jekyll serve \
  --future \
  --host <tailscale-ip> \
  --port 4000
```

The preview server is disposable. I stop it after review or publication. Development servers should not quietly become permanent infrastructure.

## Telegram is an interface, not the system of record

A common failure in agent setups is to treat chat history as the database. That works until the session is reset, compressed, difficult to search, or full of unrelated work.

I use Telegram to express intent and receive results. I use other systems to hold truth:

| Information | System of record | Why |
| --- | --- | --- |
| Work in progress | Hermes Kanban | Durable status, ownership, dependencies, evidence |
| Code and public artifacts | Git | Reviewable diffs, commits, CI, rollback |
| Decisions and long-lived knowledge | Obsidian | Human-readable notes and linked context |
| Conversation history | Hermes session store | Recall of what was discussed and decided |
| Stable preferences and environment facts | Hermes memory | Small, high-signal context injected into new sessions |
| Reusable procedures | Hermes skills | Operational knowledge loaded only when relevant |

This separation changes how I write requests. I can say, "Turn this into a card, execute it, verify it, and log the decision." The response is not the final artifact. The response reports what changed in the underlying systems.

My preferred closeout format is deliberately plain:

```text
Changed: the concrete result
Evidence: the file, URL, test, listener, or commit
Next action: one thing for me to do
Logged: Kanban and Obsidian locations
```

That final line is more important than it looks. It prevents useful work from dying inside a chat transcript.

## The context stack: identity, rules, memory, and recall

A useful agent needs more than a long system prompt. It needs different kinds of context with different lifetimes.

Hermes gives me several layers:

- `SOUL.md` defines the agent's identity, voice, operating principles, and stable relationship to me.
- A durable personal profile contains my longer-term goals, constraints, background, and risk boundaries.
- Project context files such as `AGENTS.md` define repository-specific conventions and commands.
- Bounded memory stores small, stable facts that should appear in future sessions.
- Session search retrieves the actual historical conversation when I refer to earlier work.
- Skills supply detailed procedures for a task only when that procedure is needed.

The [personality documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/personality) makes an important distinction: global identity belongs in `SOUL.md`, while project instructions belong in project context. The [context-file system](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files) loads the applicable project context from the Git root to the working directory at session start, then progressively discovers nested context as tools enter subdirectories. The same Hermes instance can therefore follow different rules in a Go security proxy, a Jekyll blog, and a research repository.

I use this separation aggressively. A repository may require boring Go, minimal dependencies, test-first fixes, and a clean public history. My personal operating context contains broader goals and communication preferences. Security research profiles have stricter boundaries and different tools. None of those rules should leak casually into an unrelated project.

### Why bounded memory is better than a giant profile

Hermes memory is intentionally small. The [memory system](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory) separates agent notes from the user profile and injects a frozen snapshot at session start. That forces prioritization.

I save facts that reduce future steering:

- stable preferences;
- recurring environment conventions;
- durable project boundaries;
- corrections that should not need to be repeated;
- small facts that change how the agent should act.

I do not save task progress, temporary status, commit hashes, or a dump of everything discussed. Those belong in Kanban, Git, Obsidian, or session history. If a fact will be stale next week, it is usually bad memory.

Session search solves a different problem. If I ask, "Where did we leave the dashboard redesign?", Hermes can search prior conversations and recover the surrounding messages. Memory supplies the stable rule; session search supplies historical evidence. Mixing the two produces bloated memory and weak recall.

## Skills turn experience into reusable procedure

The feature that changed my usage most is the [Hermes skills system](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills). A skill is an on-demand knowledge document that defines when to use a procedure, the exact sequence, known pitfalls, and verification steps. Hermes follows the Agent Skills specification and loads skills progressively, so a large library does not have to sit in every prompt.

My skills cover work such as:

- building and previewing this Jekyll site;
- operating Hermes Kanban safely;
- reviewing GitHub pull requests;
- deploying private services on my Linux host;
- maintaining Obsidian notes;
- researching AI security and academic papers;
- handling Germany-related administrative documents;
- running authorized security research in isolated environments.

The value is not that a skill contains facts I could search for. It contains the mistakes I do not want to repeat. My blog workflow, for example, records that a successful Jekyll build does not prove the article is ready. The image may be missing, a related-post title may not match, the SVG may render badly, or the preview may be bound to every interface. The skill turns those failures into a checklist and a verification script.

This creates a practical learning loop:

1. Execute a real task.
2. Notice what failed or required repeated reasoning.
3. Repair the workflow.
4. Save the proven sequence as a skill, or patch an existing skill.
5. Make that procedure available for Hermes to load on demand the next time a similar request arrives.

I promote a procedure only when it is reusable. Task status does not belong in a skill. Neither does a private data dump. Good skills are compact operational knowledge: triggers, exact steps, pitfalls, safety boundaries, and proof of completion.

## Tools make the agent useful, and dangerous

Language models can propose actions. Tools let them change the world.

Hermes organizes tools into configurable [toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools). In my normal profile, the important categories are:

- terminal and process control;
- file reading, searching, writing, and patching;
- web search and page extraction;
- browser and desktop automation;
- image inspection;
- GitHub and cloud APIs;
- memory and session recall;
- cron and Kanban;
- delegated subagents;
- MCP servers for specialized applications.

I prefer tool use over plausible prose. If I ask whether a service is listening, Hermes should run `ss`. If I ask whether a build passes, it should run the build. If it edits a file, it should run the relevant test. If it changes an external record, it should read the record back.

This produces a simple rule:

> A description of work is not evidence that the work happened.

For local files, the file-writing tools verify that bytes landed. For code, tests and linters provide evidence. For a web service, the evidence is a process state, a specific listener, and an HTTP response from the exact address. For a public release, the evidence is not the `git push`; it is the deployment workflow plus the live URL.

### I batch read-only discovery before changing state

The fastest way to make an agent unreliable is to let it edit the first thing it sees. I use a discovery-first pattern:

1. Read the current configuration and repository rules.
2. Inspect existing work and unrelated changes.
3. Check prerequisites and live state.
4. Decide the smallest useful change.
5. Execute the change.
6. Verify the exact result.

Independent reads run in parallel. Dependent actions remain sequential. This keeps the workflow fast without racing writes or making decisions from partial context.

Programmatic tool calling is useful when a task needs several mechanical calls with filtering between them. Instead of sending huge raw outputs back through the model, a small Python function can query several sources, reduce the results, and return only the part that needs judgment. I use that for inventories, link checks, board reconciliation, and evidence parsing.

## Kanban is my durable execution ledger

For work that takes more than a few minutes or must survive a crash, I create a [Hermes Kanban](https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban) card before deep execution. This is not ceremony. It is how I prevent the chat from becoming a graveyard of unfinished intentions.

A good card contains:

- the objective;
- acceptance criteria;
- safety boundaries;
- the expected artifact;
- the evidence required to call it done.

A simplified flow looks like this:

```bash
hermes kanban --board build-code create \
  "Write and preview a technical article" \
  --body "Create the post and figure. Build, verify, and serve privately. Do not publish."

hermes kanban --board build-code claim <card-id> --ttl 7200
hermes kanban --board build-code comment <card-id> "Starting with repository and source checks."
```

I use separate boards for long-lived domains such as code, research, career, life administration, and infrastructure. A card is a unit of work, not a note to remember someday. Once work starts, it should move through execution, verification, logging, and completion. If it cannot proceed, it should be blocked with the actual reason.

Kanban becomes more powerful when tasks are assigned to named Hermes profiles. The gateway includes a dispatcher that can claim ready work and start the assigned profile. Each board has durable SQLite state, task events, runs, comments, and workspaces. This gives me an audit trail that survives conversation compression and process restarts.

### Dependency graphs need real semantics

I learned not to use dependency links as visual grouping. In my board, a child cannot run until its parent is complete. That is a hard gate. Linking a verification task under an unfinished umbrella can deadlock the work if the umbrella itself waits for that verification.

I use dependencies only when one result genuinely blocks another. For grouping, I use board structure, naming, comments, or an executive view. This sounds minor, but it is the difference between a diagram that looks organized and an execution graph that can actually run.

## Delegation for parallel reasoning, profiles for durable separation

[Hermes delegation](https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation) starts subagents with fresh conversation context and their own terminal sessions. I use it when several independent questions can be researched at the same time: one worker can inspect documentation, another can review a draft, and a third can analyze a repository. The parent remains responsible for combining and verifying their results.

A delegated result is a candidate, not proof. A child can misunderstand the task or claim that an external action succeeded. For file writes, deployments, and publishing, I verify the artifact from the parent context before reporting success.

[Profiles](https://hermes-agent.nousresearch.com/docs/user-guide/profiles) solve a different problem. A profile has its own Hermes state directory, configuration, skills, memory, sessions, and model route. I use profiles for durable specialization and state separation:

- the default profile handles my general operating context;
- coding profiles work in repository-scoped environments;
- reviewer profiles are independent from builders;
- security-lab profiles are separated from normal personal work;
- low-cost workers handle bounded collection tasks while stronger models review consequential decisions.

This reduces context and configuration leakage, but it does not create an operating-system security boundary. On the local backend, profiles still run as the same Unix user and can access the same filesystem and user-level CLI credentials unless I add a separate Unix identity, sandbox, remote backend, or equivalent isolation. I configure each profile with only the context and tools its role needs, while using stronger execution isolation where the risk requires it.

I also separate reasoning roles from model brands. Models are replaceable workers. The stable part is the contract: what inputs the role receives, which tools it can use, what evidence it must return, and who verifies it.

## Model routing is a runtime choice

Hermes is provider-agnostic. I can switch between hosted providers, subscription-backed OAuth routes, and local or OpenAI-compatible endpoints without rebuilding the operating system around the model.

I route by consequence:

- high-stakes writing, architecture, security claims, and final review go to a stronger reasoning model;
- bounded extraction, inventory, and formatting can go to a cheaper worker;
- deterministic checks should be scripts, not language-model judgments;
- local models are useful for low-risk background tasks after tool-call behavior is tested.

The point is not to build a complicated model marketplace. It is to avoid paying frontier-model prices for work a script can do, while refusing to use a weak model as the final judge of a consequential claim.

Configuration is managed through the CLI rather than by casually editing YAML:

```bash
hermes model
hermes config get model.provider
hermes config get model.default
hermes fallback list
```

I treat provider labels as routing information, not as proof of billing, privacy, or entitlement. Those are separate facts that need their own verification.

## Cron turns the agent into a background system

The [Hermes cron system](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron) runs inside the gateway. Jobs execute in fresh sessions and can deliver their results to a messaging platform, save them locally, attach skills, run a script before the agent, or run as script-only checks with no model at all.

I use three types of scheduled work.

### Deterministic watchdogs

A watchdog should be silent when healthy. It checks a service, file, source, or timestamp and emits a message only on failure or meaningful change. These jobs do not need an LLM.

Examples include:

- checking whether a private dashboard responds;
- confirming a generated executive view is fresh;
- detecting a failed backup or stale feed;
- checking whether a local model endpoint is reachable.

Script-only jobs are cheaper, easier to test, and less likely to produce a confident but useless health summary.

### Collection and synthesis

Some jobs collect data with a script, then ask a model to summarize the changed portion. Examples include a weekly research digest or a repository activity review. I keep the collection deterministic and the interpretation bounded.

### Conversational briefings

Cron delivery is fire-and-forget by default. For a replyable briefing, I create the job with `attach_to_session: true` and use its origin, home-channel fallback, or one explicit platform chat target. Broadcast targets are not continuable. The prompt must still be self-contained because cron runs in a fresh session.

A simple fire-and-forget example is:

```bash
hermes cron create \
  "every monday 8am" \
  "Review the current Kanban commitments and return the three most important outcomes for this week." \
  --deliver telegram \
  --model <model> \
  --provider <provider> \
  --name "Weekly planning brief"
```

I pin the model and provider when repeatability matters. An unpinned job can still fail closed under Hermes's default drift guard after the global route changes. When a job should follow the new global route, I explicitly re-baseline its routing snapshot and test it before relying on delivery.

I avoid scheduling a full agent when a five-line script can decide whether anything changed. The scheduler should wake reasoning only when reasoning adds value.

## Obsidian is the durable knowledge layer

Kanban tells me what is moving. Obsidian tells me why it matters.

After meaningful work, Hermes updates the relevant project, system, or research note. My vault contains longer-lived decisions, architecture notes, operating procedures, research findings, and links between projects. Generated dashboards can read those canonical notes, but the dashboard is not allowed to become a second manually maintained truth.

The split is intentional:

- Kanban answers, "What must happen next?"
- Obsidian answers, "What did we learn, decide, or change?"
- Git answers, "What exact code or content changed?"
- Telegram answers, "What do I need to know right now?"

This is how I avoid a common automation failure: five surfaces that all look current but disagree with each other. When a summary view is generated, I verify its source timestamp and live content rather than assuming a healthy service means fresh data.

## Security boundaries and honest limitations

An agent with terminal, browser, and API tools has real authority. A polished personality file does not change that.

Hermes has a [defense-in-depth security model](https://hermes-agent.nousresearch.com/docs/user-guide/security) that includes command approvals, hard blocks, messaging authorization, secret redaction, and isolated execution backends. My own operating rules add several boundaries.

### Secrets stay out of chat and public artifacts

Credentials belong in the profile's secret store or environment file, not in prompts, Kanban cards, Git, screenshots, or articles. Secret redaction remains enabled. I never ask the agent to type passwords, payment details, private keys, or API tokens into a GUI.

### Network services bind narrowly

Private dashboards bind to a loopback or Tailscale address. I check the actual listener after changes. I do not use `0.0.0.0` merely because it is convenient.

### Profiles separate Hermes state, not operating-system authority

Normal personal work, coding, and authorized security research live in different profiles and workspaces. The security lab has its own routing and tools. I do not connect pentesting infrastructure to personal or legal workflows.

### Human decisions remain human

Publishing, merging consequential changes, sending external messages, payments, legal decisions, and destructive cleanup require my explicit direction. An agent can prepare and verify the work, but it should not manufacture consent.

### Prompt rules are not hard security controls

This is the most important limitation. A `SOUL.md` rule such as "do not publish without approval" is useful operational policy, but it is still instruction-following. It is not equivalent to an operating-system permission, a network policy, a protected credential boundary, or a deterministic enforcement proxy.

I therefore combine instruction-level rules with harder controls: scoped credentials, narrow network policy, repository protection, separate Unix identities or sandboxed execution where required, and explicit verification. Profiles remain a context and state boundary, not a sandbox. My current setup is a trusted personal operating environment, not a zero-trust multi-tenant platform.

## What a complete workflow looks like

This article itself is a good example.

I asked Hermes to write a detailed technical post and make it available on my private host through Tailscale for later review. A complete execution is not "produce Markdown." It is this sequence:

1. Load the blog, public-writing, Hermes, Kanban, and private-deployment procedures.
2. Read the durable user profile, blog style guide, and adjacent articles.
3. Inspect the repository status so unrelated drafts remain untouched.
4. Create a Kanban card with the objective, acceptance criteria, privacy boundaries, and required evidence.
5. Check the official Hermes documentation and live non-secret system state.
6. Write the article and a matching SVG architecture figure.
7. Verify related-post titles, local assets, external links, frontmatter, and the absence of prohibited punctuation or private data.
8. Build the site with Jekyll.
9. Render the SVG and page in a real browser, then inspect clipping, overlap, layout, console errors, and mobile behavior.
10. Start Jekyll on the current Tailscale address, verify the exact listener, and request the exact article URL.
11. Log the result in Kanban and Obsidian.
12. Stop before commit or publication. I review the private preview first.

Every step has a different kind of evidence. The Markdown file proves the draft exists. The Jekyll build proves the site generator accepts it. The browser proves it renders. The listener proves the exposure boundary. The HTTP request proves the URL works. Repository status and branch history show the current local state. Remote-branch and live-deployment checks show whether the draft is present on the intended remote or public site at review time. Historical push or publication claims require provider or deployment audit logs.

That is the difference between content generation and an operating workflow.

## Failure modes I have learned to design around

The system improved because it failed in specific ways.

**A green build can hide a broken article.** Jekyll may build even when a related-post title is wrong or a figure looks unreadable. I added asset checks and browser rendering.

**A service can be healthy on the wrong interface.** Systemd may report `active` while the process listens on every network. Listener verification is a separate gate.

**A task board can become storage instead of execution.** Creating cards without claiming, executing, and closing them produces backlog theatre. Card creation now implies a lifecycle.

**Dependency links can deadlock work.** I stopped using hard execution edges as visual grouping.

**A worker can report success without evidence.** Parent verification now checks the target file, URL, commit, or external record.

**Memory can become a stale dump.** I keep it bounded and move progress to systems designed for progress.

**Automation can become noisy.** Deterministic, change-only watchdogs replaced many recurring AI summaries.

**A model switch can break scheduled work.** Recurring jobs need explicit routing policy or a controlled way to follow the global route. Model configuration is operational state, not decoration.

**Generated dashboards can disagree with canonical notes.** I now treat them as read-only views and verify freshness from the source.

These are not exotic AI failures. They are ordinary distributed-systems and operations failures appearing inside an agent workflow: stale state, ambiguous ownership, weak contracts, missing idempotency, poor isolation, and unverifiable success.

## What I would copy first

If I were rebuilding this system from scratch, I would not begin with dozens of agents or a large tool catalog. I would build five things in order.

1. **One always-on gateway** connected to one private messaging surface.
2. **One explicit context hierarchy** separating identity, user facts, project rules, memory, and skills.
3. **One durable task board** with acceptance criteria and evidence fields.
4. **One knowledge store** for decisions and lessons outside chat.
5. **One verification discipline** that checks the real target after every state change.

Only after that would I add worker profiles, cron chains, extra MCP servers, model routing, and dashboards. More tools increase the attack surface and the number of states that can drift. They do not automatically increase useful autonomy.

The [Hermes documentation](https://hermes-agent.nousresearch.com/docs/) describes the product primitives. I added the operating policy: which system owns each kind of state, which actions require human direction, and what evidence closes a task.

## The operating principle

I do not want an agent that sounds intelligent while waiting for me to translate every answer into action. I want one that can take bounded action, prove what happened, remember the right lessons, and leave the system easier to operate next time.

The model is not the operating system. It is one reasoning component inside it. The operating system is the set of boundaries, state stores, procedures, and verification loops around the model.

That is how I use Hermes Agent: not as a browser tab that answers questions, but as a private, evidence-driven execution layer for the work I want to finish.
