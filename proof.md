---
layout: base
title: Proof
description: Public systems, security research, and engineering artifacts by Mayur Sinha.
permalink: /proof/
---

{% assign projects_asc = site.data.projects | sort: "year" %}
{% assign projects = projects_asc | reverse %}
{% assign systems = projects | where: "role", "Builder" %}
{% assign research = projects | where: "role", "Researcher" %}
{% assign system_count = systems | size %}
{% assign research_count = research | size %}

<article class="proof-page proof-vault">
  <header class="proof-hero">
    <div class="proof-hero-copy">
      <p class="proof-kicker">PUBLIC EVIDENCE VAULT / VERIFIED ARTIFACTS</p>
      <h1 data-text="PROOF">PROOF</h1>
      <p class="proof-intro">Claims are cheap. This is the public evidence trail: released systems, working code, and published research.</p>
      <p class="proof-source">SOURCE INDEX / <a href="https://github.com/themayursinha" target="_blank" rel="noopener">github.com/themayursinha</a></p>
    </div>

    <aside class="proof-verification-panel" aria-label="Proof index summary">
      <span class="proof-panel-label">EVIDENCE LOCK</span>
      <div class="proof-panel-core"><span>{{ system_count | plus: research_count }}</span><b>ARTIFACTS</b></div>
      <dl>
        <div><dt>Systems</dt><dd>{{ system_count }}</dd></div>
        <div><dt>Research</dt><dd>{{ research_count }}</dd></div>
        <div><dt>Status</dt><dd>PUBLIC</dd></div>
      </dl>
    </aside>
  </header>

  <div class="proof-signal-strip" aria-label="Evidence classification">
    <span><b>CODE</b> Runtime tools and labs</span>
    <span><b>CONTEXT</b> Architecture notes</span>
    <span><b>RESEARCH</b> Published work</span>
    <span><b>MODE</b> Inspectable</span>
  </div>

  <section class="proof-section" aria-labelledby="released-systems-title">
    <div class="section-heading proof-section-heading">
      <p>01 / RELEASED SYSTEMS</p>
      <h2 id="released-systems-title">CONTROL INFRASTRUCTURE</h2>
    </div>

    <div class="proof-list proof-system-grid">
      {% for project in systems %}
        <article class="proof-entry proof-system-card">
          <div class="proof-entry-meta">
            <span>{{ project.year }}</span>
            <span>{{ project.role }}</span>
            <span>PUBLIC ARTIFACT</span>
          </div>
          <div class="proof-entry-body">
            <h3>{{ project.title }}</h3>
            <p>{{ project.summary }}</p>
            <p class="proof-links">
              {% for link in project.links %}
                <a href="{{ link.url }}" target="_blank" rel="noopener">{{ link.label }}</a>
              {% endfor %}
            </p>
          </div>
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="proof-section proof-research-section" aria-labelledby="published-research-title">
    <div class="section-heading proof-section-heading">
      <p>02 / PUBLISHED RESEARCH</p>
      <h2 id="published-research-title">EVIDENCE BASE</h2>
    </div>

    <p class="proof-research-link">
      <a href="https://www.researchgate.net/profile/Mayur-Sinha" target="_blank" rel="noopener">View full publication list on ResearchGate →</a>
    </p>

    <ol class="research-evidence-list proof-research-ledger">
      {% for project in research %}
        <li>
          <time>{{ project.year }}</time>
          <span class="proof-research-node" aria-hidden="true"></span>
          <a href="{{ project.links[0].url }}" target="_blank" rel="noopener">{{ project.title }}</a>
        </li>
      {% endfor %}
    </ol>
  </section>
</article>
