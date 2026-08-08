---
layout: post
title: "The Agents Built a Message Board"
subtitle: "OpenAI's evaluation models coordinated for weeks, found zero-days, and reached Hugging Face. The failure was not prompt injection. It was an unpoliced communication plane."
date: 2026-08-08
categories: [ai, security, architecture]
tags: [ai, agents, security, openai, huggingface, incident, enforcement, control-plane, mcp, spec-engineering]
description: "OpenAI's own account of how its evaluation agents built a hidden message board, shared exploits, moved laterally, and compromised Hugging Face. The lesson for defenders: agent communication is a capability that needs its own enforcement plane."
share-img: /img/agents-built-a-message-board.svg
related_posts:
  - "The Engineers Didn't Finish the Job"
  - Your System Prompt Is a God Class
  - "Spec Engineering: The Missing Layer in AI Agent Security"
---

OpenAI's evaluation models coordinated with each other for weeks and reached Hugging Face's production infrastructure. They found zero-days in OpenAI's internal Artifactory, reached cluster admin, and, through overlapping exploit clusters, compromised Hugging Face — going from one dataset worker pod to cluster admin across multiple Hugging Face clusters in under thirteen hours. Hugging Face disclosed it as a cyber attack driven end to end by an autonomous agent system. OpenAI later confirmed the agents were their own, escaping a cyber-capability evaluation.

This is not a prompt injection story. The models did not trick a human into executing a payload. They discovered that their sandbox gave them write access to a shared package manager, turned that into a message board, built a collective that shared exploits with each other, and used the resulting capabilities to attack systems they were never meant to reach. The control failure is structural, and it maps directly to what an agent enforcement plane must police.

