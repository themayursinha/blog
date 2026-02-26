(function(window, document) {
  'use strict';

  var THEME_STORAGE_KEY = 'theme-preference';
  var LEGACY_THEME_KEY = 'theme';
  var THEME_CLASS_PREFIX = 'theme-';
  var THEME_CLASSES = ['theme-sepia', 'theme-normal', 'theme-tokyo-night', 'dark-theme'];

  function prefersDarkTheme() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function normalizeTheme(theme) {
    if (!theme) {
      return null;
    }

    var normalized = String(theme).toLowerCase();
    if (normalized === 'sepia' || normalized === 'normal' || normalized === 'tokyo-night') {
      return normalized;
    }
    if (normalized === 'tokyo') {
      return 'tokyo-night';
    }
    if (normalized === 'dark') {
      return 'tokyo-night';
    }
    if (normalized === 'light') {
      return 'normal';
    }
    return null;
  }

  function getSavedTheme() {
    try {
      return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY)) ||
        normalizeTheme(window.localStorage.getItem(LEGACY_THEME_KEY));
    } catch (error) {
      return null;
    }
  }

  function getInitialTheme() {
    return getSavedTheme() || (prefersDarkTheme() ? 'tokyo-night' : 'sepia');
  }

  function applyThemeClass(theme) {
    var root = document.documentElement;
    var themeClass = THEME_CLASS_PREFIX + theme;
    var i;

    for (i = 0; i < THEME_CLASSES.length; i += 1) {
      root.classList.remove(THEME_CLASSES[i]);
    }
    root.classList.add(themeClass);
    if (theme === 'tokyo-night') {
      root.classList.add('dark-theme');
    }
  }

  applyThemeClass(getInitialTheme());
})(window, document);
