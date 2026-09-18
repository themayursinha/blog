import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cookieFile = "/home/mayur/.codex/secrets/x_articles_cookie.txt";
const manifestPath = "/home/mayur/code/blog/_drafts/x-articles/manifest.json";
const cdpPort = 19228;
const profileDir = mkdtempSync(join(tmpdir(), "codex-x-article-verify-"));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (((statSync(cookieFile).mode & 0o777) & 0o077) !== 0) {
  throw new Error("X cookie file permissions are too broad.");
}

function parseCurlCookies(raw) {
  const value = raw.match(/(?:^|\s)-b\s+'([^']+)'/m)?.[1];
  if (!value) throw new Error("No curl cookie header found.");
  const cookies = value.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const at = part.indexOf("=");
    return at < 1 ? null : { name: part.slice(0, at), value: part.slice(at + 1), domain: ".x.com", path: "/", secure: true };
  }).filter(Boolean);
  for (const name of ["auth_token", "ct0"]) {
    if (!cookies.some((cookie) => cookie.name === name)) throw new Error(`Missing ${name}.`);
  }
  return cookies;
}

function userAgent(raw) {
  return raw.match(/-H\s+'user-agent:\s*([^']+)'/i)?.[1]
    || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
}

function plain(text) {
  return text
    .replace(/^#{2,3}\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^>\s*/, "")
    .replace(/^"|"$/g, "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1: $2")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_]+)_(?!_)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function parseSource(path) {
  const raw = readFileSync(path, "utf8");
  const parts = raw.split(/^---\s*$/m);
  const title = JSON.parse(parts[1].match(/^title:\s*(".*")\s*$/m)?.[1] || "null");
  const expected = parts.slice(2).join("---").split("\n").map((line) => plain(line.trim()))
    .filter((line) => line && line !== "---" && !line.startsWith("!["));
  return { title, expected };
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
  constructor(url) { this.id = 1; this.pending = new Map(); this.socket = new WebSocket(url); }
  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
    });
  }
  send(method, params = {}, sessionId) {
    const id = this.id++;
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

async function waitForEditor(cdp, sessionId, expectedUrl) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const ready = await evaluate(cdp, sessionId, `location.href === ${JSON.stringify(expectedUrl)} && !!document.querySelector('textarea[placeholder="Add a title"]') && !!document.querySelector('[data-testid="composer"]')`);
    if (ready) { await delay(1000); return; }
    await delay(250);
  }
  throw new Error(`Editor did not load: ${expectedUrl}`);
}

const rawCookie = readFileSync(cookieFile, "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const requestedIds = new Set(
  (process.env.X_ARTICLE_DRAFT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const items = requestedIds.size
  ? manifest.items.filter((item) => requestedIds.has(String(item.x_draft_id)))
  : manifest.items;
if (!items.length || items.some((item) => !item.x_draft_id || item.x_state !== "draft")) {
  throw new Error("Selected manifest records are incomplete or are not marked as drafts.");
}
if (requestedIds.size && items.length !== requestedIds.size) {
  throw new Error(`Expected ${requestedIds.size} selected X drafts, found ${items.length}.`);
}

const chromium = spawn("/usr/bin/chromium", [
  "--headless=new", "--disable-gpu", "--disable-dev-shm-usage", "--disable-background-networking",
  "--disable-sync", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-address=127.0.0.1", `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profileDir}`, `--user-agent=${userAgent(rawCookie)}`, "about:blank",
], { stdio: ["ignore", "ignore", "ignore"] });

let cdp;
const results = [];
try {
  const version = await waitForDebugger();
  cdp = new Cdp(version.webSocketDebuggerUrl);
  await cdp.open();
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Network.setCookies", { cookies: parseCurlCookies(rawCookie) }, sessionId);

  for (const item of items) {
    const source = parseSource(item.source_path);
    await cdp.send("Page.navigate", { url: item.x_editor_url }, sessionId);
    await waitForEditor(cdp, sessionId, item.x_editor_url);
    const state = await evaluate(cdp, sessionId, `(() => { const composer = document.querySelector('[data-testid="composer"]'); const body = composer?.innerText.trim() || ''; return { profile: document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute('href') || null, title: document.querySelector('textarea[placeholder="Add a title"]')?.value || '', body, words: body.split(/\\s+/).filter(Boolean).length, cover: [...document.querySelectorAll('img')].some((image) => /pbs\\.twimg\\.com\\/media\\//.test(image.src)), draft: document.body.innerText.includes('Draft'), publishControl: [...document.querySelectorAll('button')].some((button) => button.innerText.trim() === 'Publish') }; })()`);
    if (state.profile !== "/themayursinha") throw new Error(`Wrong X account for ${item.title}.`);
    if (state.title !== source.title) throw new Error(`Title mismatch for ${item.title}.`);
    for (const text of source.expected) {
      if (!state.body.includes(text)) throw new Error(`Missing text in ${item.title}: ${text.slice(0, 90)}`);
    }
    if (!state.cover) throw new Error(`Cover missing for ${item.title}.`);
    if (!state.draft || !state.publishControl) throw new Error(`${item.title} is not an unpublished draft.`);
    if (state.body.includes("—") || /\bnot (?:only|merely|simply|just)\b/i.test(state.body)) throw new Error(`Style audit failed for ${item.title}.`);
    results.push({ title: item.title, draft_id: item.x_draft_id, editor_url: item.x_editor_url, words: state.words, cover: true, published: false });
    console.log(JSON.stringify({ event: "fresh-verified", title: item.title, draft_id: item.x_draft_id, words: state.words, published: false }));
  }
  console.log(JSON.stringify({ event: "fresh-audit-complete", account: "@themayursinha", drafts: results.length, covers: results.filter((item) => item.cover).length, published: false }));
} finally {
  cdp?.close();
  chromium.kill("SIGTERM");
  await delay(500);
  if (!profileDir.startsWith(join(tmpdir(), "codex-x-article-verify-"))) throw new Error("Unexpected profile path.");
  rmSync(profileDir, { recursive: true, force: true });
}
