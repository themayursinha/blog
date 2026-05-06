---
layout: page
title: Mayur Sinha
subtitle: Security Engineering Leader in AI, Web3, and Cloud-Native Systems
description: Security engineering leader with 15+ years of experience across AI security, Web3 security, cloud-native security, product security, and incident response.
meta-title: Mayur Sinha | Security Engineering Leader
use-site-title: false
featured_posts:
  - title: MCP security - The new supply chain risk for AI agents
    card_title: MCP Security for AI Agents
    summary: Why MCP servers should be treated as executable trust boundaries in the AI agent supply chain.
  - title: Epistemic security - The missing control plane for AI agents
    card_title: Epistemic Security for AI Agents
    summary: Why agentic systems need controls for provenance, uncertainty, memory, evidence, and human verification.
  - title: Threat Modeling Autonomous AI Agents in Production
    card_title: Threat Modeling AI Agents
    summary: A practical framework for modeling agent runtime risk, tool abuse, memory poisoning, and production controls.
featured_projects:
  - id: mcp-security-evaluator
  - id: adversarial-ml-security-lab
  - id: bert-rasp
---

<div class="home-main-content" markdown="1">

<div class="home-two-column">

<section class="home-about-column">
  <h2>About Me</h2>

  <p>I am a security engineering leader with 15+ years of experience across AI security, Web3 security, cloud-native security, product security, and incident response. I build practical security systems across application security, infrastructure security, detection engineering, and secure platform design.</p>

  <p>My current focus is AI security: securing LLM and agent workflows, stress-testing systems for prompt injection and data exfiltration risks, and building guardrails teams can run in production.</p>

  <p>I also work on Web3 and crypto security, helping secure custody systems, cloud-native platforms, and modern financial infrastructure. Earlier in my career, I worked across malware research, reverse engineering, and incident response, which continues to shape my approach to modern defense.</p>

  <p><strong>Worked across:</strong> Finoa, Taxfix, Akamai, Trend Micro.</p>

  <p>I also collaborate with a non-profit on long-horizon AI risk research and write about AI security, engineering systems, and the broader questions around intelligence, safety, and technology.</p>

  <p>If you are building secure AI systems, modern platforms, or security programs at scale, I would love to connect. For a deeper professional snapshot, see my <a href="{{ '/resume/' | prepend: site.baseurl | replace: '//', '/' }}">resume-style experience page</a>.</p>

</section>

<aside class="home-featured-column">
  <section class="home-rail-card">
    <div class="home-rail-header">
      <h2>Featured Posts</h2>
      <a class="home-rail-viewall" href="{{ '/posts/' | prepend: site.baseurl | replace: '//', '/' }}">All posts</a>
    </div>
    <ul class="home-rail-list">
{% for featured in page.featured_posts %}
  {% assign featured_post = nil %}
  {% for post in site.posts %}
    {% if post.title == featured.title %}
      {% assign featured_post = post %}
      {% break %}
    {% endif %}
  {% endfor %}
  {% if featured_post %}
      <li class="home-rail-item">
        <a class="home-rail-title" href="{{ featured_post.url | prepend: site.baseurl | replace: '//', '/' }}">{{ featured.card_title | default: featured_post.title }}</a>
        <p class="home-rail-summary">{{ featured.summary | default: featured_post.description | default: featured_post.excerpt | strip_html | strip_newlines | truncate: 120 }}</p>
        <p class="home-rail-meta">{{ featured_post.date | date: "%b %-d, %Y" }}</p>
      </li>
  {% endif %}
{% endfor %}
    </ul>
  </section>

  <section class="home-rail-card">
    <div class="home-rail-header">
      <h2>Featured Projects</h2>
      <a class="home-rail-viewall" href="{{ '/projects/' | prepend: site.baseurl | replace: '//', '/' }}">All projects</a>
    </div>
    <ul class="home-rail-list">
{% for featured_item in page.featured_projects %}
  {% assign featured_project = nil %}
  {% for project in site.data.projects %}
    {% if project.id == featured_item.id %}
      {% assign featured_project = project %}
      {% break %}
    {% endif %}
  {% endfor %}
  {% if featured_project %}
      <li class="home-rail-item">
        <a class="home-rail-title" href="{{ featured_project.links[0].url }}" target="_blank" rel="noopener">{{ featured_project.title }}</a>
        <p class="home-rail-summary">{{ featured_project.summary }}</p>
        <p class="home-rail-meta"><span class="home-pill">{{ featured_project.role }}</span><span class="home-pill">{{ featured_project.year }}</span></p>
      </li>
  {% endif %}
{% endfor %}
    </ul>
  </section>

</aside>

</div>

</div>
