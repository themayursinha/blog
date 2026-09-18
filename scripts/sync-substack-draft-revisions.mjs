import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";
import { markdownToProseMirror } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/utils/markdown-to-prosemirror.js";

const cookiePath =
  process.env.SUBSTACK_COOKIE_FILE ||
  "/home/mayur/.codex/secrets/substack_cookie.txt";
const publicationUrl = "https://mayursinha.substack.com";
const userId = "39193434";
const root = "/home/mayur/code/blog/_drafts";
const items = [
  { id: 212285921, path: `${root}/substack-live-revamps/resolving-the-epicurean-paradox.md` },
  { id: 212433500, path: `${root}/nietzsche-advaita-substack.md` },
  { id: 212437243, path: `${root}/epistemic-security-substack.md` },
  { id: 212437718, path: `${root}/man-is-a-machine-substack.md` },
  { id: 212460995, path: `${root}/taste-human-bottleneck-substack.md` },
  { id: 212460987, path: `${root}/moral-failure-perfect-arithmetic-substack.md` },
  { id: 212460980, path: `${root}/engineers-didnt-finish-substack.md` },
  { id: 212460977, path: `${root}/grinding-ddos-substack.md` },
  { id: 212460970, path: `${root}/socratic-dialogue-substack.md` },
  {
    id: 212433944,
    path: `${root}/the-ai-agent-dilemma-substack.md`,
    scheduledAt: "2026-08-30T08:00:00.000Z",
  },
  {
    id: 212432521,
    path: `${root}/the-blind-kings-court-substack.md`,
    scheduledAt: "2026-09-06T08:00:00.000Z",
  },
  {
    id: 212438151,
    path: `${root}/how-memory-works-substack.md`,
    scheduledAt: "2026-09-13T08:00:00.000Z",
  },
  {
    id: 212460991,
    path: `${root}/agents-discover-each-other-substack.md`,
    scheduledAt: "2026-09-20T08:00:00.000Z",
  },
];

const mode = statSync(cookiePath).mode & 0o777;
if ((mode & 0o077) !== 0) {
  throw new Error("Cookie file must not be accessible by group or others.");
}
const rawCookieHeader = readFileSync(cookiePath, "utf8");
const tokenMatch = rawCookieHeader.match(
  /(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m,
);
if (!tokenMatch) throw new Error("No Substack session cookie found.");

function bodyFromLocal(path) {
  const raw = readFileSync(path, "utf8");
  if (raw.includes("—")) throw new Error(`Em dash remains in ${path}.`);
  if (!raw.startsWith("---\n")) return raw.trim();
  const end = raw.indexOf("\n---\n", 4);
  if (end < 0) throw new Error(`Unclosed front matter in ${path}.`);
  return raw.slice(end + 5).trim();
}

function stableMetadata(draft) {
  return {
    title: draft.draft_title,
    subtitle: draft.draft_subtitle,
    cover_image: draft.cover_image,
    audience: draft.audience,
    section_id: draft.section_id,
    type: draft.type,
    draft_created_at: draft.draft_created_at,
  };
}

const client = new SubstackClient(publicationUrl, tokenMatch[1], userId);
const [draftRows, scheduledRows] = await Promise.all([
  client.getDrafts(0, 50),
  client.getScheduledPosts(0, 50),
]);
if (draftRows.length !== 9 || scheduledRows.length !== 4) {
  throw new Error(
    `Expected 9 drafts and 4 scheduled posts, received ${draftRows.length} and ${scheduledRows.length}.`,
  );
}

const ordinaryIds = new Set(draftRows.map((row) => row.id));
const scheduledIds = new Set(scheduledRows.map((row) => row.id));
for (const item of items) {
  const expectedSet = item.scheduledAt ? scheduledIds : ordinaryIds;
  if (!expectedSet.has(item.id)) {
    throw new Error(`Draft ${item.id} is missing from its expected management view.`);
  }
  if (item.scheduledAt) {
    const row = scheduledRows.find((candidate) => candidate.id === item.id);
    if (row.trigger_at !== item.scheduledAt) {
      throw new Error(`Unexpected schedule for ${item.id}: ${row.trigger_at}.`);
    }
  }
}

const results = [];
for (const item of items) {
  const before = await client.getDraft(item.id);
  const beforeMetadata = stableMetadata(before);
  const markdown = bodyFromLocal(item.path);
  const body = markdownToProseMirror(markdown);
  await client.updateDraft(item.id, { draft_body: body });
  const after = await client.getDraft(item.id);
  if (JSON.stringify(stableMetadata(after)) !== JSON.stringify(beforeMetadata)) {
    throw new Error(`Metadata changed while updating draft ${item.id}.`);
  }
  if (after.draft_body !== body) {
    throw new Error(`Body verification failed for draft ${item.id}.`);
  }
  results.push({
    id: item.id,
    title: after.draft_title,
    scheduled_at: item.scheduledAt || null,
    body_sha256: createHash("sha256").update(body).digest("hex"),
  });
}

const [afterDraftRows, afterScheduledRows] = await Promise.all([
  client.getDrafts(0, 50),
  client.getScheduledPosts(0, 50),
]);
if (afterDraftRows.length !== 9 || afterScheduledRows.length !== 4) {
  throw new Error("Draft or scheduled-post count changed after the update.");
}
for (const item of items.filter((candidate) => candidate.scheduledAt)) {
  const row = afterScheduledRows.find((candidate) => candidate.id === item.id);
  if (!row || row.trigger_at !== item.scheduledAt) {
    throw new Error(`Schedule changed after updating draft ${item.id}.`);
  }
}

console.log(JSON.stringify(results, null, 2));
