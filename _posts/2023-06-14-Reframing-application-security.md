---
layout: post
title: Reframing Application Security — A Developer Experience Perspective
categories: [appsec]
tags: [security]
description: Reframing Application Security
---

In the rapidly evolving digital landscape, most companies are vying for supremacy based on their ability to deliver business value through software and technology. The speed and quality of software production directly correlate with the value delivered. It's a simple equation, and security teams must adapt to this reality to succeed and enable business growth. This article explores the concept of application security (AppSec) through the lens of developer experience (DevEx), presenting a fresh perspective on how AppSec must evolve to remain effective and impactful.

**The Developer Experience Paradigm**

DevEx is a multifaceted concept that encapsulates how developers perceive, contemplate, and value their work. Improving DevEx can enhance value delivery and is primarily driven by three dimensions: feedback loops, cognitive load, and flow state.

Feedback loops refer to responses, such as build results, code reviews, and test results, to developer actions that require actioning or decisioning. Cognitive load pertains to the mental processing required to complete a task. Flow state is an immersive work state where the developer is fully focused and involved. At its core, enhancing DevEx involves shortening and streamlining feedback loops, minimizing cognitive load, and maximizing the time developers spend in a flow state.

**Traditional AppSec: A DevEx Anti-Pattern**

Despite their best intentions, traditional AppSec teams often work in ways that are fundamentally opposed to DevEx. Consider the common practices: PDFs brimming with unprioritized and unvalidated security findings from static application security testing (SAST), dynamic application security testing (DAST), software composition analysis (SCA), and more. Add to this the vague recommendations, deployment blocks, and the necessity for developers to leave their tools and systems to engage with security teams. These practices not only overstate risk and overfocus on theoretical issues but also necessitate numerous meetings and touchpoints, disrupting the developer's workflow.

**Modernizing AppSec with a DevEx Focus**

So, if traditional methods are not aligned with DevEx, what should we be doing? Let's use the three core dimensions of DevEx as our guide.

*Optimize Feedback Loops*

Minimize or remove blocking actions. Consider whether you need to block builds, commits, deployments, etc., based on security findings. If youdo, ensure your developers understand the rationale beforehand to minimize surprise. Security teams must bear the burden of validating findings. Do not burden your developers with unvalidated vulnerabilities or findings. Also, security teams must use the tools that developers use. Stop forcing developers to use the security team’s tools to gain context, learn about issues, or update findings. Instead, use the issue trackers and other systems that developers use to surface findings and track work.

*Minimize Cognitive Load*

Build paved roads for security solutions. Don’t leave developers guessing about the right way to do things. Security teams must provide well-supported and opinionated solutions to security problems. To take this a step further - if you don’t have a well-supported solution for a security issue, this is the security team’s problem, not the developer’s.

Auto-remediate whenever possible. What's better than notifying a developer of a critical and validated security issue? Fixing it for them. This could be through updating container or VM images or filing PRs for impacted repos.

Build secure by default solutions. As the saying goes, “every decision is the chance to make the wrong decision.” Stop forcing developers to make choices in areas they’re not expert. Build security in and remove inessential choices.

*Maximize Flow State*

Automate much of the interface between security and engineering teams. While the human touch is nice, ask yourself, does that meeting really need to happen? For regular and recurring interfaces between security and engineer, find ways to create systems and APIs to make the interactions more predictable and actionable.

Prefer asynchronous communication methods. For any required meetings, schedule with plenty of time to plan and have well-documented agendas and outcomes.

**Conclusion and Additional Resources**

Practically, these kinds of changes to your AppSec approach do have some additional requirements. You’ll need to ensure you have engineering talent in your AppSec team, and you’re likely going to need to partner with platform and other central teams to build scalable security solutions for your developers. You also need both a mindset and planning shift - rather than throwing issues and vulnerabilities over the wall to developers you need to think about completing and facilitating the majority of remediation and improvement work within the security team so your developers can benefit from secure by default and intuitive self-service solutions.

In conclusion, the future of AppSec lies in aligning with DevEx. By focusing on optimizing feedback loops, minimizing cognitive load, and maximizing flow state, we can create a more secure and productive environment for developers, ultimately driving business value.