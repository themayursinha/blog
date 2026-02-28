---
layout: page
title: Mayur Sinha
subtitle: Where Engineering Meets Philosophy
description: Security engineer and technical philosopher writing about AI security and LLM security.
meta-title: Mayur Sinha | AI Security & Philosophy
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

  <p>I am a technologist trying to understand the universe and the meaning of life. I am drawn to a wide range of questions, from physics and artificial intelligence to why we think and behave the way we do.</p>

  <p>I love reading, deep conversations, and learning with curious people. My goal is to get closer to the truth about our world by exploring both science and spirituality.</p>

  <p>By day, I am a staff engineer focused on security. By night, I work with a non-profit researching how to reduce AI risk. I hope for a future where humans and AI can coexist safely and ethically.</p>

  <p>I believe humanity is moving toward becoming a cybernetic species, with AI as a core force in that transformation. I want to be an active participant in what may become one of the most significant evolutionary shifts in human history.</p>

  <p>If you are exploring similar questions, I would love to connect and learn together.</p>

  <section class="home-about-newsletter" aria-label="Newsletter invitation">
    <p class="home-about-newsletter-kicker">Substack Newsletter</p>
    <h3>Subscribe for new essays</h3>
    <p>Get thoughtful writing on AI security and philosophy directly in your inbox.</p>
    <a class="btn btn-primary home-cta-button" href="{{ site.newsletter.url | default: 'https://substack.com/@mayursinha' }}" target="_blank" rel="noopener">Subscribe on Substack</a>
  </section>
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
