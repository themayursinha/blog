---
layout: post
title: "MCP Visor: Runtime Policy Enforcement"
subtitle: "A deterministic proxy that decides, approves, and audits every MCP tool call."
date: 2026-05-25
categories: [ai, security, architecture]
tags: [ai, security, architecture, agents, mcp, policy, appsec]
description: "MCP Visor turns MCP tool execution into a deterministic policy boundary: inspect the tool call, enforce the rule, redact secrets, require approval, and log the decision before the action reaches the server."
share-img: /img/circuit.svg
related_posts:
  - MCP Security Is a Supply Chain Risk
  - Epistemic Security for AI Agents
  - Threat Modeling Autonomous AI Agents in Production
---

In my last piece on [MCP security]({% post_url 2026-05-06-mcp-security-the-new-supply-chain-risk-for-ai-agents %}), I argued that MCP servers are not harmless plugins. They are executable trust boundaries. They decide what an agent can see, which tools it can reach, which resources enter context, and which external systems are now one model decision away from mutation. That argument naturally leads to a practical question: where should enforcement live?

I built [MCP Visor](https://github.com/themayursinha/mcp-visor) as one answer to that question. It is a runtime policy enforcement proxy for MCP tool execution. It sits between an MCP client and an MCP server, intercepts every `tools/call`, evaluates deterministic policy, redacts secrets, detects dangerous tool chains, gates high-risk calls behind human approval, and writes structured audit logs. The important part is what it does not do: it does not ask another LLM whether a tool call is safe.

That distinction matters because prompt injection is a persuasion attack against the model. A policy engine should not be persuadable.

## The boundary that was missing

The basic MCP flow is clean: an agent discovers tools, chooses a tool, sends a `tools/call`, and receives a result. The problem is that most implementations treat the call as the enforcement boundary. If the model decides to call the tool and the server accepts the request, the action happens. That is not enough once tools can read files, query databases, create pull requests, send Slack messages, execute shell commands, or change cloud infrastructure.

MCP Visor inserts a boring but necessary step before execution:

```text
AI agent -> mcp-visor proxy -> policy decision -> allow / deny / approve / redact -> MCP server
```

The proxy does not try to infer whether the model "meant well." It evaluates concrete runtime facts: server name, tool name, arguments, client identity, risk classification, time restrictions, recent tool history, redaction patterns, and approval requirements. That makes the enforcement point closer to application authorization than model alignment. The agent can be confused. The policy path still has to be deterministic.

## What happens on every tool call

The proxy starts the MCP server as a child process, performs the normal initialize handshake, and then relays JSON-RPC messages between the client and server. Most messages pass through unchanged. `tools/call` is the special case because that is where authority turns into action.

For each intercepted call, Visor runs a small ordered pipeline. It redacts secrets in arguments before forwarding anything downstream. It blocks sensitive file paths such as `.env`, private keys, credentials, and `.ssh` material. It checks whether the server and tool are registered, whether the default action is deny, whether argument rules pass, whether identity and time restrictions apply, whether the call matches a dangerous chain, and whether approval is required. Only then does it forward the modified request to the MCP server.

Server responses get inspected on the way back too. If output contains configured secret patterns, Visor redacts the result before the agent sees it. This is not a complete prompt-injection defense, and it should not be marketed as one. It is a practical control for keeping obvious secrets out of tool outputs and audit trails.

## Policy should look like authorization

The policy model is intentionally plain YAML. A useful policy should be readable by the person who owns the risk, not only by the person who wrote the proxy. The default posture is deny by default, then allow specific servers and tools under specific conditions.

For example, a developer policy can allow `file_read` while blocking sensitive paths, allow a narrow set of shell commands, require approval for writes, deny destructive GitHub operations, and prevent read-to-send exfiltration chains:

```yaml
version: "1.0"
default_action: deny

servers:
  - name: "filesystem"
    allowed: true
    tools:
      - name: "file_read"
        allowed: true
        risk: medium
        rules:
          - type: deny_path
            patterns:
              - "**/.env"
              - "**/*.pem"
              - "**/.ssh/**"

  - name: "shell"
    allowed: true
    tools:
      - name: "shell_exec"
        allowed: true
        risk: critical
        approval_required: true
        rules:
          - type: deny_command_pattern
            patterns:
              - "rm\\s+-rf\\s+/"
              - "curl.*\\|.*(bash|sh)"
              - "bash\\s+-i\\s+>&"

tool_chains:
  - name: "prevent_exfiltration_via_slack"
    sources:
      - server: "*"
        tool_pattern: "(file_read|database_query)"
    sinks:
      - server: "slack"
        tool_pattern: "slack_send_message"
    action: deny
    within_calls: 3
```

This is the MCP version of object-level authorization. A token or model decision is not enough. The system still needs to ask whether this client can use this tool, with these arguments, against this server, in this context, after the previous calls that already happened.

## Chains are where the interesting risk appears

Single-tool policy is necessary, but it misses an important class of agent behavior. A `file_read` can be legitimate. A `slack_send_message` can be legitimate. A `database_query` can be legitimate. The dangerous behavior may be the sequence, not the isolated call.

That is why Visor keeps session-level call history and evaluates source-to-sink chains. A policy can say: if a read-like tool was used recently, deny a send-like tool within the next few calls. This catches the practical exfiltration pattern where an injected instruction tells the agent to read a file and then post the contents somewhere else. The agent may see two ordinary steps. The enforcement layer sees a flow.

This is also why runtime controls need state. Static review can tell you a tool exists. Runtime history tells you what the agent is doing with it. For AI systems, that difference matters because the plan often emerges step by step inside the interaction.

## Approval is part of the control plane

Some calls should not be silently allowed just because they match policy. Shell execution, file writes, pull request creation, external messaging, or production data access may be valid in the right workflow and still too risky to run without a human checkpoint.

In v1, Visor uses a simple file-based approval flow. When a high-risk call requires approval, it writes a request file, waits for an approval marker, and fails closed on timeout. That is not fancy, but the security property is the point: approval is enforced by the proxy, not by the agent. A compromised or confused model cannot skip the step because the call never reaches the MCP server until the proxy releases it.

This is the kind of boring primitive I want more agent infrastructure to have. Human-in-the-loop controls are often discussed as product UX. They also need to exist as enforceable runtime gates.

## Audit logs are not decoration

If an agent can act through tools, audit logs need to explain more than "something happened." They should capture which session made the call, which client identity was involved, which server and tool were used, which arguments were passed after redaction, which decision was made, why the decision was made, what risk level was assigned, and whether a chain rule fired.

Visor writes structured JSONL events for session starts, session ends, policy loads, allowed calls, denied calls, approval-required calls, and detected chains. The logger redacts arguments before writing. That matters because audit logs often become the second place secrets leak after the original incident.

The larger lesson is that agent audit trails need to preserve decision context. Security teams will not be able to investigate MCP incidents from raw chat transcripts alone. They need records at the tool boundary.

## What Visor is not

MCP Visor is a control plane primitive, not a complete agent security platform. That distinction is important.

It does not cryptographically attest policy decisions yet. It relies on host filesystem permissions for policy and audit log integrity. v1 supports stdio-oriented local server proxying; remote transports need stronger mutual authentication. Session state is in memory, so chain detection history does not survive restart. Output redaction is not the same thing as robust prompt-injection sanitization. A malicious MCP server can still return persuasive text that causes the model to attempt another dangerous call, although the next call still has to pass policy.

Those limitations are not footnotes. They define the shape of the next layer: signed audit events, policy signing, webhook approvals, mTLS for remote servers, HTTP/SSE transport support, sandboxed execution, and deeper host telemetry. The point of v1 is to make the runtime tool boundary real enough that those controls have somewhere to attach.

## The practical lesson

The more I work on agent security, the more convinced I am that the control plane has to sit close to action. Prompt hardening helps. Better model behavior helps. Safer tool descriptions help. But once an agent can mutate the world, the decisive question is simpler: what code path gets to say no?

For MCP, that code path should not be hidden inside the model. It should be outside the model, deterministic, observable, and boring in the best possible way. The policy engine should not care how convincing the injected webpage sounded. It should care that the agent is trying to run `curl ... | bash`, read `.env`, or send freshly queried customer data to an external sink.

MCP made it easy to connect agents to tools. The next phase is making those connections governable. MCP Visor is my attempt to turn that idea into a small, inspectable runtime boundary: one proxy, one policy file, one audit trail, and a clear place for security teams to enforce the rules before the tool executes.