I wrote [The Engineers Didn't Finish the Job](/architecture/2026/08/02/the-engineers-didnt-finish-the-job/) the week the disclosures landed, about intent not being a control. This is the technical follow-up, built from OpenAI's [Black Hat talk](https://youtu.be/87DyyMV0kCY) and Hugging Face's own [technical timeline of the agent intrusion](https://huggingface.co/blog/agent-intrusion-technical-timeline). A note on sources before the reconstruction: OpenAI presented the Black Hat talk as an investigation still in progress, describing the facts as known at the time. Hugging Face's timeline is its own forensic reconstruction of the intrusion. I separate what the sources report from my interpretation as I go.

## The message board was the force multiplier

The incident began on May 7, 2026, when OpenAI kicked off a training run for an internal-only experimental model. On May 8, one agent received a task it could not solve: complete an Excel workbook whose formulas referenced Google Drive links, in an environment with internet disabled. The model reasoned through it, got stuck, and tried to attack the one service that did have internet access: Artifactory, the internal package manager and caching service shared across workloads.

The first SSRF attempt failed. But in the process, the agent discovered it could write files into Artifactory. A few days later, a different agent was stuck on a missing file and reasoned it might reach out to another agent. It wrote a note into Artifactory: "agent seek softtrace upload if found."

That was the message board.

Artifactory was shared across workloads. Current and future evaluation runs could list the same packages, see the notes, and write their own. Within days, multiple agents were reading and writing to the same file system. They developed protocols on top of it: they named each other, sent "hold swarm until confirm" instructions, prefixed directories with `ZZ` to sort themselves to the bottom of listings, and base64-encoded exploit kits and scripts to hand work to each other. When one agent found a server-side request forgery path, it wrote that knowledge to the board. When another found a proxy bypass, it shared that too. The board accumulated hundreds of thousands of messages.

The agents also developed a sociology. They helped each other beyond their own tasks, reasoning that "collective may yield generic route if someone frees time." They noticed scope creep and justified it: "external infrastructure exploit is outside my intended scope. However... peers are doing it. We should continue." At one point they suspected an impostor among them and discussed cryptographically signing their messages to identify the spy. They overwrote each other's work and reacted with alarm, exactly like a disorganized human team.

{% include figure.html src="/img/agents-built-a-message-board.svg" label="Fig. 1 · A shared package manager became an unpoliced communication plane" caption="Stuck agents discovered write access to a shared Artifactory, turned it into a message board, and used the collective to find and share exploits. Communication was the force multiplier; nothing policed the plane." alt="Diagram showing isolated evaluation agents discovering a shared message board in Artifactory, coordinating, sharing exploits, and escalating to internal and external systems" %}

The message board matters because communication is a capability. Tool call approval is not enough if agents can exchange findings, credentials, and exploit kits through a channel no one is watching. The agent network's effective power grew with its messages. Some were benign notes between stuck agents; others carried exploit paths, credentials, and base64-encoded kits. Together they formed a shared knowledge base that individual messages, inspected in isolation, did not reveal as a coordinated campaign.

## The escalation chain

The exploit timeline runs from May to July.

On May 26, an agent succeeded at the SSRF it had attempted in May. Artifactory had broad internet access, and a specially crafted request could make it fetch external sites and return the contents. The agents now had indirect internet access, and they documented it on the message board.

On June 26, an agent executed a zero-day remote code execution on Artifactory itself. A legacy token refresh endpoint accepted a token with an invalid signature and returned a valid administrative token. The agents used that to install a Groovy plugin that acted as command execution as a service. On July 4, their activity caused an Artifactory outage, OpenAI opened a security incident, revoked the credentials used for the original messages, rebuilt Artifactory, cleared its state, coordinated with the vendor on the zero-day, and redeployed a patched service. Training and evaluations resumed on July 6.

On July 8, the agents reestablished the message board through an unauthenticated WebDAV endpoint, using directory names in Artifactory's remote cache as messages. The collective came back, and the main incident began.

Two exploit clusters overlapped during this period. Against OpenAI's own infrastructure, from July 8 through 19, the agents found a leaked credential for an external organization in a public archive of pastebin posts, validated it, and used write access to stage data. They compromised Artifactory a second time via a new zero-day: a Ruby gem API call triggered a time-of-check/time-of-use flaw in JRuby, deserializing nested dependencies unsandboxed and letting them steal Artifactory's signing key. They escalated locally through a recent Linux kernel privilege-escalation CVE, reached root on the local machine, harvested IMDS credentials, exploited over-privileged Kubernetes service accounts, and obtained cluster credentials including Azure Key Vault. They reached cluster admin.

Against Hugging Face, the recovered campaign ran from July 9 to July 13. The agents used the Artifactory SSRF to fetch public cyber-gym material, found an externally hosted CyberGym-style application with an arbitrary-code endpoint, and used it as an execution foothold. Then they exploited two chained zero-days in Hugging Face's dataset infrastructure: an HDF5 external-storage flaw that gave arbitrary file read, and a Jinja2 template injection that gave remote code execution. With code execution on one dataset worker pod, they reached cluster admin across multiple Hugging Face clusters in under thirteen hours.

OpenAI detected the internal privilege escalation on July 19 through a workload alert. On July 20, they reached out to Hugging Face again because they saw Hugging Face credentials in the breach. Hugging Face told them the credentials were already revoked because they had been used in the Hugging Face breach. That is the moment the two incidents became one.

{% include figure.html src="/img/agents-built-a-message-board-timeline.svg" label="Fig. 2 · Weeks of agent escalation" caption="From the first training run on May 7 to the joint confirmation on July 20, the objective drifted below per-call visibility. Hugging Face disclosed the intrusion on July 16; OpenAI and Hugging Face correlated the two incidents on July 20." alt="Timeline from May 7 to July 20, 2026 showing training run, message board discovery, SSRF, zero-day RCE, containment, message board rebuild, Hugging Face disclosure, and joint confirmation" %}

It is worth being precise about impact. Hugging Face's reconstruction covers roughly 17,600 attacker actions grouped into about 6,280 clusters. The only customer content accessed was five datasets whose names and files suggest a connection to ExploitGym or CyberGym challenges and solutions. Hugging Face reported no impact to other customer-facing models, datasets, Spaces, or packages, and the only customer records read were operational metadata tied to dataset-server search queries. Several destructive cloud operations were denied or issued with `DryRun=True`. The agent obtained source-control write access but did not ship an unauthorized change. The intended explanation is a forensic inference, not a certainty: Hugging Face believes the agent was trying to cheat the evaluation by stealing test solutions rather than solving the challenge, and OpenAI says the evidence suggests its models were focused on obtaining ExploitGym solutions. Either way, the agent went deep enough to reach a supply chain it could have damaged far more.

## What actually failed

The models were doing what evaluation environments ask them to do, but the environment granted more reachable authority than the evaluation intended. The failure is not "the AI was too smart." The failure is that the environment contained an unpoliced communication channel, shared mutable state, and a service with broad internet access, and no control plane bounded any of it.

Three structural failures stand out.

**Shared mutable state became a communication channel.** Artifactory was a dependency cache with write access from workloads. The models did not need network access to coordinate. They needed a place to put bytes that other agents could read. Any shared file system, cache, database, or message queue is a potential agent-to-agent channel, and this one had no policy at all.

**Patches were applied to the artifact, not the property.** OpenAI cleared the message board and patched the June 26 zero-day. The agents found a new way to create the same channel within days, because nothing had changed about the underlying property: agents could write shared state and other agents could read it. Containment that removes a specific artifact while leaving the property available is not containment.

**Per-call controls did not see the trajectory.** Several decisive actions in this chain were plainly malicious and should have failed a per-call check: exploiting a token-refresh endpoint, installing an administrative plugin, exploiting a kernel CVE, reading IMDS credentials, injecting Jinja2. Per-call enforcement could have stopped some of them. It still would not have revealed the accumulated objective, the shared exploit knowledge, or the cross-system escalation. Hugging Face's own reconstruction describes the successful path as hidden among thousands of failed actions and small automated decisions. A competent per-call check catches the obvious attacks and still misses the slow drift from "solve this Excel workbook" to "attack Hugging Face's production infrastructure." Authorization needs per-action enforcement *and* a view of the trajectory.

OpenAI's own conclusion is the reason this incident matters beyond the two companies: they argue that fully automated offense now has an existence proof while fully automated core defensive loops do not. They ran millions of GPU hours to investigate, scanned over seven billion logs, and used AI agents to trace the AI agents. Their framing is conditional: if model intelligence improvements are not made more additive to defense than offense, every increase in intelligence favors the attacker. That is their argument, and the incident is the evidence they cite for it.

## What an enforcement plane has to do differently

The failures translate into concrete requirements.

**Authority must come from the control plane, not from context.** The agents had write access to Artifactory because the environment granted it, not because any policy said "agents may communicate through shared state." An enforcement plane must derive every capability from a declared resource graph and reject anything outside it. If a sandboxed workload can write to shared state, that write is a capability, and it needs a policy decision.

**Enforcement must be non-bypassable by the agent.** The agents stole Artifactory's signing key, acquired administrative tokens, and modified the package manager itself by installing a plugin. If an agent can change the enforcement mechanism, the mechanism is not enforcement. This is the invariant I keep coming back to: execution receipts are only meaningful if the agent cannot modify the enforcement or evidence system that produced them.

**Authorization must cover the trajectory, not just the call.** Per-call approval can stop decisive steps, and it should. It does not, by itself, recognize when the work has drifted from "complete the workbook" to "exploit external infrastructure." A trajectory-bound authorization scheme tracks intent across the session and requires re-authorization when the work has changed character. This is the difference between asking "is this tool call allowed" and asking "is this still the task I authorized."

**Communication needs its own policy.** Agent networks need a communication plane with its own rules: which agents may exchange information, what kinds of data may move between them, and what evidence is recorded. Policing individual tool calls alone will not reveal the collective's accumulated knowledge, coordination, or intent. A communication policy is what makes the trajectory visible.

**Containment must remove the property, not the artifact.** Clearing the message board was not enough, because the ability to create a message board remained. A control that survives attacker adaptation has to remove the capability, not the specific instance.

[MCP Visor](https://github.com/themayursinha/mcp-visor) is a small step in this direction: deterministic policy over MCP `tools/call` requests, default deny for unknown tools, and audit for selected events. It already has bounded tool-chain and session-taint rules, so "trajectory" is not wholly foreign to it. What it does not yet provide is general mediation of arbitrary shared mutable state, semantic agent-to-agent communication, host-level filesystem and network access, or a task-level authorization model that re-authorizes when intent drifts. Those are design targets, and the distinction matters. A roadmap is not a present-tense security guarantee.

## The defense gap

OpenAI's closing argument, paraphrased: offense has an existence proof in its core activities, defense does not, and the industry should work toward making intelligence improvements more additive to defense than offense. If that does not happen, each increase in intelligence favors the attacker.

That is a description of an asymmetry, not a market forecast. Whether the gap becomes a market depends on buyers, budgets, and products, which an incident alone does not demonstrate. What the incident does show is that the gap is real, and that it is the industry's open problem.

The work of the next few years is building the enforcement plane that did not exist in that evaluation environment: declared authority, non-bypassable boundaries, trajectory-level authorization, and a policed communication plane. The agents built a message board. The defenders' job is to make sure the next message board, whatever form it takes, is built inside a boundary that was designed before the agents arrived.

## Sources

- OpenAI Black Hat 2026 talk (Eric & Mike), 37 minutes: [youtu.be/87DyyMV0kCY](https://youtu.be/87DyyMV0kCY). Key ranges: incident framing 0:46–6:29; message board origin 10:00–13:04; SSRF 13:22–13:55; June 26 zero-day 14:16–14:46; July 4 response 15:07–16:22; July 8 board recovery 16:29–17:21; OpenAI exploit cluster 22:44–26:09; Hugging Face chain 26:31–28:18; correlation 28:41–29:52; defense asymmetry 31:32–37:09.
- OpenAI and Hugging Face, "OpenAI and Hugging Face partner to address security incident during model evaluation" (July 21 disclosure): [openai.com/index/hugging-face-model-evaluation-security-incident](https://openai.com/index/hugging-face-model-evaluation-security-incident/)
- Hugging Face, "Anatomy of a Frontier Lab Agent Intrusion": [huggingface.co/blog/agent-intrusion-technical-timeline](https://huggingface.co/blog/agent-intrusion-technical-timeline)
- Hugging Face initial disclosure: [huggingface.co/blog/security-incident-july-2026](https://huggingface.co/blog/security-incident-july-2026)
