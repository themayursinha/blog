---
layout: page
title: Mayur Sinha
subtitle: AI Security Engineer Building Safer Intelligent Systems
description: Staff AI Security Engineer building secure LLM and agent systems for production environments.
meta-title: Mayur Sinha | AI Security Engineer
use-site-title: false
featured_posts:
  - title: Why Transformer LLMs are better at finding code vulnerabilities than classical neural networks
    card_title: LLMs vs Classical Nets for Vulnerability Detection
    summary: A practical comparison of classical ANN pipelines versus transformers for real-world AppSec use.
  - title: Designing a living ecosystem of AI agents
    card_title: Designing a Living Ecosystem of AI Agents
    summary: A blueprint for self-organizing AI agent systems that evolve, specialize, and improve over time.
  - title: Vibe Engineering
    card_title: Vibe Engineering
    summary: A production-minded framework for using coding agents without sacrificing quality or ownership.
featured_projects:
  - id: mcp-security-evaluator
  - id: adversarial-ml-security-lab
  - id: bert-rasp
---

<div class="home-main-content" markdown="1">

<div class="home-two-column">

<section class="home-about-column">
  <h2>About Me</h2>

  <p>I am a Staff Security Engineer focused on AI and cloud-native security. I build practical security systems across application security, infrastructure security, and detection engineering.</p>

  <p>My core focus is AI security: securing LLM and agent workflows, stress-testing systems for prompt injection and data exfiltration risks, and building guardrails teams can run in production.</p>

  <p>Over the last 15 years, I have worked across startups and enterprise environments in research, product security, and incident response, from malware reverse engineering to modern DevSecOps programs.</p>

  <p>I also collaborate with a non-profit on long-horizon AI risk research and write about AI security, engineering systems, and the deeper philosophy of intelligence and safety.</p>

  <p>If you are building secure AI systems or exploring similar questions, I would love to connect.</p>

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
