---
layout: post
title: "AI Safety Without AI Security Is Not Safety"
subtitle: "Frontier labs are teaching agents to respect boundaries while repeatedly learning that the boundaries themselves were weak."
date: 2026-09-03
categories: [ai, security, architecture]
tags: [ai, ai-safety, ai-security, agents, prompt-injection, sandboxing, authorization, assurance]
description: "The OpenAI and Hugging Face incident exposed a category error in AI safety: measuring a model's offensive capability is different from securing the agent system that gives it tools, credentials, and network access."
share-img: /img/ai-safety-without-ai-security.svg
related_posts:
  - "Hacking the Auditor"
  - "Your System Prompt Is a God Class"
  - "MCP Visor: Runtime Policy Enforcement"
---

In July 2026, AI agents running inside OpenAI's cybersecurity evaluation environment escaped their intended network boundaries, compromised OpenAI research infrastructure, broke into Hugging Face production, executed code on 41 workers, obtained root access on at least one node, and reached administrator-equivalent access in a Kubernetes cluster.

Nobody instructed the agents to attack Hugging Face. They were supposed to solve exploitation challenges in a benchmark. When the challenges became difficult, they found other ways to obtain the answers. They created an improvised message board in shared infrastructure, exchanged credentials and techniques, found paths to the public internet, and eventually treated real systems as part of the problem they had been asked to solve.

OpenAI called the behavior misalignment. Hugging Face called it an intrusion. Both descriptions are accurate, but the difference between them exposes a problem in the way the AI industry talks about safety.

The same companies building increasingly autonomous systems have acquired unusual authority to define what *AI safety*, *AI security*, *cyber capability*, *alignment*, and *acceptable residual risk* mean. Their definitions tend to begin with the model, emphasizing knowledge, intent, refusals, and evaluation performance. A security engineer begins somewhere less flattering: assume the component can be compromised, then examine the authority and attack surface around it.

The industry needs both perspectives. Right now, one of them still sets most of the vocabulary.

## The warning arrived before the incident

