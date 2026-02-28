---
layout: page
title: Projects
bigimg: /img/path.jpg
description: Research and engineering projects across AI security, application security, and systems thinking.
---

<p>Selected work across AI security research and applied security engineering.</p>

<div class="projects-grid">
{% assign projects_sorted = site.data.projects | sort: "year" | reverse %}
{% for project in projects_sorted %}
  <article class="project-card">
    <h2 class="project-card-title">{{ project.title }}</h2>
    <p class="project-card-summary">{{ project.summary }}</p>
    <p class="project-card-meta"><strong>Role:</strong> {{ project.role }} | <strong>Year:</strong> {{ project.year }}</p>
    <p class="project-card-links">
      {% for link in project.links %}
        <a href="{{ link.url }}" target="_blank" rel="noopener">{{ link.label }}</a>{% unless forloop.last %} | {% endunless %}
      {% endfor %}
    </p>
  </article>
{% endfor %}
</div>
