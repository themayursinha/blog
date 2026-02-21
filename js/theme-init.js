(function(window, document) {
  'use strict';

  function prefersDarkTheme() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  try {
    var savedTheme = window.localStorage.getItem('theme');
    var darkThemeEnabled = savedTheme === 'dark' || (savedTheme !== 'light' && prefersDarkTheme());

    if (darkThemeEnabled) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  } catch (error) {
    if (prefersDarkTheme()) {
      document.documentElement.classList.add('dark-theme');
    }
  }
})(window, document);
