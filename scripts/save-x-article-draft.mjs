import { spawn } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cookieFile =
  process.env.X_ARTICLES_COOKIE_FILE ||
  "/home/mayur/.codex/secrets/x_articles_cookie.txt";
const sourceFile =
  process.env.X_ARTICLE_SOURCE_FILE ||
  "/home/mayur/code/blog/_drafts/x-articles/the-ai-agent-dilemma.md";
const draftId = process.env.X_ARTICLE_DRAFT_ID;
if (!draftId || !/^\d+$/.test(draftId)) {
  throw new Error("X_ARTICLE_DRAFT_ID must be a numeric native X draft ID.");
}

const cdpPort = 19225;
const profileDir = mkdtempSync(join(tmpdir(), "codex-x-article-save-"));
const draftUrl = `https://x.com/compose/articles/edit/${draftId}`;

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
  for (const required of ["auth_token", "ct0"]) {
    if (!cookies.some((cookie) => cookie.name === required)) {
      throw new Error(`The cookie file does not contain ${required}.`);
    }
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

function plainLinks(text) {
  return text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1: $2");
}

function parseSource(raw) {
  const parts = raw.split(/^---\s*$/m);
  if (parts.length < 3) throw new Error("Expected YAML front matter.");
  const metadata = parts[1];
  const body = parts.slice(2).join("---").trim();
  const title = metadata.match(/^title:\s*"([^"]+)"\s*$/m)?.[1];
  const coverImage = metadata.match(/^cover_image:\s*"([^"]+)"\s*$/m)?.[1];
  if (!title || !coverImage) throw new Error("Missing title or cover_image metadata.");

  const blocks = [];
  let paragraph = [];
  let orderedItems = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", text: plainLinks(paragraph.join(" ")) });
    paragraph = [];
  };
  const flushList = () => {
    if (!orderedItems.length) return;
    blocks.push({ type: "ordered-list", items: orderedItems });
    orderedItems = [];
  };

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line === "---") {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: plainLinks(heading[1]) });
      continue;
    }
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      orderedItems.push(plainLinks(ordered[1]));
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return { title, coverImage, blocks };
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
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

async function waitForEditor(cdp, sessionId) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const state = await evaluate(
      cdp,
      sessionId,
      `(() => ({
        href: location.href,
        titleReady: !!document.querySelector('textarea[placeholder="Add a title"]'),
        composerReady: !!document.querySelector('[data-testid="composer"]'),
        profileHref: document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute('href') || null,
      }))()`,
    );
    if (state.titleReady && state.composerReady) return state;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("X Article editor did not become ready.");
}

async function pressEnter(cdp, sessionId) {
  const event = {
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  };
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...event }, sessionId);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...event }, sessionId);
}

async function insertText(cdp, sessionId, text) {
  await cdp.send("Input.insertText", { text }, sessionId);
}

async function setBlockType(cdp, sessionId, label) {
  const opened = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const labels = new Set(['Body', 'Heading', 'Subheading']);
      const button = [...document.querySelectorAll('button')]
        .find((node) => labels.has(node.innerText.trim()));
      if (!button) return false;
      button.click();
      return true;
    })()`,
  );
  if (!opened) throw new Error("Could not open the block-format menu.");
  await new Promise((resolve) => setTimeout(resolve, 120));
  const selected = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const visible = (node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const candidates = [...document.querySelectorAll('[role="menuitem"], [role="option"], div, span')]
        .filter((node) => node.innerText.trim() === ${JSON.stringify(label)} && visible(node))
        .sort((a, b) => a.children.length - b.children.length);
      const target = candidates[0];
      if (!target) return false;
      target.click();
      return true;
    })()`,
  );
  if (!selected) throw new Error(`Could not select block format ${label}.`);
  await new Promise((resolve) => setTimeout(resolve, 120));
  await evaluate(
    cdp,
    sessionId,
    `document.querySelector('[data-testid="composer"]').focus()`,
  );
}

async function toggleOrderedList(cdp, sessionId) {
  const clicked = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const button = document.querySelector('[data-testid="btn-ol"]');
      if (!button) return false;
      button.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error("Could not toggle the ordered-list control.");
  await new Promise((resolve) => setTimeout(resolve, 120));
  await evaluate(
    cdp,
    sessionId,
    `document.querySelector('[data-testid="composer"]').focus()`,
  );
}

async function uploadCover(cdp, sessionId, coverPath) {
  const { root } = await cdp.send("DOM.getDocument", {}, sessionId);
  const { nodeId } = await cdp.send(
    "DOM.querySelector",
    { nodeId: root.nodeId, selector: 'input[data-testid="fileInput"]' },
    sessionId,
  );
  if (!nodeId) throw new Error("X cover-image file input was not found.");
  await cdp.send(
    "DOM.setFileInputFiles",
    { files: [coverPath], nodeId },
    sessionId,
  );
  await new Promise((resolve) => setTimeout(resolve, 4000));
}

async function waitForSave(cdp, sessionId) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const status = await evaluate(
      cdp,
      sessionId,
      `document.body.innerText.includes('Last saved just now')`,
    );
    if (status) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("X did not confirm that the Article draft was saved.");
}

