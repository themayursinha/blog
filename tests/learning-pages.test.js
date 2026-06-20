const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const test = require("node:test");

const root = path.join(__dirname, "..");

function readProjectFile(filePath) {
  return fs.readFileSync(path.join(root, filePath), "utf8");
}

test("Learning source is preserved but excluded from the primary site", () => {
  const config = readProjectFile("_config.yml");

  assert.doesNotMatch(config, /^\s+- title:\s+Learning/m);
  assert.match(config, /^\s+- learning\.md$/m);
  assert.match(config, /^\s+- learning$/m);
  assert.match(readProjectFile("learning.md"), /^title:\s+Learning$/m);
});

test("Learning index links to the Kubernetes security toolkit", () => {
  const learning = readProjectFile("learning.md");

  assert.match(learning, /^title:\s+Learning/m);
  assert.match(learning, /Kubernetes & Container Security Field Guide/);
  assert.match(learning, /\/learning\/kubernetes-container-security\//);
});

test("Kubernetes security toolkit keeps its standalone interactivity", () => {
  const toolkit = readProjectFile("learning/kubernetes-container-security/index.html");

  assert.match(toolkit, /^layout:\s+learning-toolkit/m);
  assert.match(toolkit, /id="diag-controlplane"/);
  assert.match(toolkit, /localStorage\.getItem\(PROGRESS_KEY\)/);
  assert.match(toolkit, /memoryProgress/);
  assert.match(toolkit, /document\.querySelectorAll\('button\.complete-btn'\)/);
});

test("Learning toolkit stylesheet preserves dark technical reading surfaces", () => {
  const css = readProjectFile("css/learning-toolkit.css");

  assert.doesNotMatch(css, /--toolkit-body:\s*var\(--font-body\)/);
  assert.match(css, /\.learning-toolkit h1,/);
  assert.match(css, /\.learning-toolkit table\.matrix tbody td/);
  assert.match(css, /\.learning-toolkit table\.matrix tbody tr:nth-child\(even\) td/);
});

test("Learning toolkit participates in site themes", () => {
  const css = readProjectFile("css/learning-toolkit.css");

  assert.match(css, /--toolkit-bg:\s*var\(--vp-c-bg\)/);
  assert.match(css, /--toolkit-accent:\s*var\(--vp-link\)/);
  assert.match(css, /:root\.theme-tokyo-night \.learning-toolkit/);
  assert.match(css, /\.dark-theme \.learning-toolkit/);
  assert.match(css, /\.learning-toolkit \.diagram-wrap \[fill="#1a2c44"\]/);
});
