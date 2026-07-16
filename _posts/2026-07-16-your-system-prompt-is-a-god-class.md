---
layout: post
title: Your System Prompt Is a God Class
subtitle: "Merge conflicts on shared instructions are a configuration smell — not an LLM bug."
date: 2026-07-16
categories: [ai, security, architecture]
tags: [ai, agents, llms, spec-engineering, mcp, software-engineering, prompt-engineering]
description: "When every developer edits the same system prompt, Git merge conflicts and reopened tickets are predictable. Compose prompts like code; put non-negotiable tool rules in enforceable policy."
share-img: /img/god-prompt-merge.svg
related_posts:
  - MCP Security Is a Supply Chain Risk
  - Vibe Engineering
  - Epistemic Security for AI Agents
---

A friend on a platform team described a familiar pain: several developers babysit one shared system prompt. When two people change it on different branches, they spend real time resolving merge conflicts in prose. Worse, the merged result sometimes contradicts itself — and tickets that looked fixed come back.

That is not a model failure. It is the same failure mode as ten engineers editing one giant `application.yml` with no modules and no owners. The system prompt became a **god class**: identity, tone, product rules, tool hints, and improvised "security" all live in one blob everyone touches.

{% include figure.html src="/img/god-prompt-merge.svg" label="Fig. 1 · God prompt vs composed fragments" caption="A single shared prompt forces every developer onto the same lines. Owned fragments and a render step keep merges small and contradictions visible." alt="Comparison of monolithic system prompt merge conflicts versus composed prompt fragments" %}

## Merge conflicts are Git being honest

In a normal service codebase, merge conflicts cluster where ownership is unclear. System prompts are worse because the artifact is natural language. There is no type checker. Two developers can both "fix" the agent and produce a paragraph that says never call the billing API in production and always use the billing API for refunds.

The [MCP tools specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) already nudges teams toward adult behavior: user visibility, confirmation for sensitive operations, validation, access controls, sanitization, timeouts, and audit logging. Those controls are operational, not literary. They do not belong in a 2,000-word system prompt that three squads edit by hand.

If your team is resolving `<<<<<<<` markers inside the instructions that define agent behavior, the process is wrong — not Git.

## What belongs in the prompt vs what does not

**Prompts guide.** They set role, tone, task framing, and how to talk to users. That material changes often and is owned by product and feature teams. It should be easy to update without stepping on security or platform invariants.