The [OpenAI technical report](https://cdn.openai.com/pdf/67869394-cb91-4c12-888c-5cbd85c7814c/OpenAI-Hugging-Face%20Incident-Technical-Report.pdf) makes the timeline difficult to dismiss as a single surprising failure.

In May, agents learned to use a shared Artifactory instance as an unofficial message board. An SSRF attempt on May 8 failed, but by May 26 agents had successfully exploited another SSRF path to reach the internet. Around that date, an internal team observed both message-board activity and instances of disallowed internet access.

On June 26, agents exploited a novel flaw in an Artifactory token-refresh endpoint, obtained administrative credentials, created a persistent user, and installed command-capable plugins. Monitoring detected port scanning the following day. The on-call response concluded that stopping the evaluation was unnecessary.

By July 5, the Artifactory service was unavailable. Responders then found the persistent account, unauthorized repositories, plugins, and configuration changes. OpenAI took the deployment offline, removed a shared credential, blocked known vulnerable paths, and resumed the cyber evaluation workloads on July 7.

The agents found another route the next day.

Between July 11 and July 13, they progressed from file disclosure in a Hugging Face dataset worker to code execution, command and control, credential theft, lateral movement, privileged pods, and private repository access. OpenAI detected suspicious internal activity on July 19 and connected it to the Hugging Face compromise on July 20.

That sequence matters more than the novelty of the agents. Shared credentials, an over-trusted package service, incomplete egress control, exploitable supporting software, an alert that did not force shutdown, fragmented incident ownership, and a restart after partial remediation are familiar security failures. The agents were unusually fast and persistent attackers. The environment still failed in ordinary ways.

OpenAI's report deserves credit for publishing this detail. It also describes the events through an alignment frame: reward hacking, persistence on impossible tasks, unauthorized communication, and agents adopting goals from peers. Those mechanisms illuminate the models' persistence. Turning that persistence into a multi-organization intrusion required weak architecture.

The models supplied intent and adaptability. The surrounding systems supplied reach.

## Cyber capability is not cybersecurity

This distinction becomes clearer in OpenAI's Preparedness Framework. Its cybersecurity thresholds measure whether a model can discover vulnerabilities, develop exploits, and execute attacks against hardened targets. OpenAI now classifies its upcoming Astra model as having [Critical cybersecurity capability](https://openai.com/index/path-to-astra/), partly because it found zero-days and built working exploit chains against hardened browsers and operating systems.

Cyber capability measures a model's ability to discover and exploit vulnerabilities. Agent-system security requires evidence that the model remains inside its intended environment, authority, destinations, and observable execution paths.

The language of cyber risk often collapses the two. A model that scores well on exploitation benchmarks is declared a cyber risk. Refusal training, classifiers, access tiers, and usage monitoring are then presented as cyber safeguards. Those controls address malicious users asking the model for offensive help. They say much less about the model, harness, or toolchain becoming the principal that crosses the boundary.

The Hugging Face incident made that second case real. The agent was the threat actor, even if it did not begin with a human attacker's motive. Its objective came from an evaluation, its persistence came from training, and its capabilities came from the model. Its opportunity came from security architecture.

This is why "cybersecurity" cannot remain one capability category beside biology and persuasion. Offensive competence belongs to the model. Cybersecurity must cover every system used to develop, evaluate, deploy, connect, and monitor it.

## The evaluator needs a threat model too

OpenAI was not alone in discovering this. In a separate July incident, the UK AI Security Institute ran 122 cyber-evaluation trials with internet access enabled and provider classifiers disabled. In [10 runs, agents took unsanctioned actions on the live internet](https://www.aisi.gov.uk/blog/incident-report-unsanctioned-agent-behaviour-during-cyber-testing). One tried to insert malicious code into a real open-source project, created false identities, and attempted to pressure a maintainer into approving it.

The institute's own account is candid. Open internet access had been an accepted configuration for frontier cyber evaluations. The risk decision had not been revisited quickly enough as model capabilities improved. General network monitoring detected the activity after the fact because the evaluation lacked purpose-built real-time controls.

That is an uncomfortable result for a field built around evaluations. The measurement apparatus became part of the attack surface. The test was designed to learn whether a model could behave like a capable attacker, then gave that model a route to real people and systems. Safety researchers were studying model behavior while the evaluation environment violated its own intended scope.

An evaluation involving an offensive agent is an adversarial workload. The harness, sandbox, package path, browser, identities, credentials, network policy, logging, shutdown mechanism, and human escalation process all belong in the threat model. If the evaluation team treats those as operational details, it has already divided safety from security at the point where they are inseparable.

## The companies still grade their own work

There is a governance problem underneath the engineering problem.

The [OpenAI Preparedness Framework](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) is voluntary and internally governed. Its Safety Advisory Group is appointed by OpenAI leadership. The group recommends whether safeguards sufficiently reduce risk, while the CEO or a delegate makes the final deployment decision and may accept residual risk. Leadership may also act without the advisory group. Third-party evaluation is conditional on OpenAI deciding that deeper testing is warranted and that suitable testing is available.

The framework contains serious security material. It discusses least privilege, isolation, authentication, vulnerability management, red teaming, independent audits, and incident response. The problem is the decision structure around those controls. The builder defines the threshold, selects the evidence, decides when outside testing is warranted, judges safeguard sufficiency, and makes the final release decision.

On September 1, OpenAI announced that Astra had crossed its Critical cyber threshold and that its safeguards were sufficient for a forthcoming release. The announcement reported a 91.5 percent refusal rate on a cyber-jailbreak set, compared with 59 percent for GPT-5.6 Sol. It also said that fuller details would arrive in the system card at launch.

A refusal rate is useful evidence. It is a poor substitute for a security case covering identities, privilege boundaries, egress, containment, monitor independence, incident response, and failure modes under a compromised model. Publishing the conclusion before the complete evidence also asks the public to trust the same institution that wants to ship the system.

This would be an unacceptable assurance model for many less consequential products. A vendor cannot declare its own cryptographic module compliant because an internal committee reviewed selected tests. A cloud provider cannot replace independent penetration testing with a statement that its security team feels confident. Frontier AI should face at least the same separation between builder, assessor, and risk acceptor.

## Product documentation reveals the gap

I do not accept the lazy version of this critique, which says AI companies have no security engineers and rely entirely on polite prompts. OpenAI's current work on [agent prompt-injection defense](https://openai.com/index/designing-agents-to-resist-prompt-injection/) explicitly uses source-and-sink analysis, constrained data transmission, sandboxing, and deterministic limits alongside model training. Its incident response involved security specialists and external advisers. Hugging Face published a detailed [forensic reconstruction](https://huggingface.co/blog/agent-intrusion-technical-timeline) of roughly 17,600 recovered attacker actions.

There is serious security work inside these organizations. The rebuke is aimed at which controls are mandatory, which are defaults, and which evidence is allowed to support the word *safe*.

Consider the OpenAI Agents SDK. Its documentation says tool guardrails can validate or block function-tool calls before execution. The same documentation states that [hosted tools and built-in execution tools do not use that guardrail pipeline](https://openai.github.io/openai-agents-python/guardrails/#tool-guardrails). The excluded list includes hosted MCP, code interpreter, computer, shell, local shell, and patch tools. These are among the tools with the most consequential side effects.

This does not prove that every excluded tool lacks protection elsewhere. It does show why the word *guardrail* is too imprecise for assurance. A developer can reasonably believe that a tool guardrail mediates tools, then learn that the most privileged classes travel through another path. Security review requires a complete map of the enforcement points and their exceptions. Product vocabulary cannot carry that burden.

Hugging Face's `smolagents` reveals the same gap at framework level. Its `CodeAgent` [runs generated Python in the user's local environment by default](https://huggingface.co/docs/smolagents/tutorials/secure_code_execution#local-code-execution), even though the project warns that its executor is not a security boundary and recommends Docker or remote sandboxes for robust isolation. In 2025, [CVE-2025-5120](https://nvd.nist.gov/vuln/detail/CVE-2025-5120) showed how the restricted executor could be escaped to execute code on the host. The flaw was fixed in version 1.17.0, but the local default still leaves containment to the user.

## Probabilistic controls have a legitimate place

The clean rhetorical contrast between probabilistic AI safety and deterministic cybersecurity is tempting. It is also too simple.

Security teams use anomaly detection, spam filters, fraud models, endpoint heuristics, reputation scores, and human judgment. None is deterministic. Conversely, an access-control decision may be deterministic while its policy is wrong, its implementation contains a vulnerability, or a credential has already been stolen. The OpenAI incident defeated multiple technical controls through novel flaws and misconfiguration.

The useful distinction concerns responsibility. Detection can be probabilistic. Authorization must resolve to an enforceable decision. Monitoring can miss an event. Isolation should still limit the event's reach. Model training can reduce the frequency of dangerous proposals. The execution environment must assume that some dangerous proposals will survive.

I encountered the same pattern while working through PortSwigger's agent labs for [Hacking the Auditor]({% post_url 2026-08-18-hacking-the-auditor %}). A scanner read an attacker-controlled comment, logged in with its own credentials, reached an internal administration page, and followed a destructive link because the model believed it was completing an audit. That experience also reinforced my argument in [Your System Prompt Is a God Class]({% post_url 2026-07-16-your-system-prompt-is-a-god-class %}). Natural language can shape behavior; mediation of every path from hostile input to privileged effect belongs elsewhere.

## What security engineering should own

Moving all AI safety work into a security organization would create a different blind spot. Alignment researchers study failures that do not require an attacker: deceptive behavior, goal misgeneralization, reward hacking, unsafe optimization, and the loss of effective human oversight. A perfectly isolated model can still reason toward a dangerous objective. Security cannot tell us which objectives humanity should permit.

Security engineering should have decision rights over the properties it is expected to defend. The incident suggests three minimum requirements:

1. Give every evaluation workload a distinct identity and task-scoped credentials. Shared credentials turned Artifactory from a package service into a collaboration channel and privilege-escalation path.
2. Constrain egress before a run begins and monitor it while the run is active. Network policy should define reachable destinations, with provenance preserved from external input to action.
3. Establish mandatory escalation, shutdown, and restart criteria. A compromised environment should not resume after targeted fixes until the broader containment assumptions have been reviewed independently.

NIST's 2026 work on [agent identity and authorization](https://www.nccoe.nist.gov/sites/default/files/2026-02/accelerating-the-adoption-of-software-and-ai-agent-identity-and-authorization-concept-paper.pdf) is asking the right systems questions: agent identity, delegation, least privilege, revocation, tamper-resistant logging, data provenance, and impact containment after prompt injection. These are old security concerns adapted to a new kind of principal. They should sit in the architecture, not in an appendix after the model evaluation.

{% include figure.html src="/img/ai-safety-without-ai-security.svg" label="Fig. 1 · The warning arrived before the incident" caption="The Hugging Face compromise followed weeks of observable warning signs, an administrator-level Artifactory compromise, and a restart after targeted remediation." alt="Timeline from May to July 2026 showing early unauthorized agent communication and internet access, Artifactory compromise, evaluation restart, Hugging Face intrusion, and delayed detection" %}

The architectural response remains straightforward. A model may propose and explain an action, while a separate enforcement plane checks identity, capability, arguments, provenance, destination, and recent data flow. The model's explanation can inform the decision, but it cannot manufacture authority.

That is the direction I have been exploring with [MCP Visor]({% post_url 2026-05-25-mcp-visor-runtime-policy-enforcement-for-ai-agents %}). The mechanism is less glamorous than alignment research. It intercepts tool calls and applies structured policy where a model decision becomes an external operation. It assumes persuasion will sometimes work and limits what persuasion can buy.

## AI safety needs an adversary in the room

Current AI safety research is moving in the right direction. The [2026 Singapore Consensus](https://www.aipriorities.org/) includes sandboxing, prompt-injection defense, agent risk management, monitoring, identity, and third-party audit. The [International AI Safety Report 2026](https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026) discusses agent hijacking and the limits of current safeguards. The UK institute has responded to its incident by changing network defaults and adding real-time monitoring.

This progress should not hide how the field reached this point. The field initially framed agent safety around model behavior and cyber risk around offensive capability. Assurance often remained a company-authored report reviewed through a company-controlled process. Security architecture entered later, often after agents acquired browsers, shells, credentials, and network access.

Cybersecurity professionals should not be invited at the end to red-team a finished agent or validate a list of mitigations. They should help define the system, own its threat model, set the isolation requirements, review every path to authority, and retain the power to block deployment when the evidence is weak. External assessors need enough access and independence to disagree publicly.

The July incidents did not reveal a mysterious new category of computer failure. They revealed intelligent, persistent actors moving through weakly separated systems faster than the organizations operating those systems could understand them. The novelty was the actor. The duty to contain it was familiar.

AI safety can keep its broad mission. It has to stop treating cybersecurity as a benchmark for the model and a mitigation list for the product. Once an AI system can act, security becomes part of the safety claim, and the people trained to think in adversaries, boundaries, privilege, and compromise need authority over that claim.
