(function(window, document) {
  'use strict';

  var SEARCH_INDEX_URL = '/search.json';
  var THEME_STORAGE_KEY = 'theme-preference';
  var LEGACY_THEME_KEY = 'theme';
  var THEMES = ['sepia', 'tokyo-night'];
  var THEME_CLASS_PREFIX = 'theme-';
  var THEME_CLASSES = ['theme-sepia', 'theme-tokyo-night', 'dark-theme'];
  var state = {
    posts: [],
    loaded: false,
    loading: false,
    failed: false,
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function safeLocalStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage failures (private mode, disabled storage, etc.)
    }
  }

  function prefersDarkTheme() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function normalizeTheme(theme) {
    if (!theme) {
      return null;
    }

    if (theme === true) {
      return 'tokyo-night';
    }
    if (theme === false) {
      return 'sepia';
    }

    var normalized = String(theme).toLowerCase();
    if (THEMES.indexOf(normalized) !== -1) {
      return normalized;
    }
    if (normalized === 'tokyo') {
      return 'tokyo-night';
    }
    if (normalized === 'dark') {
      return 'tokyo-night';
    }
    if (normalized === 'normal' || normalized === 'light') {
      return 'sepia';
    }
    return null;
  }

  function getSavedTheme() {
    return normalizeTheme(safeLocalStorageGet(THEME_STORAGE_KEY)) ||
      normalizeTheme(safeLocalStorageGet(LEGACY_THEME_KEY));
  }

  function getInitialThemeName() {
    return getSavedTheme() || (prefersDarkTheme() ? 'tokyo-night' : 'sepia');
  }

  function isDarkTheme(theme) {
    return normalizeTheme(theme) === 'tokyo-night';
  }

  function getInitialTheme() {
    return isDarkTheme(getInitialThemeName());
  }

  function applyThemeClass(target, theme) {
    var i;

    if (!target || !target.classList) {
      return;
    }

    for (i = 0; i < THEME_CLASSES.length; i += 1) {
      target.classList.remove(THEME_CLASSES[i]);
    }
    target.classList.add(THEME_CLASS_PREFIX + theme);

    if (theme === 'tokyo-night') {
      target.classList.add('dark-theme');
    }
  }

  function updateThemeControls(darkThemeEnabled) {
    var icon = byId('theme-toggle-icon');
    var themeToggle = byId('theme-toggle');
    if (icon) {
      icon.className = darkThemeEnabled ? 'fa fa-sun' : 'fa fa-moon';
    }
    if (themeToggle) {
      themeToggle.setAttribute('title', darkThemeEnabled ? 'Switch to sepia theme' : 'Switch to Tokyo Night theme');
      themeToggle.setAttribute('aria-label', darkThemeEnabled ? 'Switch to sepia theme' : 'Switch to Tokyo Night theme');
    }
  }

  function setTheme(theme) {
    var normalizedTheme = normalizeTheme(theme) || 'sepia';
    var darkThemeEnabled = isDarkTheme(normalizedTheme);

    applyThemeClass(document.documentElement, normalizedTheme);
    applyThemeClass(document.body, normalizedTheme);
    updateThemeControls(darkThemeEnabled);

    safeLocalStorageSet(THEME_STORAGE_KEY, normalizedTheme);
    safeLocalStorageSet(LEGACY_THEME_KEY, darkThemeEnabled ? 'dark' : 'light');
  }

  function normalizeText(value) {
    if (!value) {
      return '';
    }
    return String(value).toLowerCase();
  }

  function filterPosts(query) {
    var normalizedQuery = normalizeText(query).trim();
    if (!normalizedQuery) {
      return state.posts.slice();
    }

    var filtered = [];

    state.posts.forEach(function(post) {
      var title = normalizeText(post.title);
      var content = normalizeText(post.content);

      if (title.indexOf(normalizedQuery) !== -1 || content.indexOf(normalizedQuery) !== -1) {
        filtered.push(post);
      }
    });

    return filtered;
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }

    var date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function clearChildren(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function renderMessage(message) {
    var container = byId('search-modal-results');
    if (!container) {
      return;
    }

    clearChildren(container);

    var item = document.createElement('div');
    item.className = 'search-result-empty';
    item.textContent = message;
    container.appendChild(item);
  }

  function createSearchResult(post) {
    var item = document.createElement('div');
    item.className = 'search-result-item';
    item.setAttribute('role', 'link');
    item.tabIndex = 0;

    if (post.url) {
      item.addEventListener('click', function() {
        window.location.href = post.url;
      });
      item.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          window.location.href = post.url;
        }
      });
    }

    var date = document.createElement('div');
    date.className = 'search-result-date';
    date.textContent = formatDate(post.date);

    var title = document.createElement('div');
    title.className = 'search-result-title';
    title.textContent = post.title || '(Untitled post)';

    item.appendChild(date);
    item.appendChild(title);

    return item;
  }

  function renderResults(posts) {
    var container = byId('search-modal-results');
    if (!container) {
      return;
    }

    clearChildren(container);

    if (!posts.length) {
      renderMessage('No results found');
      return;
    }

    var fragment = document.createDocumentFragment();
    posts.forEach(function(post) {
      fragment.appendChild(createSearchResult(post));
    });

    container.appendChild(fragment);
  }

  function updateResultsFromInput() {
    var input = byId('search-modal-input');
    if (!input) {
      return;
    }

    if (state.loading) {
      renderMessage('Loading search index...');
      return;
    }

    if (state.failed) {
      renderMessage('Search is temporarily unavailable.');
      return;
    }

    if (!state.loaded) {
      renderMessage('Search is unavailable in this browser.');
      return;
    }

    renderResults(filterPosts(input.value));
  }

  function loadSearchIndex() {
    if (state.loading || state.loaded || state.failed) {
      return;
    }

    if (typeof window.fetch !== 'function') {
      state.failed = true;
      updateResultsFromInput();
      return;
    }

    state.loading = true;

    function finishLoading() {
      state.loading = false;
      updateResultsFromInput();
    }

    window.fetch(SEARCH_INDEX_URL, { credentials: 'same-origin' })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Failed to fetch search index');
        }
        return response.json();
      })
      .then(function(json) {
        state.posts = Array.isArray(json) ? json : [];
        state.loaded = true;
      })
      .catch(function() {
        state.failed = true;
      })
      .then(finishLoading, finishLoading);
  }

  function openSearchModal() {
    var modal = byId('search-modal');
    var input = byId('search-modal-input');

    if (!modal || !input) {
      return;
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    input.focus();
    loadSearchIndex();
    updateResultsFromInput();
  }

  function closeSearchModal() {
    var modal = byId('search-modal');
    var input = byId('search-modal-input');
    var results = byId('search-modal-results');

    if (!modal || !input || !results) {
      return;
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    input.value = '';
    clearChildren(results);
  }

  function bindSearchEvents() {
    var searchToggle = byId('search-toggle');
    var closeButton = byId('search-modal-close');
    var input = byId('search-modal-input');
    var modal = byId('search-modal');

    if (searchToggle) {
      searchToggle.addEventListener('click', function(event) {
        event.preventDefault();
        openSearchModal();
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', closeSearchModal);
    }

    if (input) {
      input.addEventListener('input', updateResultsFromInput);
      input.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
          closeSearchModal();
        }
      });
    }

    if (modal) {
      modal.addEventListener('click', function(event) {
        if (event.target === modal) {
          closeSearchModal();
        }
      });
    }

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal && modal.classList.contains('is-open')) {
        closeSearchModal();
      }
    });
  }

  function bindThemeEvents() {
    var themeToggle = byId('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function(event) {
        event.preventDefault();
        setTheme(document.body.classList.contains('dark-theme') ? 'sepia' : 'tokyo-night');
      });
    }
  }

  function init() {
    setTheme(getInitialThemeName());
    bindSearchEvents();
    bindThemeEvents();
  }

  window.blogNavEnhancements = {
    init: init,
    setTheme: setTheme,
    getInitialTheme: getInitialTheme,
    getInitialThemeName: getInitialThemeName,
    filterPosts: filterPosts,
    _setPostsForTest: function(posts) {
      state.posts = posts || [];
      state.loaded = true;
      state.loading = false;
      state.failed = false;
    },
  };

  document.addEventListener('DOMContentLoaded', init);
})(window, document);
