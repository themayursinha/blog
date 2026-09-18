import { spawn } from "node:child_process";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cookieFile = "/home/mayur/.codex/secrets/x_articles_cookie.txt";
const manifestPath = "/home/mayur/code/blog/_drafts/x-articles/manifest.json";
const backupDir = "/home/mayur/code/blog/_backups/x-articles";
const cdpPort = 19227;
const profileDir = mkdtempSync(join(tmpdir(), "codex-x-article-batch-"));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mode = statSync(cookieFile).mode & 0o777;
if ((mode & 0o077) !== 0) throw new Error("X cookie file permissions are too broad.");

function parseCurlCookies(raw) {
  const cookieMatch = raw.match(/(?:^|\s)-b\s+'([^']+)'/m);
  if (!cookieMatch) throw new Error("No curl -b cookie header found.");
  const cookies = cookieMatch[1].split(";").map((part) => part.trim()).filter(Boolean)
    .map((part) => {
      const separator = part.indexOf("=");
      if (separator < 1) return null;
      return { name: part.slice(0, separator), value: part.slice(separator + 1), domain: ".x.com", path: "/", secure: true };
    }).filter(Boolean);
  for (const required of ["auth_token", "ct0"]) {
    if (!cookies.some((cookie) => cookie.name === required)) throw new Error(`Cookie file lacks ${required}.`);
  }
  return cookies;
}

function parseUserAgent(raw) {
  return raw.match(/-H\s+'user-agent:\s*([^']+)'/i)?.[1]
    || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
}

function plainMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1: $2")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_]+)_(?!_)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function parseSource(raw) {
  const parts = raw.split(/^---\s*$/m);
  if (parts.length < 3) throw new Error("Expected YAML front matter.");
  const metadata = parts[1];
  const body = parts.slice(2).join("---").trim();
  const title = JSON.parse(metadata.match(/^title:\s*(".*")\s*$/m)?.[1] || "null");
  const coverImage = JSON.parse(metadata.match(/^cover_image:\s*(".*")\s*$/m)?.[1] || "null");
  if (!title || !coverImage) throw new Error("Missing title or cover_image metadata.");

  const blocks = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", text: plainMarkdown(paragraph.join(" ")) });
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    if (line === "---") { flushParagraph(); flushList(); continue; }
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    if (h2 || h3) {
      flushParagraph(); flushList();
      blocks.push({ type: h2 ? "heading" : "subheading", text: plainMarkdown((h2 || h3)[1]) });
      continue;
    }
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    const unordered = line.match(/^[-*+]\s+(.+)$/);
    if (ordered || unordered) {
      flushParagraph();
      const nextType = ordered ? "ordered-list" : "unordered-list";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push(plainMarkdown((ordered || unordered)[1]));
      continue;
    }
    flushList();
    const quote = line.match(/^>\s*(.+)$/);
    paragraph.push(quote ? `“${plainMarkdown(quote[1]).replace(/^"|"$/g, "")}”` : line);
  }
  flushParagraph(); flushList();
  return { title, coverImage, blocks: blocks.filter((block) => block.text || block.items?.length) };
}

