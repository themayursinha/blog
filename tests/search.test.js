const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.join(__dirname, '..', '_site', 'search.json');
const minisearchPath = path.join(__dirname, '..', 'js', 'minisearch.min.js');

function loadIndex() {
  if (!fs.existsSync(indexPath)) {
    test.skip('Run `bundle exec jekyll build` first to generate _site/search.json');
  }
  const raw = fs.readFileSync(indexPath, 'utf8');
  return JSON.parse(raw);
}

function loadMiniSearch() {
  if (!fs.existsSync(minisearchPath)) {
    throw new Error('js/minisearch.min.js is missing — re-vendor MiniSearch UMD bundle');
  }
  return require(minisearchPath);
}

test('search.json is a valid JSON array', () => {
  const data = loadIndex();
  assert.ok(Array.isArray(data), 'search.json must be an array');
  assert.ok(data.length > 0, 'search.json must contain at least one entry');
});

test('every entry has the required shape', () => {
  const data = loadIndex();
  for (const item of data) {
    assert.equal(typeof item.id, 'string', `entry ${JSON.stringify(item)} missing string id`);
    assert.ok(['post', 'page', 'project'].includes(item.type), `entry ${item.id} has bad type: ${item.type}`);
    assert.equal(typeof item.title, 'string', `entry ${item.id} missing title`);
    assert.ok(typeof item.url === 'string' && item.url.length > 0, `entry ${item.id} has empty url`);
    assert.equal(typeof item.excerpt, 'string', `entry ${item.id} missing excerpt`);
    assert.ok(Array.isArray(item.tags), `entry ${item.id} tags must be an array`);
  }
});

test('search.json contains posts, pages, and projects', () => {
  const data = loadIndex();
  const types = new Set(data.map((d) => d.type));
  assert.ok(types.has('post'), 'expected at least one post entry');
  assert.ok(types.has('page'), 'expected at least one page entry');
  assert.ok(types.has('project'), 'expected at least one project entry');
});

test('excluded files are not indexed', () => {
  const data = loadIndex();
  const urls = data.map((d) => d.url);
  for (const bad of ['/404.html', '/feed.xml', '/atom.xml', '/rss.xml', '/robots.txt', '/search.json']) {
    assert.ok(!urls.includes(`https://themayursinha.com${bad}`), `must not index ${bad}`);
  }
});

test('no duplicate ids', () => {
  const data = loadIndex();
  const ids = data.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids found in search.json');
});

test('MiniSearch can index search.json and a known term returns results', () => {
  const MiniSearch = loadMiniSearch();
  const data = loadIndex();
  const ms = new MiniSearch({
    fields: ['title', 'subtitle', 'excerpt', 'tags'],
    storeFields: ['title', 'url', 'type'],
  });
  ms.addAll(data);

  const projects = data.filter((d) => d.type === 'project');
  const sample = projects[0] && projects[0].title.split(' ')[0];
  assert.ok(sample && sample.length > 0, 'no project title to query against');
  const hits = ms.search(sample);
  assert.ok(hits.length > 0, `expected at least one hit for term "${sample}"`);
  const firstProject = projects[0];
  assert.ok(
    hits.some((h) => h.id === firstProject.id),
    `expected project "${firstProject.title}" to appear in hits for "${sample}"`,
  );
});

test('MiniSearch prefix search is enabled and finds short queries', () => {
  const MiniSearch = loadMiniSearch();
  const data = loadIndex();
  const ms = new MiniSearch({
    fields: ['title', 'subtitle', 'excerpt', 'tags'],
    storeFields: ['title', 'url', 'type'],
    searchOptions: { prefix: true, fuzzy: 0.2, combineWith: 'AND' },
  });
  ms.addAll(data);

  const target = data.find((d) => d.title && d.title.length >= 6);
  assert.ok(target, 'no document with a usable title');
  const prefix = target.title.slice(0, 4).toLowerCase();
  const hits = ms.search(prefix, { prefix: true });
  assert.ok(hits.length > 0, `expected prefix search for "${prefix}" to return hits`);
  assert.ok(
    hits.some((h) => h.id === target.id),
    `expected document "${target.title}" in prefix hits`,
  );
});

test('base layout includes the search modal and the search trigger', () => {
  const base = fs.readFileSync(path.join(__dirname, '..', '_layouts', 'base.html'), 'utf8');
  const nav = fs.readFileSync(path.join(__dirname, '..', '_includes', 'nav.html'), 'utf8');

  assert.match(base, /\{%\s*include\s+search-modal\.html\s*%\}/, 'base layout must include the search modal');
  assert.match(base, /\/js\/minisearch\.min\.js/, 'base layout must load MiniSearch');
  assert.match(base, /\/js\/search\.js/, 'base layout must load search.js');
  assert.match(nav, /data-search-open/, 'navbar must expose a search-open trigger');
  assert.match(nav, /aria-label="Open search"/, 'navbar search trigger must remain accessible without visible label');
  assert.match(nav, /site-nav-search-kbd/, 'navbar search trigger should include keyboard hint');
});

test('search.js no longer ships an unprocessed Liquid template URL', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'search.js'), 'utf8');
  assert.doesNotMatch(src, /\{\{[^}]*relative_url[^}]*\}\}/, 'search.js must not contain Liquid templates');
  assert.match(src, /['"]\/search\.json['"]/, 'search.js must hardcode /search.json');
});