const cookieRaw = readFileSync(cookieFile, "utf8");
const cookies = parseCurlCookies(cookieRaw);
const userAgent = parseUserAgent(cookieRaw);
const source = parseSource(readFileSync(sourceFile, "utf8"));
const coverResponse = await fetch(source.coverImage, {
  headers: { "User-Agent": userAgent },
  redirect: "follow",
});
if (!coverResponse.ok) {
  throw new Error(`Cover download failed with HTTP ${coverResponse.status}.`);
}
const coverPath = join(profileDir, "cover.png");
writeFileSync(coverPath, Buffer.from(await coverResponse.arrayBuffer()), {
  mode: 0o600,
});

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
    "--remote-debugging-address=127.0.0.1",
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
  await cdp.send("Page.navigate", { url: draftUrl }, sessionId);
  const editor = await waitForEditor(cdp, sessionId);
  if (editor.profileHref !== "/themayursinha") {
    throw new Error(`Unexpected X profile: ${editor.profileHref || "unknown"}.`);
  }

  const before = await evaluate(
    cdp,
    sessionId,
    `(() => ({
      title: document.querySelector('textarea[placeholder="Add a title"]')?.value || '',
      body: document.querySelector('[data-testid="composer"]')?.innerText.trim() || '',
    }))()`,
  );
  if (before.title || before.body) {
    throw new Error("Refusing to overwrite a non-empty native X Article draft.");
  }

  await uploadCover(cdp, sessionId, coverPath);

  await evaluate(
    cdp,
    sessionId,
    `document.querySelector('textarea[placeholder="Add a title"]').focus()`,
  );
  await insertText(cdp, sessionId, source.title);

  await evaluate(
    cdp,
    sessionId,
    `document.querySelector('[data-testid="composer"]').focus()`,
  );

  for (const block of source.blocks) {
    if (block.type === "heading") {
      await setBlockType(cdp, sessionId, "Heading");
      await insertText(cdp, sessionId, block.text);
      await pressEnter(cdp, sessionId);
      await setBlockType(cdp, sessionId, "Body");
      continue;
    }
    if (block.type === "ordered-list") {
      await toggleOrderedList(cdp, sessionId);
      for (let index = 0; index < block.items.length; index += 1) {
        await insertText(cdp, sessionId, block.items[index]);
        await pressEnter(cdp, sessionId);
      }
      await pressEnter(cdp, sessionId);
      continue;
    }
    await insertText(cdp, sessionId, block.text);
    await pressEnter(cdp, sessionId);
  }

  await waitForSave(cdp, sessionId);
  await cdp.send("Page.reload", { ignoreCache: true }, sessionId);
  await waitForEditor(cdp, sessionId);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const verification = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const body = document.querySelector('[data-testid="composer"]');
      const text = body?.innerText.trim() || '';
      const articleImages = [...document.querySelectorAll('img')]
        .map((image) => image.src)
        .filter((src) => /twimg|blob:|article/i.test(src));
      return {
        href: location.href,
        title: document.querySelector('textarea[placeholder="Add a title"]')?.value || '',
        body_text: text,
        word_count: text.split(/\\s+/).filter(Boolean).length,
        heading_count: body?.querySelectorAll('.longform-header-one, .longform-header-two').length || 0,
        ordered_list_count: body?.querySelectorAll('.public-DraftStyleDefault-ol').length || 0,
        article_images: articleImages,
        draft_label_visible: document.body.innerText.includes('Draft'),
        publish_button_visible: [...document.querySelectorAll('button')].some((node) => node.innerText.trim() === 'Publish'),
      };
    })()`,
  );

  const expectedTexts = source.blocks.flatMap((block) =>
    block.type === "ordered-list" ? block.items : [block.text],
  );
  if (verification.href !== draftUrl) throw new Error("Draft URL changed unexpectedly.");
  if (verification.title !== source.title) throw new Error("X draft title did not persist.");
  for (const text of expectedTexts) {
    if (!verification.body_text.includes(text)) {
      throw new Error(`X draft is missing expected text: ${text.slice(0, 80)}`);
    }
  }
  if (!verification.draft_label_visible) throw new Error("X no longer labels the Article as Draft.");
  if (!verification.publish_button_visible) throw new Error("X Article editor is not in the expected unpublished state.");

  console.log(
    JSON.stringify(
      {
        draft_id: draftId,
        draft_url: draftUrl,
        account: "@themayursinha",
        title: verification.title,
        word_count: verification.word_count,
        heading_count: verification.heading_count,
        ordered_list_count: verification.ordered_list_count,
        image_present: verification.article_images.length > 0,
        persisted_after_reload: true,
        published: false,
      },
      null,
      2,
    ),
  );
} finally {
  cdp?.close();
  chromium.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!profileDir.startsWith(join(tmpdir(), "codex-x-article-save-"))) {
    throw new Error("Refusing to clean an unexpected browser profile path.");
  }
  rmSync(profileDir, { recursive: true, force: true });
}