function atomicManifestWrite(manifest) {
  const temporary = `${manifestPath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, manifestPath);
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (response.ok) return response.json();
    } catch {}
    await delay(100);
  }
  throw new Error("Chromium DevTools endpoint did not start.");
}

class Cdp {
  constructor(url) { this.nextId = 1; this.pending = new Map(); this.socket = new WebSocket(url); }
  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
    });
  }
  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.socket.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() { this.socket.close(); }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed.");
  return result.result.value;
}

async function navigate(cdp, sessionId, url) {
  await cdp.send("Page.navigate", { url }, sessionId);
}

async function waitForWorkspace(cdp, sessionId) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const state = await evaluate(cdp, sessionId, `(() => ({href: location.href, create: !!document.querySelector('button[aria-label="create"]'), profile: document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute('href') || null}))()`);
    if (state.create) return state;
    await delay(250);
  }
  throw new Error("X Articles workspace did not become ready.");
}

async function waitForEditor(cdp, sessionId) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const state = await evaluate(cdp, sessionId, `(() => ({href: location.href, titleReady: !!document.querySelector('textarea[placeholder="Add a title"]'), composerReady: !!document.querySelector('[data-testid="composer"]'), profile: document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute('href') || null}))()`);
    if (state.titleReady && state.composerReady && /\/compose\/articles\/edit\/\d+$/.test(state.href)) return state;
    await delay(250);
  }
  throw new Error("X Article editor did not become ready.");
}

async function waitForSave(cdp, sessionId) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await evaluate(cdp, sessionId, `document.body.innerText.includes('Last saved just now')`)) {
      await delay(2000);
      return;
    }
    await delay(250);
  }
  throw new Error("X did not confirm the draft save.");
}

async function pressEnter(cdp, sessionId) {
  const event = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...event }, sessionId);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...event }, sessionId);
}

async function insertText(cdp, sessionId, text) {
  await cdp.send("Input.insertText", { text }, sessionId);
}

async function setBlockType(cdp, sessionId, label) {
  const opened = await evaluate(cdp, sessionId, `(() => { const labels = new Set(['Body','Heading','Subheading']); const button = [...document.querySelectorAll('button')].find((node) => labels.has(node.innerText.trim())); if (!button) return false; button.click(); return true; })()`);
  if (!opened) throw new Error("Could not open the block-format menu.");
  await delay(150);
  const selected = await evaluate(cdp, sessionId, `(() => { const visible = (node) => { const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; }; const nodes = [...document.querySelectorAll('[role="menuitem"], [role="option"], div, span')].filter((node) => node.innerText.trim() === ${JSON.stringify(label)} && visible(node)).sort((a,b) => a.children.length-b.children.length); if (!nodes[0]) return false; nodes[0].click(); return true; })()`);
  if (!selected) throw new Error(`Could not select ${label}.`);
  await delay(150);
  await evaluate(cdp, sessionId, `document.querySelector('[data-testid="composer"]').focus()`);
}

async function toggleList(cdp, sessionId, testId) {
  const clicked = await evaluate(cdp, sessionId, `(() => { const button = document.querySelector('[data-testid=${JSON.stringify(testId)}]'); if (!button) return false; button.click(); return true; })()`);
  if (!clicked) throw new Error(`Could not toggle ${testId}.`);
  await delay(150);
  await evaluate(cdp, sessionId, `document.querySelector('[data-testid="composer"]').focus()`);
}

async function uploadCover(cdp, sessionId, coverPath) {
  const clicked = await evaluate(cdp, sessionId, `(() => { const button = document.querySelector('button[aria-label="Add photos or video"]'); if (!button) return false; button.click(); return true; })()`);
  if (!clicked) throw new Error("Cover upload button was not found.");
  await delay(300);
  const { root } = await cdp.send("DOM.getDocument", {}, sessionId);
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[data-testid="fileInput"]' }, sessionId);
  if (!nodeId) throw new Error("Cover file input was not found.");
  await cdp.send("DOM.setFileInputFiles", { files: [coverPath], nodeId }, sessionId);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ready = await evaluate(cdp, sessionId, `!!document.querySelector('button[data-testid="applyButton"]:not([disabled])')`);
    if (ready) break;
    if (attempt === 79) throw new Error("Cover crop Apply button did not become ready.");
    await delay(250);
  }
  const applied = await evaluate(cdp, sessionId, `(() => { const button = document.querySelector('button[data-testid="applyButton"]'); if (!button || button.disabled) return false; button.click(); return true; })()`);
  if (!applied) throw new Error("Could not apply the X cover crop.");
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const modalOpen = await evaluate(cdp, sessionId, `!!document.querySelector('button[data-testid="applyButton"]')`);
    if (!modalOpen) { await waitForSave(cdp, sessionId); return; }
    await delay(250);
  }
  throw new Error("Cover crop dialog did not close.");
}

async function fillArticle(cdp, sessionId, source) {
  const before = await evaluate(cdp, sessionId, `(() => ({title: document.querySelector('textarea[placeholder="Add a title"]')?.value || '', body: document.querySelector('[data-testid="composer"]')?.innerText.trim() || ''}))()`);
  if (before.body) throw new Error("Refusing to overwrite a non-empty X draft body.");
  if (before.title && before.title !== source.title) throw new Error("Refusing to overwrite a differently titled X draft.");
  if (!before.title) {
    await evaluate(cdp, sessionId, `document.querySelector('textarea[placeholder="Add a title"]').focus()`);
    await insertText(cdp, sessionId, source.title);
  }
  await evaluate(cdp, sessionId, `document.querySelector('[data-testid="composer"]').focus()`);
  await setBlockType(cdp, sessionId, "Body");
  for (const block of source.blocks) {
    if (block.type === "heading" || block.type === "subheading") {
      await setBlockType(cdp, sessionId, block.type === "heading" ? "Heading" : "Subheading");
      await insertText(cdp, sessionId, block.text);
      await pressEnter(cdp, sessionId);
      await setBlockType(cdp, sessionId, "Body");
      continue;
    }
    if (block.type === "ordered-list" || block.type === "unordered-list") {
      await toggleList(cdp, sessionId, block.type === "ordered-list" ? "btn-ol" : "btn-ul");
      for (const item of block.items) { await insertText(cdp, sessionId, item); await pressEnter(cdp, sessionId); }
      await pressEnter(cdp, sessionId);
      continue;
    }
    await insertText(cdp, sessionId, block.text);
    await pressEnter(cdp, sessionId);
  }
}

async function verify(cdp, sessionId, draftUrl, source) {
  await cdp.send("Page.reload", { ignoreCache: true }, sessionId);
  await waitForEditor(cdp, sessionId);
  await delay(1500);
  const state = await evaluate(cdp, sessionId, `(() => { const body = document.querySelector('[data-testid="composer"]'); const text = body?.innerText.trim() || ''; return { href: location.href, title: document.querySelector('textarea[placeholder="Add a title"]')?.value || '', body: text, words: text.split(/\\s+/).filter(Boolean).length, headings: body?.querySelectorAll('.longform-header-one, .longform-header-two').length || 0, ordered: body?.querySelectorAll('.public-DraftStyleDefault-ol').length || 0, unordered: body?.querySelectorAll('.public-DraftStyleDefault-ul').length || 0, image: [...document.querySelectorAll('img')].some((image) => /twimg|blob:|article/i.test(image.src)), draft: document.body.innerText.includes('Draft'), publishControl: [...document.querySelectorAll('button')].some((button) => button.innerText.trim() === 'Publish') }; })()`);
  if (state.href !== draftUrl) throw new Error("Draft URL changed unexpectedly.");
  if (state.title !== source.title) throw new Error("Title did not persist.");
  for (const block of source.blocks) {
    for (const expected of block.items || [block.text]) {
      if (expected && !state.body.includes(expected)) throw new Error(`Missing expected text: ${expected.slice(0, 90)}`);
    }
  }
  if (!state.image) throw new Error("Cover did not persist.");
  if (!state.draft || !state.publishControl) throw new Error("Article is not in the expected unpublished draft state.");
  return state;
}

const rawCookie = readFileSync(cookieFile, "utf8");
const cookies = parseCurlCookies(rawCookie);
const userAgent = parseUserAgent(rawCookie);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
copyFileSync(manifestPath, join(backupDir, `${timestamp}-pre-x-batch-manifest.json`));

const chromium = spawn("/usr/bin/chromium", [
  "--headless=new", "--disable-gpu", "--disable-dev-shm-usage", "--disable-background-networking",
  "--disable-sync", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-address=127.0.0.1", `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profileDir}`, `--user-agent=${userAgent}`, "about:blank",
], { stdio: ["ignore", "ignore", "ignore"] });

let cdp;
try {
  const version = await waitForDebugger();
  cdp = new Cdp(version.webSocketDebuggerUrl);
  await cdp.open();
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("DOM.enable", {}, sessionId);
  await cdp.send("Network.setCookies", { cookies }, sessionId);

  for (const item of manifest.items) {
    if (item.x_draft_id && item.x_state === "draft") {
      console.log(JSON.stringify({ event: "skip-existing", title: item.title, draft_id: item.x_draft_id }));
      continue;
    }
    const source = parseSource(readFileSync(item.source_path, "utf8"));
    let draftUrl = item.x_editor_url;
    if (!item.x_draft_id) {
      await navigate(cdp, sessionId, "https://x.com/compose/articles");
      const workspace = await waitForWorkspace(cdp, sessionId);
      if (workspace.profile !== "/themayursinha") throw new Error(`Unexpected X account: ${workspace.profile || "unknown"}.`);
      const clicked = await evaluate(cdp, sessionId, `(() => { const button = document.querySelector('button[aria-label="create"]'); if (!button) return false; button.click(); return true; })()`);
      if (!clicked) throw new Error("Could not create a native X Article draft.");
      const editor = await waitForEditor(cdp, sessionId);
      if (editor.profile !== "/themayursinha") throw new Error(`Unexpected X account: ${editor.profile || "unknown"}.`);
      const id = editor.href.match(/\/edit\/(\d+)$/)?.[1];
      if (!id) throw new Error("Could not capture the new X Article draft ID.");
      item.x_draft_id = id;
      item.x_editor_url = editor.href;
      item.x_state = "empty-draft-created";
      atomicManifestWrite(manifest);
      draftUrl = editor.href;
      console.log(JSON.stringify({ event: "created-empty", title: item.title, draft_id: id, url: draftUrl }));
    } else {
      await navigate(cdp, sessionId, draftUrl);
      await waitForEditor(cdp, sessionId);
    }

    try {
      if (item.x_state !== "incomplete") await uploadCover(cdp, sessionId, item.cover_path);
      await fillArticle(cdp, sessionId, source);
      await delay(8000);
      await waitForSave(cdp, sessionId);
      const state = await verify(cdp, sessionId, draftUrl, source);
      item.x_state = "draft";
      item.verified_at = new Date().toISOString();
      item.verification = { words: state.words, headings: state.headings, ordered_lists: state.ordered, unordered_lists: state.unordered, cover: true, published: false };
      delete item.error;
      atomicManifestWrite(manifest);
      console.log(JSON.stringify({ event: "verified", title: item.title, draft_id: item.x_draft_id, words: state.words, headings: state.headings, published: false }));
    } catch (error) {
      item.x_state = "incomplete";
      item.error = String(error.message || error);
      atomicManifestWrite(manifest);
      throw error;
    }
    await delay(5000);
  }

  console.log(JSON.stringify({ event: "batch-complete", drafts: manifest.items.filter((item) => item.x_state === "draft").length, published: false }));
} finally {
  cdp?.close();
  chromium.kill("SIGTERM");
  await delay(500);
  if (!profileDir.startsWith(join(tmpdir(), "codex-x-article-batch-"))) throw new Error("Refusing to clean an unexpected profile path.");
  rmSync(profileDir, { recursive: true, force: true });
}
