---
layout: page
title: Projects
subtitle: Research and engineering projects across AI security, application security, and systems thinking.
description: Research and engineering projects across AI security, application security, and systems thinking.
---

{% assign projects_asc = site.data.projects | sort: "year" %}
{% assign projects_desc = projects_asc | reverse %}
{% assign builder_projects = projects_desc | where: "role", "Builder" %}
{% assign research_projects = projects_desc | where: "role", "Researcher" %}
{% assign earliest_project = projects_asc | first %}
{% assign latest_project = projects_asc | last %}

<div class="projects-page">
  <section class="projects-intro-card">
    <div class="projects-intro-copy">
      <p class="projects-kicker">Selected work</p>
      <p class="projects-lead">Research publications, security tooling, and hands-on experiments spanning {{ earliest_project.year }} to {{ latest_project.year }}.</p>
      <p class="projects-intro-text">The common thread is practical security work: understanding attack surfaces, building defenses, and testing how intelligent systems behave under pressure.</p>
    </div>

    <div class="projects-stats" aria-label="Projects overview">
      <div class="projects-stat">
        <span class="projects-stat-value">{{ projects_desc | size }}</span>
        <span class="projects-stat-label">Projects</span>
      </div>
      <div class="projects-stat">
        <span class="projects-stat-value">{{ research_projects | size }}</span>
        <span class="projects-stat-label">Research studies</span>
      </div>
      <div class="projects-stat">
        <span class="projects-stat-value">{{ builder_projects | size }}</span>
        <span class="projects-stat-label">Security builds</span>
      </div>
      <div class="projects-stat">
        <span class="projects-stat-value">{{ latest_project.year | minus: earliest_project.year | plus: 1 }}</span>
        <span class="projects-stat-label">Year span</span>
      </div>
    </div>
  </section>

  {% if builder_projects != empty %}
  <section class="projects-section">
    <div class="projects-section-heading">
      <div>
        <p class="projects-section-kicker">Current builds</p>
        <h2>Security tooling and lab environments</h2>
      </div>
      <p>Hands-on projects aimed at evaluating modern AI systems and turning security research into usable practice.</p>
    </div>

    <div class="projects-grid projects-grid-featured">
    {% for project in builder_projects %}
      {% assign primary_link = project.links | first %}
      <article class="project-card project-card-featured">
        <div class="project-card-top">
          <p class="project-card-kicker">{{ primary_link.label }}</p>
          <div class="project-card-pills">
            <span class="home-pill">{{ project.role }}</span>
            <span class="home-pill">{{ project.year }}</span>
          </div>
        </div>

        <h3 class="project-card-title">{{ project.title }}</h3>
        <p class="project-card-summary">{{ project.summary }}</p>

        <p class="project-card-links">
        {% for link in project.links %}
          <a class="project-link-chip" href="{{ link.url }}" target="_blank" rel="noopener">{{ link.label }}</a>
        {% endfor %}
        </p>
      </article>
    {% endfor %}
    </div>
  </section>
  {% endif %}

  {% if research_projects != empty %}
  <section class="projects-section">
    <div class="projects-section-heading">
      <div>
        <p class="projects-section-kicker">Research archive</p>
        <h2>Publications and applied studies</h2>
      </div>
      <p>Selected research across IoT security, cyber defense modeling, NLP security, and LLM-enabled systems.</p>
    </div>

    <div class="projects-grid">
    {% for project in research_projects %}
      {% assign primary_link = project.links | first %}
      <article class="project-card">
        <div class="project-card-top">
          <p class="project-card-kicker">{{ primary_link.label }}</p>
          <div class="project-card-pills">
            <span class="home-pill">{{ project.role }}</span>
            <span class="home-pill">{{ project.year }}</span>
          </div>
        </div>

        <h3 class="project-card-title">{{ project.title }}</h3>
        <p class="project-card-summary">{{ project.summary }}</p>

        <p class="project-card-links">
        {% for link in project.links %}
          <a class="project-link-chip" href="{{ link.url }}" target="_blank" rel="noopener">{{ link.label }}</a>
        {% endfor %}
        </p>
      </article>
    {% endfor %}
    </div>
  </section>
  {% endif %}
</div>
