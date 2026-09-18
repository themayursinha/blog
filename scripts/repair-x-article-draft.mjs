import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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

const draftUrl = `https://x.com/compose/articles/edit/${draftId}`;
const cdpPort = 19226;
const profileDir = mkdtempSync(join(tmpdir(), "codex-x-article-repair-"));

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
  const title = metadata.match(/^title:\s*"([^"]+)"\s*$/m)?.[1];
  if (!title) throw new Error("Missing source title.");
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
  for (const rawLine of parts.slice(2).join("---").trim().split("\n")) {
    const line = rawLine.trim();
    if (!line || line === "---") {
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
  return { title, blocks };
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
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate(
      cdp,
      sessionId,
      `!!document.querySelector('textarea[placeholder="Add a title"]') && !!document.querySelector('[data-testid="composer"]')`,
    );
    if (ready) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("X Article editor did not become ready.");
}

async function pressKey(cdp, sessionId, key, code, keyCode, modifiers = 0) {
  const event = {
    key,
    code,
    modifiers,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  };
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...event }, sessionId);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...event }, sessionId);
}

async function selectBlockStart(cdp, sessionId, index) {
  const selected = await evaluate(cdp, sessionId, `(() => {
    const composer = document.querySelector('[data-testid="composer"]');
    const blocks = composer ? [...composer.querySelectorAll('[data-block="true"]')] : [];
    const block = blocks[${index}];
    const content = block?.querySelector('[data-offset-key]') || block;
    if (!composer || !content) return false;
    composer.focus();
    const range = document.createRange();
    range.selectNodeContents(content);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  })()`);
  if (!selected) throw new Error(`Could not select Article block ${index}.`);
}

