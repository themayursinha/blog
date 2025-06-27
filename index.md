---
layout: page
title: Mayur Sinha
subtitle: Engineer by day, Researcher by night
use-site-title: true
---

<!-- Personal intro -->
<div style="text-align: center; font-size: 1.2em; margin-top: 2em;">
  <p>Hello!</p>
  <p>I'm passionate about technology and understanding the universe. I enjoy learning about a wide range of topics, from physics and artificial intelligence (AI) to why we think and act the way we do.</p>
  <p>I love reading and having deep conversations with other curious people. My main goal is to learn the truth about our world by exploring both science and spirituality.</p>
  <p>By day, I'm a software engineer focused on security. By night, I work with a non-profit organization that researches how to keep us safe from potential AI threats. I hope for a future where humans and AI can exist together safely and ethically.</p>
  <p>I'm always happy to connect with people who have similar interests. Let's learn from each other and explore all that life has to offer.</p>
  <p>Feel free to reach out and share your thoughts. Together, we can learn new things and discover more about our world.</p>
</div>

<!-- Blog listing -->
<div class="posts-list">
  {% for post in paginator.posts %}
  <article class="post-preview">
    <a href="{{ post.url | prepend: site.baseurl }}">
      <h2 class="post-title">{{ post.title }}</h2>
      {% if post.subtitle %}
      <h3 class="post-subtitle">
        {{ post.subtitle }}
      </h3>
      {% endif %}
    </a>
    <p class="post-meta">
      Posted on {{ post.date | date: "%B %-d, %Y" }}
    </p>
    <div class="post-entry-container">
      {% if post.image %}
      <div class="post-image">
        <a href="{{ post.url | prepend: site.baseurl }}">
          <img src="{{ post.image }}">
        </a>
      </div>
      {% endif %}
      <div class="post-entry">
        {{ post.excerpt | strip_html | xml_escape | truncatewords: site.excerpt_length }}
        {% assign excerpt_word_count = post.excerpt | number_of_words %}
        {% if post.content != post.excerpt or excerpt_word_count > site.excerpt_length %}
          <a href="{{ post.url | prepend: site.baseurl }}" class="post-read-more">[Read&nbsp;More]</a>
        {% endif %}
      </div>
    </div>
    {% if post.tags.size > 0 %}
    <div class="blog-tags">
      Tags:
      {% if site.link-tags %}
      {% for tag in post.tags %}
      <a href="{{ site.baseurl }}/tags#{{- tag -}}">{{- tag -}}</a>
      {% endfor %}
      {% else %}
        {{ post.tags | join: ", " }}
      {% endif %}
    </div>
    {% endif %}
   </article>
  {% endfor %}
</div>

{% if paginator.total_pages > 1 %}
<ul class="pager main-pager">
  {% if paginator.previous_page %}
  <li class="previous">
    <a href="{{ paginator.previous_page_path | prepend: site.baseurl | replace: '//', '/' }}">&larr; Newer Posts</a>
  </li>
  {% endif %}
  {% if paginator.next_page %}
  <li class="next">
    <a href="{{ paginator.next_page_path | prepend: site.baseurl | replace: '//', '/' }}">Older Posts &rarr;</a>
  </li>
  {% endif %}
</ul>
{% endif %}