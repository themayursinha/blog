---
layout: page
title: Mayur Sinha
subtitle: Engineer by day, Researcher by night
use-site-title: true
---

<!-- Personal intro -->
<p style="text-align: center; font-size: 1.2em; margin-top: 2em;">
  Hello there, cosmic explorer! 🌟 I'm a tech enthusiast with a passion for unraveling the universe's mysteries. Every code I write and circuit I build is a step closer to understanding our enigmatic world. My interests are vast, covering everything from the basics of physics to the complexities of AI. I'm also fascinated by philosophy, psychology, and the mysteries of consciousness.<br><br>
  I love immersing myself in books (check out my <a href="https://www.goodreads.com/user/show/your-goodreads-id">Goodreads</a> reviews!) and engaging in deep, thought-provoking conversations with fellow curious minds. My ultimate goal? To uncover the absolute truth of the universe. To get there, I dive deep into both the realms of science and spirituality, exploring every facet of existence.<br><br>
  Professionally, by day, I'm a software engineer specializing in security, currently making strides in the blockchain space. But my nights are dedicated to Intellisentry, a research-driven AI defense not-for-profit org. Here, I'm committed to pioneering research and developing innovative solutions to fortify our digital and physical spaces against potential AI threats. My vision is a world where humans and machines coexist safely and ethically.<br><br>
  I'm always eager to connect with like-minded souls. Let's expand our minds, challenge our views, and explore the endless possibilities of this incredible journey called life. Follow me on social media, and let's keep this remarkable adventure going!<br><br>
  Feel free to reach out, share your thoughts, and dive into this thrilling exploration with me. Together, we can push the boundaries of what we know and discover new frontiers.
</p>

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