async function setBlockType(cdp, sessionId, label) {
  const opened = await evaluate(cdp, sessionId, `(() => {
    const labels = new Set(['Body', 'Heading', 'Subheading']);
    const button = [...document.querySelectorAll('button')]
      .find((node) => labels.has(node.innerText.trim()));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!opened) throw new Error("Could not open the block-format menu.");
  await new Promise((resolve) => setTimeout(resolve, 200));
  const selected = await evaluate(cdp, sessionId, `(() => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const target = [...document.querySelectorAll('[role="menuitem"], [role="option"], div, span')]
      .filter((node) => node.innerText.trim() === ${JSON.stringify(label)} && visible(node))
      .sort((a, b) => a.children.length - b.children.length)[0];
    if (!target) return false;
    target.click();
    return true;
  })()`);
  if (!selected) throw new Error(`Could not select block format ${label}.`);
  await new Promise((resolve) => setTimeout(resolve, 250));
}

async function snapshot(cdp, sessionId, source) {
  return evaluate(cdp, sessionId, `(() => {
    const composer = document.querySelector('[data-testid="composer"]');
    const body = composer?.innerText || '';
    const blocks = [...(composer?.querySelectorAll('[data-block="true"]') || [])];
    return {
      href: location.href,
      account: document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute('href') || null,
      title: document.querySelector('textarea[placeholder="Add a title"]')?.value || '',
      body,
      firstBlocks: blocks.slice(0, 7).map((node) => node.innerText),
      headingCount: composer?.querySelectorAll('.longform-header-one').length || 0,
      headings: [...(composer?.querySelectorAll('.longform-header-one') || [])].map((node) => node.innerText),
      orderedListCount: composer?.querySelectorAll('.public-DraftStyleDefault-ol').length || 0,
      wordCount: body.split(/\\s+/).filter(Boolean).length,
      containsEmDash: body.includes('—'),
      nonProfileImages: [...document.querySelectorAll('img')]
        .filter((image) => !/profile_images/.test(image.src))
        .map((image) => image.src),
      coverPromptVisible: document.body.innerText.includes('We recommend an image with a 5:2 aspect ratio'),
      draftVisible: document.body.innerText.includes('Draft'),
      publishButtonVisible: [...document.querySelectorAll('button')].some((node) => node.innerText.trim() === 'Publish'),
      expectedTextsPresent: ${JSON.stringify(
        source.blocks.flatMap((block) =>
          block.type === "ordered-list" ? block.items : [block.text],
        ),
      )}.every((text) => body.includes(text)),
    };
  })()`);
}

const cookieRaw = readFileSync(cookieFile, "utf8");
const cookies = parseCurlCookies(cookieRaw);
const userAgent = parseUserAgent(cookieRaw);
const source = parseSource(readFileSync(sourceFile, "utf8"));
const intro = source.blocks.slice(0, 4).map((block) => block.text);
if (intro.length !== 4 || intro.some((text) => !text)) {
  throw new Error("The local X Article source does not have the expected four-paragraph opening.");
}

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
  await waitForEditor(cdp, sessionId);

  let state = await snapshot(cdp, sessionId, source);
  if (state.account !== "/themayursinha") {
    throw new Error(`Unexpected X profile: ${state.account || "unknown"}.`);
  }
  if (state.title && state.title !== source.title) {
    throw new Error(`Refusing to replace unexpected title: ${state.title}`);
  }

  if (!state.title) {
    const focused = await evaluate(cdp, sessionId, `(() => {
      const title = document.querySelector('textarea[placeholder="Add a title"]');
      if (!title) return false;
      title.focus();
      title.setSelectionRange(0, title.value.length);
      return true;
    })()`);
    if (!focused) throw new Error("X Article title field was not found.");
    await cdp.send("Input.insertText", { text: source.title }, sessionId);
    await pressKey(cdp, sessionId, "Tab", "Tab", 9);
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  state = await snapshot(cdp, sessionId, source);
  if (!state.body.includes(intro[0])) {
    if (state.firstBlocks[0] !== "An answer you cannot reconstruct") {
      throw new Error(`Unexpected first Article block: ${state.firstBlocks[0]}`);
    }
    await selectBlockStart(cdp, sessionId, 0);
    await pressKey(cdp, sessionId, "Enter", "Enter", 13);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const splitBlocks = await evaluate(
      cdp,
      sessionId,
      `[...document.querySelectorAll('[data-testid="composer"] [data-block="true"]')].slice(0, 3).map((node) => node.innerText)`,
    );
    if (splitBlocks[0].trim() !== "" || splitBlocks[1] !== "An answer you cannot reconstruct") {
      await pressKey(cdp, sessionId, "z", "KeyZ", 90, 2);
      throw new Error(`Unexpected block split; restored the prior state: ${JSON.stringify(splitBlocks)}`);
    }

    await selectBlockStart(cdp, sessionId, 0);
    await setBlockType(cdp, sessionId, "Body");
    await selectBlockStart(cdp, sessionId, 0);
    for (let index = 0; index < intro.length; index += 1) {
      await cdp.send("Input.insertText", { text: intro[index] }, sessionId);
      if (index < intro.length - 1) {
        await pressKey(cdp, sessionId, "Enter", "Enter", 13);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  await cdp.send("Page.reload", { ignoreCache: true }, sessionId);
  await waitForEditor(cdp, sessionId);
  state = await snapshot(cdp, sessionId, source);

  const expectedHeadings = source.blocks
    .filter((block) => block.type === "heading")
    .map((block) => block.text);
  const checks = {
    url: state.href === draftUrl,
    account: state.account === "/themayursinha",
    title: state.title === source.title,
    allText: state.expectedTextsPresent,
    intro: intro.every((text, index) => state.firstBlocks[index] === text),
    headings:
      state.headingCount === expectedHeadings.length &&
      expectedHeadings.every((text, index) => state.headings[index] === text),
    orderedList: state.orderedListCount === 1,
    cover: state.nonProfileImages.some((url) => /pbs\.twimg\.com\/media\//.test(url)) && !state.coverPromptVisible,
    noEmDash: !state.containsEmDash,
    unpublished: state.draftVisible && state.publishButtonVisible,
  };
  const failed = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  if (failed.length) throw new Error(`Final X Article verification failed: ${failed.join(", ")}`);

  console.log(
    JSON.stringify(
      {
        draft_id: draftId,
        draft_url: draftUrl,
        account: "@themayursinha",
        title: state.title,
        word_count: state.wordCount,
        heading_count: state.headingCount,
        ordered_list_count: state.orderedListCount,
        cover_present: checks.cover,
        all_source_text_present: checks.allText,
        em_dash_present: state.containsEmDash,
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
  if (!profileDir.startsWith(join(tmpdir(), "codex-x-article-repair-"))) {
    throw new Error("Refusing to clean an unexpected browser profile path.");
  }
  rmSync(profileDir, { recursive: true, force: true });
}
