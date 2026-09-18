import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const cookieFile =
  process.env.X_ARTICLES_COOKIE_FILE ||
  "/home/mayur/.codex/secrets/x_articles_cookie.txt";
const sourceFile = process.env.X_ARTICLE_SOURCE_FILE;
if (!sourceFile) throw new Error("X_ARTICLE_SOURCE_FILE is required.");
const draftId = process.env.X_ARTICLE_DRAFT_ID;
if (!draftId || !/^\d+$/.test(draftId)) {
  throw new Error("X_ARTICLE_DRAFT_ID must be a numeric native X draft ID.");
}
const draftUrl = `https://x.com/compose/articles/edit/${draftId}`;
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath =
  process.env.X_ARTICLE_BACKUP_PATH ||
  `/home/mayur/code/blog/_backups/x-articles/${timestamp}-pre-edit-${draftId}.json`;
const cdpPort = 19227;
const profileDir = mkdtempSync(join(tmpdir(), "codex-x-article-replace-"));

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
  if (raw.includes("—")) throw new Error("The X Article source still contains an em dash.");
  if (/\bnot (?:only|merely|simply|just)\b/i.test(raw)) {
    throw new Error("The X Article source still contains a formulaic qualifier.");
  }
  const parts = raw.split(/^---\s*$/m);
  if (parts.length < 3) throw new Error("Expected YAML front matter.");
  const title = parts[1].match(/^title:\s*"([^"]+)"\s*$/m)?.[1];
  if (!title) throw new Error("Missing source title.");
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
  for (const rawLine of parts.slice(2).join("---").trim().split("\n")) {
    const line = rawLine.trim();
    if (!line || line === "---") {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^##\s+(.+)$/);
    const subheading = line.match(/^###\s+(.+)$/);
    if (heading || subheading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: heading ? "heading" : "subheading",
        text: plainMarkdown((heading || subheading)[1]),
      });
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
  await new Promise((resolve) => setTimeout(resolve, 180));
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
  await new Promise((resolve) => setTimeout(resolve, 180));
  await evaluate(cdp, sessionId, `document.querySelector('[data-testid="composer"]').focus()`);
}

async function toggleList(cdp, sessionId, testId) {
  const clicked = await evaluate(cdp, sessionId, `(() => {
    const button = document.querySelector('[data-testid="${testId}"]');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Could not toggle ${testId}.`);
  await new Promise((resolve) => setTimeout(resolve, 180));
  await evaluate(cdp, sessionId, `document.querySelector('[data-testid="composer"]').focus()`);
}

const cookieRaw = readFileSync(cookieFile, "utf8");
const cookies = parseCurlCookies(cookieRaw);
const userAgent = parseUserAgent(cookieRaw);
const source = parseSource(readFileSync(sourceFile, "utf8"));
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

  const before = await evaluate(cdp, sessionId, `(() => {
    const composer = document.querySelector('[data-testid="composer"]');
    return {
      href: location.href,
      account: document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute('href') || null,
      title: document.querySelector('textarea[placeholder="Add a title"]')?.value || '',
      body_text: composer?.innerText || '',
      composer_html: composer?.outerHTML || '',
      images: [...document.querySelectorAll('img')].map((image) => image.src),
      draft_visible: document.body.innerText.includes('Draft'),
      publish_button_visible: [...document.querySelectorAll('button')].some((node) => node.innerText.trim() === 'Publish'),
    };
  })()`);
  if (
    before.href !== draftUrl ||
    before.account !== "/themayursinha" ||
    before.title !== source.title ||
    !before.draft_visible ||
    !before.publish_button_visible ||
    !before.images.some((url) => /pbs\.twimg\.com\/media\//.test(url))
  ) {
    throw new Error("The existing X Article failed its pre-edit identity checks.");
  }
  if (existsSync(backupPath)) throw new Error(`Refusing to overwrite ${backupPath}.`);
  mkdirSync(dirname(backupPath), { recursive: true, mode: 0o700 });
  writeFileSync(backupPath, JSON.stringify({ backed_up_at: new Date().toISOString(), ...before }, null, 2), {
    mode: 0o600,
    flag: "wx",
  });

  await evaluate(cdp, sessionId, `document.querySelector('[data-testid="composer"]').focus()`);
  await pressKey(cdp, sessionId, "a", "KeyA", 65, 2);
  await pressKey(cdp, sessionId, "Backspace", "Backspace", 8);
  await new Promise((resolve) => setTimeout(resolve, 400));
  const cleared = await evaluate(
    cdp,
    sessionId,
    `document.querySelector('[data-testid="composer"]')?.innerText.trim() === ''`,
  );
  if (!cleared) throw new Error("The X Article body did not clear completely.");
  await setBlockType(cdp, sessionId, "Body");

  for (const block of source.blocks) {
    if (block.type === "heading" || block.type === "subheading") {
      await setBlockType(cdp, sessionId, block.type === "heading" ? "Heading" : "Subheading");
      await cdp.send("Input.insertText", { text: block.text }, sessionId);
      await pressKey(cdp, sessionId, "Enter", "Enter", 13);
      await setBlockType(cdp, sessionId, "Body");
      continue;
    }
    if (block.type === "ordered-list" || block.type === "unordered-list") {
      await toggleList(cdp, sessionId, block.type === "ordered-list" ? "btn-ol" : "btn-ul");
      for (const item of block.items) {
        await cdp.send("Input.insertText", { text: item }, sessionId);
        await pressKey(cdp, sessionId, "Enter", "Enter", 13);
      }
      await pressKey(cdp, sessionId, "Enter", "Enter", 13);
      continue;
    }
    await cdp.send("Input.insertText", { text: block.text }, sessionId);
    await pressKey(cdp, sessionId, "Enter", "Enter", 13);
  }

  await new Promise((resolve) => setTimeout(resolve, 6000));
  await cdp.send("Page.reload", { ignoreCache: true }, sessionId);
  await waitForEditor(cdp, sessionId);
  const after = await evaluate(cdp, sessionId, `(() => {
    const composer = document.querySelector('[data-testid="composer"]');
    const body = composer?.innerText || '';
    return {
      href: location.href,
      account: document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute('href') || null,
      title: document.querySelector('textarea[placeholder="Add a title"]')?.value || '',
      body_text: body,
      word_count: body.split(/\\s+/).filter(Boolean).length,
      heading_count: composer?.querySelectorAll('.longform-header-one, .longform-header-two').length || 0,
      headings: [...(composer?.querySelectorAll('.longform-header-one, .longform-header-two') || [])].map((node) => node.innerText),
      ordered_list_count: composer?.querySelectorAll('.public-DraftStyleDefault-ol').length || 0,
      unordered_list_count: composer?.querySelectorAll('.public-DraftStyleDefault-ul').length || 0,
      images: [...document.querySelectorAll('img')].map((image) => image.src),
      cover_prompt_visible: document.body.innerText.includes('We recommend an image with a 5:2 aspect ratio'),
      draft_visible: document.body.innerText.includes('Draft'),
      publish_button_visible: [...document.querySelectorAll('button')].some((node) => node.innerText.trim() === 'Publish'),
    };
  })()`);
  const expectedTexts = source.blocks.flatMap((block) => block.items || [block.text]);
  const expectedHeadings = source.blocks
    .filter((block) => block.type === "heading" || block.type === "subheading")
    .map((block) => block.text);
  const expectedOrderedLists = source.blocks.filter((block) => block.type === "ordered-list").length;
  const expectedUnorderedLists = source.blocks.filter((block) => block.type === "unordered-list").length;
  if (
    after.href !== draftUrl ||
    after.account !== "/themayursinha" ||
    after.title !== source.title ||
    !expectedTexts.every((text) => after.body_text.includes(text)) ||
    after.heading_count !== expectedHeadings.length ||
    !expectedHeadings.every((text, index) => after.headings[index] === text) ||
    after.ordered_list_count !== expectedOrderedLists ||
    after.unordered_list_count !== expectedUnorderedLists ||
    after.body_text.includes("—") ||
    /\bnot (?:only|merely|simply|just)\b/i.test(after.body_text) ||
    !after.images.some((url) => /pbs\.twimg\.com\/media\//.test(url)) ||
    after.cover_prompt_visible ||
    !after.draft_visible ||
    !after.publish_button_visible
  ) {
    throw new Error("The revised X Article failed its post-reload verification.");
  }
  console.log(
    JSON.stringify(
      {
        draft_id: draftId,
        draft_url: draftUrl,
        title: after.title,
        word_count: after.word_count,
        heading_count: after.heading_count,
        ordered_list_count: after.ordered_list_count,
        unordered_list_count: after.unordered_list_count,
        cover_present: true,
        all_source_text_present: true,
        em_dash_present: false,
        formulaic_qualifier_present: false,
        persisted_after_reload: true,
        published: false,
        backup_path: backupPath,
      },
      null,
      2,
    ),
  );
} finally {
  cdp?.close();
  chromium.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!profileDir.startsWith(join(tmpdir(), "codex-x-article-replace-"))) {
    throw new Error("Refusing to clean an unexpected browser profile path.");
  }
  rmSync(profileDir, { recursive: true, force: true });
}
