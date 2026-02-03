const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const mainScript = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');

function loadMainWithStubs() {
  const events = [];
  const domState = {
    backgroundImage: null,
    descText: null,
    descVisible: null,
  };

  const selectors = {
    '.intro-header.big-img': {
      css: (property, value) => {
        if (property === 'background-image') {
          domState.backgroundImage = value;
        }
        return selectors['.intro-header.big-img'];
      },
    },
    '.img-desc': {
      text: (value) => {
        domState.descText = value;
        return selectors['.img-desc'];
      },
      show: () => {
        domState.descVisible = true;
        return selectors['.img-desc'];
      },
      hide: () => {
        domState.descVisible = false;
        return selectors['.img-desc'];
      },
    },
  };

  const sandbox = {
    console,
    window: {},
    document: {
      addEventListener: (event, handler) => events.push({ event, handler }),
    },
    $: (selector) => {
      if (!(selector in selectors)) {
        throw new Error(`Unexpected selector: ${selector}`);
      }
      return selectors[selector];
    },
    Math: Object.create(Math),
    setTimeout: (fn) => fn(),
    Image: function Image() {
      this.src = '';
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(mainScript, sandbox);

  return { main: sandbox.main, sandbox, events, domState };
}

test('registers DOMContentLoaded handler', () => {
  const { events, main } = loadMainWithStubs();
  assert.equal(events.length, 1);
  assert.equal(events[0].event, 'DOMContentLoaded');
  assert.equal(events[0].handler, main.init);
});

test('getImgInfo returns the first image when Math.random is 0', () => {
  const { main, sandbox } = loadMainWithStubs();
  const attrs = {
    'data-img-src-1': '/images/one.jpg',
    'data-img-desc-1': 'First',
    'data-img-src-2': '/images/two.jpg',
    'data-img-desc-2': 'Second',
  };
  main.bigImgEl = { attr: (key) => attrs[key] };
  main.numImgs = 2;
  sandbox.Math.random = () => 0;

  const info = main.getImgInfo();

  assert.equal(info.src, '/images/one.jpg');
  assert.equal(info.desc, 'First');
});

test('getImgInfo can return the last image when Math.random is near 1', () => {
  const { main, sandbox } = loadMainWithStubs();
  const attrs = {
    'data-img-src-1': '/images/a.jpg',
    'data-img-desc-1': 'A',
    'data-img-src-2': '/images/b.jpg',
    'data-img-desc-2': 'B',
    'data-img-src-3': '/images/c.jpg',
  };
  main.bigImgEl = { attr: (key) => attrs[key] };
  main.numImgs = 3;
  sandbox.Math.random = () => 0.99;

  const info = main.getImgInfo();

  assert.equal(info.src, '/images/c.jpg');
  assert.equal(info.desc, undefined);
});

test('setImg updates background image and description visibility', () => {
  const { main, domState } = loadMainWithStubs();

  main.setImg('/hero.png', 'Look at this');
  assert.equal(domState.backgroundImage, 'url(/hero.png)');
  assert.equal(domState.descText, 'Look at this');
  assert.equal(domState.descVisible, true);

  main.setImg('/hero.png');
  assert.equal(domState.backgroundImage, 'url(/hero.png)');
  assert.equal(domState.descVisible, false);
});
