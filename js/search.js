(function () {
  'use strict';

  var modal = document.querySelector('[data-component="site-search"]');
  if (!modal) return;

  var dialog = modal.querySelector('.site-search-dialog');
  var backdrop = modal.querySelector('.site-search-backdrop');
  var input = modal.querySelector('#site-search-input');
  var loadingEl = modal.querySelector('#site-search-loading');
  var metaEl = modal.querySelector('#site-search-meta');
  var listEl = modal.querySelector('#site-search-results');
  var emptyEl = modal.querySelector('#site-search-empty');
  var triggers = document.querySelectorAll('[data-search-open]');
  var closeEls = modal.querySelectorAll('[data-search-close]');

  var INDEX_URL = '/search.json';
  var index = null;
  var loadPromise = null;
  var lastResults = [];
  var activeIndex = -1;
  var debounceTimer = null;
  var lastFocus = null;
  var lazyLoadOnIdle = false;

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, terms) {
    if (!text) return '';
    var safe = escapeHtml(text);
    var valid = (terms || []).filter(function (t) { return t && t.length > 0; });
    if (valid.length === 0) return safe;
    var pattern = valid
      .map(escapeRegExp)
      .sort(function (a, b) { return b.length - a.length; })
      .join('|');
    return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
  }

  function snippet(text, terms, maxLen) {
    if (!text) return '';
    maxLen = maxLen || 180;
    var lower = text.toLowerCase();
    var firstHit = -1;
    for (var i = 0; i < (terms || []).length; i++) {
      var t = String(terms[i] || '').toLowerCase();
      if (!t) continue;
      var idx = lower.indexOf(t);
      if (idx !== -1 && (firstHit === -1 || idx < firstHit)) firstHit = idx;
    }
    var start = firstHit > 40 ? firstHit - 40 : 0;
    var end = Math.min(text.length, start + maxLen);
    if (end < text.length) {
      var lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start + 80) end = lastSpace;
    }
    var out = text.slice(start, end);
    if (start > 0) out = '… ' + out;
    if (end < text.length) out = out + ' …';
    return out;
  }

  function typeLabel(t) {
    if (t === 'post') return 'Post';
    if (t === 'page') return 'Page';
    if (t === 'project') return 'Project';
    return 'Result';
  }

  function buildIndex(data) {
    return new MiniSearch({
      fields: ['title', 'subtitle', 'excerpt', 'tags'],
      storeFields: ['title', 'subtitle', 'url', 'type', 'date', 'excerpt'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { title: 3, tags: 2, subtitle: 1.5 },
        combineWith: 'AND'
      }
    });
  }

  function loadIndex() {
    if (loadPromise) return loadPromise;
    if (typeof MiniSearch === 'undefined') {
      loadPromise = Promise.reject(new Error('MiniSearch not loaded'));
      return loadPromise;
    }
    show(loadingEl);
    loadPromise = fetch(INDEX_URL, { credentials: 'same-origin', cache: 'force-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var ms = buildIndex(data);
        ms.addAll(data);
        index = ms;
        hide(loadingEl);
        return data;
      })
      .catch(function (err) {
        hide(loadingEl);
        metaEl.textContent = 'Search index failed to load (' + (err && err.message ? err.message : 'error') + ').';
        if (window.console) window.console.error('Search load error:', err);
        throw err;
      });
    return loadPromise;
  }

  function render(results, terms) {
    lastResults = results;
    activeIndex = -1;
    listEl.innerHTML = '';
    if (!results || results.length === 0) {
      hide(listEl);
      metaEl.textContent = input.value.trim() ? '0 results' : '';
      return;
    }
    show(listEl);
    hide(emptyEl);
    metaEl.textContent = results.length + (results.length === 1 ? ' result' : ' results');

    var html = '';
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var title = r.title || '(untitled)';
      var subtitle = r.subtitle || '';
      var dateHtml = r.date ? '<span class="site-search-date">' + escapeHtml(r.date) + '</span>' : '';
      var snip = snippet(r.excerpt || '', terms);
      var titleHtml = highlight(title, terms);
      var excerptHtml = highlight(snip, terms);
      var subtitleHtml = subtitle ? highlight(subtitle, terms) : '';
      var isExternal = /^https?:\/\//i.test(r.url);
      html +=
        '<li class="site-search-item" data-index="' + i + '">' +
          '<a class="site-search-link" href="' + escapeHtml(r.url) + '"' +
            (isExternal ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            '<span class="site-search-type site-search-type--' + escapeHtml(r.type || 'page') + '">' + escapeHtml(typeLabel(r.type)) + '</span>' +
            '<span class="site-search-title">' + titleHtml + '</span>' +
            (subtitleHtml ? '<span class="site-search-subtitle">' + subtitleHtml + '</span>' : '') +
            (dateHtml ? '<span class="site-search-date-row">' + dateHtml + '</span>' : '') +
            (excerptHtml ? '<span class="site-search-snippet">' + excerptHtml + '</span>' : '') +
          '</a>' +
        '</li>';
    }
    listEl.innerHTML = html;
  }

  function setActive(i) {
    var items = listEl.querySelectorAll('.site-search-item');
    if (items.length === 0) return;
    if (i < 0) i = items.length - 1;
    if (i >= items.length) i = 0;
    if (activeIndex >= 0 && items[activeIndex]) items[activeIndex].classList.remove('is-active');
    activeIndex = i;
    var el = items[i];
    el.classList.add('is-active');
    if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  function runQuery(q) {
    q = (q == null ? '' : String(q)).trim();
    if (q.length === 0) {
      listEl.innerHTML = '';
      hide(listEl);
      show(emptyEl);
      metaEl.textContent = '';
      lastResults = [];
      activeIndex = -1;
      return;
    }
    if (!index) return;
    var results = index.search(q, {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 3, tags: 2, subtitle: 1.5 }
    });
    var terms = results.length ? results[0].terms || [] : [];
    render(results, terms);
  }

  function open() {
    if (!modal.hidden) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('site-search-open');
    input.value = '';
    show(emptyEl);
    hide(listEl);
    metaEl.textContent = '';
    setTimeout(function () { input.focus(); }, 0);
    loadIndex().catch(function () { });
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('site-search-open');
    listEl.innerHTML = '';
    hide(listEl);
    show(emptyEl);
    metaEl.textContent = '';
    input.value = '';
    lastResults = [];
    activeIndex = -1;
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  function toggle() {
    if (modal.hidden) open();
    else close();
  }

  function onTrigger(e) {
    e.preventDefault();
    open();
  }

  function onCloseClick(e) {
    e.preventDefault();
    close();
  }

  function onKeydown(e) {
    if (modal.hidden) {
      var k = e.key;
      var isModK = (e.metaKey || e.ctrlKey) && (k === 'k' || k === 'K');
      var isSlash = k === '/' && !isTypingTarget(e.target);
      if (isModK || isSlash) {
        e.preventDefault();
        open();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      if (lastResults.length) { e.preventDefault(); setActive(activeIndex + 1); }
    } else if (e.key === 'ArrowUp') {
      if (lastResults.length) { e.preventDefault(); setActive(activeIndex - 1); }
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && lastResults[activeIndex]) {
        e.preventDefault();
        var target = listEl.querySelector('.site-search-item[data-index="' + activeIndex + '"] a');
        if (target) target.click();
      }
    } else if (e.key === 'Tab') {
      var focusables = modal.querySelectorAll('input, button, a, [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function isTypingTarget(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  function onInput() {
    var q = input.value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      if (!index) {
        loadIndex().then(function () { runQuery(q); }).catch(function () { });
      } else {
        runQuery(q);
      }
    }, 80);
  }

  function onSuggestClick(e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('site-search-suggest')) {
      var q = t.getAttribute('data-q') || '';
      input.value = q;
      runQuery(q);
      input.focus();
    }
  }

  function bind() {
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', onTrigger);
    }
    for (var j = 0; j < closeEls.length; j++) {
      closeEls[j].addEventListener('click', onCloseClick);
    }
    document.addEventListener('keydown', onKeydown);
    input.addEventListener('input', onInput);
    modal.addEventListener('click', onSuggestClick);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });
  }

  function scheduleIdleLoad() {
    if (lazyLoadOnIdle || loadPromise) return;
    lazyLoadOnIdle = true;
    var ric = window.requestIdleCallback || function (cb) { return setTimeout(cb, 1500); };
    ric(function () { loadIndex(); });
  }

  bind();
  scheduleIdleLoad();
})();
