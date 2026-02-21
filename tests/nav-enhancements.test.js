const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const navScript = fs.readFileSync(path.join(__dirname, '..', 'js', 'nav-enhancements.js'), 'utf8');

function createClassList(initial) {
  const classes = new Set(initial || []);
  return {
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
    contains: (name) => classes.has(name),
    toggle: (name, force) => {
      if (force === true) {
        classes.add(name);
        return true;
      }
      if (force === false) {
        classes.delete(name);
        return false;
      }
      if (classes.has(name)) {
        classes.delete(name);
        return false;
      }
      classes.add(name);
      return true;
    },
  };
}

function createElementStub(id) {
  return {
    id,
    className: '',
    classList: createClassList(),
    listeners: {},
    addEventListener(event, handler) {
      this.listeners[event] = handler;
    },
    setAttribute() {},
    removeAttribute() {},
    appendChild() {},
    removeChild() {},
    focus() {},
  };
}

function loadNavEnhancements(options) {
  const events = [];
  const stored = Object.assign({}, (options && options.localStorage) || {});

  const elements = {
    'theme-toggle-icon': createElementStub('theme-toggle-icon'),
    'theme-toggle': createElementStub('theme-toggle'),
    'search-toggle': createElementStub('search-toggle'),
    'search-modal-close': createElementStub('search-modal-close'),
    'search-modal-input': Object.assign(createElementStub('search-modal-input'), { value: '' }),
    'search-modal': createElementStub('search-modal'),
    'search-modal-results': createElementStub('search-modal-results'),
  };

  const sandbox = {
    console,
    window: {
      localStorage: {
        getItem: (key) => (Object.prototype.hasOwnProperty.call(stored, key) ? stored[key] : null),
        setItem: (key, value) => {
          stored[key] = String(value);
        },
      },
      matchMedia: () => ({ matches: !!(options && options.prefersDark) }),
      location: { href: '' },
      fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    },
    document: {
      body: { classList: createClassList() },
      documentElement: { classList: createClassList() },
      addEventListener: (event, handler) => events.push({ event, handler }),
      getElementById: (id) => elements[id] || null,
      createElement: () => createElementStub('created'),
      createDocumentFragment: () => ({ appendChild() {} }),
    },
  };

  sandbox.window.document = sandbox.document;

  vm.createContext(sandbox);
  vm.runInContext(navScript, sandbox);

  return {
    api: sandbox.window.blogNavEnhancements,
    events,
    elements,
    stored,
    document: sandbox.document,
  };
}

test('registers a DOMContentLoaded handler', () => {
  const { events } = loadNavEnhancements();
  assert.equal(events.length, 1);
  assert.equal(events[0].event, 'DOMContentLoaded');
});

test('getInitialTheme honors localStorage before system preference', () => {
  let env = loadNavEnhancements({ localStorage: { theme: 'dark' }, prefersDark: false });
  assert.equal(env.api.getInitialTheme(), true);

  env = loadNavEnhancements({ localStorage: { theme: 'light' }, prefersDark: true });
  assert.equal(env.api.getInitialTheme(), false);

  env = loadNavEnhancements({ prefersDark: true });
  assert.equal(env.api.getInitialTheme(), true);
});

test('setTheme updates classes, icon, and persisted preference', () => {
  const env = loadNavEnhancements();

  env.api.setTheme(true);
  assert.equal(env.document.body.classList.contains('dark-theme'), true);
  assert.equal(env.document.documentElement.classList.contains('dark-theme'), true);
  assert.equal(env.elements['theme-toggle-icon'].className, 'fa fa-sun');
  assert.equal(env.stored.theme, 'dark');

  env.api.setTheme(false);
  assert.equal(env.document.body.classList.contains('dark-theme'), false);
  assert.equal(env.document.documentElement.classList.contains('dark-theme'), false);
  assert.equal(env.elements['theme-toggle-icon'].className, 'fa fa-moon');
  assert.equal(env.stored.theme, 'light');
});

test('filterPosts performs case-insensitive matching', () => {
  const { api } = loadNavEnhancements();

  api._setPostsForTest([
    { title: 'Security Basics', content: 'First principles of secure design' },
    { title: 'Distributed Systems', content: 'Availability and integrity tradeoffs' },
    { title: 'Philosophy Notes', content: 'On meaning and ethics' },
  ]);

  const titleMatch = api.filterPosts('security');
  assert.equal(titleMatch.length, 1);
  assert.equal(titleMatch[0].title, 'Security Basics');

  const contentMatch = api.filterPosts('availability');
  assert.equal(contentMatch.length, 1);
  assert.equal(contentMatch[0].title, 'Distributed Systems');

  const noQuery = api.filterPosts('');
  assert.equal(noQuery.length, 3);
});