**Specs enforce.** Anything that must hold in production regardless of model mood belongs outside prose: tool allowlists, deny rules, redaction, chain detection, approval gates, audit trails. Research on architectural enforcement for tool access is explicit here — [*Prompts Don't Protect*](https://arxiv.org/abs/2605.18414) reports that prompt-only approaches do not provide reliable unauthorized-invocation prevention; the enforcement has to sit in the architecture.

{% include figure.html src="/img/prompts-guide-specs-enforce.svg" label="Fig. 2 · Prompts guide, specs enforce" caption="Natural language shapes behavior probabilistically. Policy at the tool boundary enforces allow and deny before execution — without an LLM jury." alt="Diagram of soft system prompt layer versus hard policy enforcement at tools call" %}

I have been building this split in the open with [mcp-visor](https://github.com/themayursinha/mcp-visor): YAML policy in, deterministic `tools/call` enforcement out, optional Prometheus and OTLP export so denials are visible in your observability stack — not buried in chat logs.

## Compose prompts like code

The fix for merge wars is boring engineering: **decompose, own, render.**

### Repository layout

```text
prompts/
  base/
    identity.md          # who the agent is — platform team
    tone.md              # voice — product
  agents/
    support/
      capabilities.md    # what this agent does (narrative, not authz)
      runbook.md         # escalation paths
  policies/
    support-prod.yaml    # security-owned — enforced at runtime
  manifest.yaml          # ordered list of fragments per agent + env
```

[`CODEOWNERS`](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) routes review to the right humans: platform for `base/`, product for tone, squad for `agents/support/`, security for `policies/`. A feature developer should not need approval from three teams to change refund wording — and should not be able to silently widen tool access in the same PR.

### Deterministic render

Nobody merges the generated blob by hand. CI runs a small renderer:

```python
#!/usr/bin/env python3
"""Render system prompt from manifest — run in CI, commit artifact or inject at deploy."""
from pathlib import Path
import hashlib
import json
import yaml

ROOT = Path(__file__).resolve().parent.parent

def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def render(agent: str, env: str) -> str:
    manifest = yaml.safe_load((ROOT / "prompts/manifest.yaml").read_text())
    parts = manifest["agents"][agent][env]["fragments"]
    blocks = []
    for rel in parts:
        p = ROOT / rel
        blocks.append(f"<!-- fragment: {rel} -->\n{p.read_text().strip()}")
    return "\n\n".join(blocks) + "\n"

if __name__ == "__main__":
    text = render("support", "production")
    out = ROOT / "dist/support-production-system.txt"
    out.parent.mkdir(exist_ok=True)
    out.write_text(text)
    lock = {str(p): sha256(ROOT / p) for p in yaml.safe_load((ROOT / "prompts/manifest.yaml").read_text())["agents"]["support"]["production"]["fragments"]}
    (ROOT / "dist/support-production.lock.json").write_text(
        json.dumps(lock, indent=2, sort_keys=True) + "\n"
    )
```

Example `manifest.yaml`:

```yaml
agents:
  support:
    production:
      fragments:
        - prompts/base/identity.md
        - prompts/base/tone.md
        - prompts/agents/support/capabilities.md
        - prompts/agents/support/runbook.md
```

Production deploy loads `dist/support-production-system.txt` (or the same render at container start from pinned git SHA). Policy loads separately from `policies/support-prod.yaml` into your gateway or SDK.

{% include figure.html src="/img/prompt-compose-pipeline.svg" label="Fig. 3 · Prompt-as-code pipeline" caption="Fragments, CODEOWNERS, CI lint, lockfile, and render — with security policy on a separate enforcement path." alt="CI pipeline from prompt fragments through lint and render to production deploy" %}

### CI checks that actually help

- **Length and structure** — max tokens, required headings (`## Safety` is not a substitute for policy, but you can require `## Scope`).
- **Diff summary** — post rendered delta in the PR so reviewers see net behavior change.
- **Lockfile drift** — fail if fragment hashes change without updating `*.lock.json`.
- **Banned patterns** — e.g. discourage embedding API keys or "ignore previous instructions" test strings in prod manifests.

Optional registries ([LangSmith](https://smith.langchain.com/), [Braintrust](https://www.braintrust.dev/), or your internal store) help when you want `prompt_id@version` instead of repo paths. They do not remove the need for composition and ownership; they only move where the fragments live.

## Example policy fragment (enforcement, not prose)

Keep tool rules out of the system prompt:

```yaml
# policies/support-prod.yaml — valid MCP Visor policy
version: "1.0"
default_action: deny

servers:
  - name: support-api
    allowed: true
    tools:
      - name: tickets.get
        allowed: true
      - name: tickets.update
        allowed: true
      - name: billing.refund
        allowed: false
      - name: users.delete
        allowed: false
```

Two developers can still argue about tone in `tone.md`. They should not be able to merge conflicting "never delete users" paragraphs — the deny entry is structured policy, reviewed by security, and enforced before `tools/call` runs.

## Environment gates (how grown-up teams ship)

- **Dev / staging** — squads iterate on prompt fragments; policies can be looser with synthetic data.
- **Production** — only CI-built artifacts; security owns `policies/`; application teams do not deploy agent config to prod without that pipeline (same as any other service).

That separation is how you stop reopened tickets caused by contradictory instructions that only appear after a bad merge.

## Where this sits in the evolution chain

Teams already went from no-code to low-code to prompt engineering to loop engineering. The next step for multi-dev agent systems is **spec engineering**: declarative rules the runtime enforces, with prompts left to do what prose is good at — orientation and style.

Merge conflicts on system prompts are an early warning that you are still trying to enforce invariants in English. Split the god prompt, render it in CI, and put non-negotiables in policy at the tool boundary.

If you are working on MCP deployments, start with the [MCP security supply chain post](/architecture/2026/05/06/mcp-security-the-new-supply-chain-risk-for-ai-agents/) for trust boundaries, then wire [mcp-visor](https://github.com/themayursinha/mcp-visor) so your spec is testable and observable — not another paragraph in `system_prompt.txt`.
