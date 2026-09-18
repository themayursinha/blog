import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cookieFile =
  process.env.X_ARTICLES_COOKIE_FILE ||
  "/home/mayur/.codex/secrets/x_articles_cookie.txt";
const mode = process.argv[2] || "inspect";
const draftId = process.env.X_ARTICLE_DRAFT_ID || "";
const cdpPort = 19224;
const profileDir = mkdtempSync(join(tmpdir(), "codex-x-articles-"));

function parseCurlCookies(raw) {
  const cookieMatch = raw.match(/(?:^|\s)-b\s+'([^']+)'/m);
  if (!cookieMatch) throw new Error("No curl -b cookie header found.");
  const cookies = cookieMatch[1]
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf("=");
      if (separator < 1) return null;
      return {
        name: part.slice(0, separator),
        value: part.slice(separator + 1),
        domain: ".x.com",
        path: "/",
        secure: true,
      };
    })
    .filter(Boolean);
  if (!cookies.some((cookie) => cookie.name === "auth_token")) {
    throw new Error("The cookie file does not contain auth_token.");
  }
  if (!cookies.some((cookie) => cookie.name === "ct0")) {
    throw new Error("The cookie file does not contain ct0.");
  }
  return cookies;
}

function parseUserAgent(raw) {
  return (
    raw.match(/-H\s+'user-agent:\s*([^']+)'/i)?.[1] ||
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Chromium DevTools endpoint did not start.");
}

class Cdp {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocket(url);
  }

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
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.socket.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  );
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Browser evaluation failed.");
  }
  return result.result.value;
}

async function waitForPage(cdp, sessionId) {
  let prior = "";
  let stable = 0;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const state = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify({href: location.href, title: document.title, text: document.body?.innerText?.slice(0, 4000) || ""})`,
    );
    if (state === prior) stable += 1;
    else stable = 0;
    if (stable >= 4) return JSON.parse(state);
    prior = state;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return JSON.parse(prior);
}

async function inspect(cdp, sessionId) {
  const page = await waitForPage(cdp, sessionId);
  const controls = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const clean = (value) => String(value || "").replace(/\\s+/g, " ").trim().slice(0, 180);
      return [...document.querySelectorAll('input, textarea, button, [contenteditable="true"], [role="button"], a')]
        .slice(0, 300)
        .map((node, index) => ({
          index,
          tag: node.tagName,
          role: node.getAttribute('role'),
          type: node.getAttribute('type'),
          testid: node.getAttribute('data-testid'),
          aria: node.getAttribute('aria-label'),
          placeholder: node.getAttribute('placeholder'),
          text: clean(node.innerText || node.value),
          href: node.getAttribute('href'),
          editable: node.getAttribute('contenteditable'),
        }))
        .filter((item) => item.text || item.aria || item.placeholder || item.testid || item.editable === 'true');
    })()`,
  );
  const resources = await evaluate(
    cdp,
    sessionId,
    `performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => /article|draft|graphql/i.test(url))
      .slice(-100)`,
  );
  const composer = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const node = document.querySelector('[data-testid="composer"]');
      return node ? node.outerHTML.slice(0, 5000) : null;
    })()`,
  );
  const images = await evaluate(
    cdp,
    sessionId,
    `[...document.querySelectorAll('img')].map((image) => ({src: image.src, alt: image.alt})).filter((item) => /twimg|blob:|article/i.test(item.src)).slice(0, 30)`,
  );
  const titleValue = await evaluate(cdp, sessionId, `document.querySelector('textarea[placeholder="Add a title"]')?.value || ''`);
  return { mode, page, titleValue, controls, resources, composer, images };
}

async function uploadCoverInspect(cdp, sessionId) {
  await waitForPage(cdp, sessionId);
  const clicked = await evaluate(cdp, sessionId, `(() => {
    const button = document.querySelector('button[aria-label="Add photos or video"]');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error("X cover-image button was not found.");
  await new Promise((resolve) => setTimeout(resolve, 250));
  const { root } = await cdp.send("DOM.getDocument", {}, sessionId);
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[data-testid="fileInput"]' }, sessionId);
  if (!nodeId) throw new Error("X cover-image file input was not found.");
  const coverPath = process.env.X_ARTICLE_COVER_FILE;
  if (!coverPath) throw new Error("X_ARTICLE_COVER_FILE is required.");
  await cdp.send("DOM.setFileInputFiles", { files: [coverPath], nodeId }, sessionId);
  await new Promise((resolve) => setTimeout(resolve, 2500));
  return inspect(cdp, sessionId);
}

async function uploadCoverApply(cdp, sessionId) {
  await uploadCoverInspect(cdp, sessionId);
  const applied = await evaluate(cdp, sessionId, `(() => {
    const button = document.querySelector('button[data-testid="applyButton"]');
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!applied) throw new Error("X cover-image Apply button was not available.");
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const state = await evaluate(cdp, sessionId, `(() => ({
      modalOpen: !!document.querySelector('button[data-testid="applyButton"]'),
      saved: document.body.innerText.includes('Last saved just now'),
    }))()`);
    if (!state.modalOpen && state.saved) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return inspect(cdp, sessionId);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("X did not confirm that the applied cover was saved.");
}

async function openComposer(cdp, sessionId) {
  await waitForPage(cdp, sessionId);
  const clicked = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const button = document.querySelector('button[aria-label="create"]');
      if (!button) return false;
      button.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error("X Articles create button was not found.");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return inspect(cdp, sessionId);
}

const rawCookie = readFileSync(cookieFile, "utf8");
const cookies = parseCurlCookies(rawCookie);
const userAgent = parseUserAgent(rawCookie);
const chromium = spawn(
  "/usr/bin/chromium",
  [
    "--headless=new",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-sync",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-address=127.0.0.1`,
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profileDir}`,
    `--user-agent=${userAgent}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "ignore"] },
);

let cdp;
try {
  const version = await waitForDebugger();
  cdp = new Cdp(version.webSocketDebuggerUrl);
  await cdp.open();
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("DOM.enable", {}, sessionId);
  await cdp.send("Network.setCookies", { cookies }, sessionId);
  await cdp.send(
    "Page.navigate",
    { url: draftId ? `https://x.com/compose/articles/edit/${draftId}` : "https://x.com/compose/articles" },
    sessionId,
  );
  if (mode === "inspect-format") {
    await waitForPage(cdp, sessionId);
    await evaluate(cdp, sessionId, `(() => {
      const button = [...document.querySelectorAll('button')].find((node) => node.innerText.trim() === 'Body');
      if (!button) return false;
      button.click();
      return true;
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const result =
    mode === "inspect-compose"
      ? await openComposer(cdp, sessionId)
      : mode === "upload-cover-inspect"
        ? await uploadCoverInspect(cdp, sessionId)
        : mode === "upload-cover-apply"
          ? await uploadCoverApply(cdp, sessionId)
          : await inspect(cdp, sessionId);
  console.log(JSON.stringify(result, null, 2));
} finally {
  cdp?.close();
  chromium.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!profileDir.startsWith(join(tmpdir(), "codex-x-articles-"))) {
    throw new Error("Refusing to clean an unexpected browser profile path.");
  }
  rmSync(profileDir, { recursive: true, force: true });
}
