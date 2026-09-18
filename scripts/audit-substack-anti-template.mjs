import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";
import { markdownToProseMirror } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/utils/markdown-to-prosemirror.js";

const cookiePath = "/home/mayur/.codex/secrets/substack_cookie.txt";
const publicationUrl = "https://mayursinha.substack.com";
const backupDir =
  "/home/mayur/code/blog/_backups/substack-all/2026-08-24-pre-anti-template";
const root = "/home/mayur/code/blog/_drafts";
const drafts = [
  { id: 212285921, path: `${root}/substack-live-revamps/resolving-the-epicurean-paradox.md` },
  { id: 212433500, path: `${root}/nietzsche-advaita-substack.md` },
  { id: 212437243, path: `${root}/epistemic-security-substack.md` },
  { id: 212437718, path: `${root}/man-is-a-machine-substack.md` },
  { id: 212460995, path: `${root}/taste-human-bottleneck-substack.md` },
  { id: 212460987, path: `${root}/moral-failure-perfect-arithmetic-substack.md` },
  { id: 212460980, path: `${root}/engineers-didnt-finish-substack.md` },
  { id: 212460977, path: `${root}/grinding-ddos-substack.md` },
  { id: 212460970, path: `${root}/socratic-dialogue-substack.md` },
  { id: 212433944, path: `${root}/the-ai-agent-dilemma-substack.md`, scheduled: true },
  { id: 212432521, path: `${root}/the-blind-kings-court-substack.md`, scheduled: true },
  { id: 212438151, path: `${root}/how-memory-works-substack.md`, scheduled: true },
  { id: 212460991, path: `${root}/agents-discover-each-other-substack.md`, scheduled: true },
];
const published = [
  {
    id: 212252221,
    path: `${root}/substack-live-revamps/the-pile-of-hindu-texts-i-could-never.md`,
    marker: "OCR led to the more interesting discovery",
  },
  {
    id: 169933661,
    path: `${root}/substack-live-revamps/designing-a-living-ecosystem-of-ai-agents.md`,
    marker: "The risks sit at the center",
  },
  {
    id: 152819726,
    path: `${root}/substack-live-revamps/the-metamorphosis-in-the-21st-century.md`,
    marker: "The insect is frightening",
  },
  {
    id: 141775722,
    path: `${root}/substack-live-revamps/exploring-the-depths-of-consciousness.md`,
    marker: "They disagree partly because they ask different questions",
  },
  {
    id: 141755605,
    path: `${root}/substack-live-revamps/quantum-mechanics-and-finance.md`,
    marker: "Where the particle analogy breaks",
  },
  {
    id: 135442420,
    path: `${root}/substack-live-revamps/resolving-the-epicurean-paradox.md`,
    marker: "Brahman does not fit the paradox",
  },
  {
    id: 135055676,
    path: `${root}/substack-live-revamps/elon-musks-xai.md`,
    marker: "caught my attention more than",
  },
  {
    id: 134193812,
    path: `${root}/substack-live-revamps/the-interplay-of-science-humanity-and-the-soul.md`,
    marker: "explanatory gap invites a closer look",
  },
  {
    id: 107487315,
    path: `${root}/substack-live-revamps/mans-greatest-achievement.md`,
    marker: "Admiration becomes mythology",
  },
];

const mode = statSync(cookiePath).mode & 0o777;
if ((mode & 0o077) !== 0) throw new Error("Cookie file permissions are too broad.");
const raw = readFileSync(cookiePath, "utf8");
const token = raw.match(/(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m)?.[1];
if (!token) throw new Error("No Substack session cookie found.");
const client = new SubstackClient(publicationUrl, token, "39193434");

const backupIndex = JSON.parse(readFileSync(join(backupDir, "index.json"), "utf8"));
const backups = new Map();
for (const row of backupIndex.items) {
  backups.set(
    `${row.kind}:${row.id}`,
    JSON.parse(readFileSync(join(backupDir, row.file), "utf8")),
  );
}

function markdownBody(path) {
  const rawBody = readFileSync(path, "utf8");
  if (rawBody.includes("—")) throw new Error(`Em dash remains in ${path}.`);
  if (/\bnot (?:only|merely|simply|just)\b/i.test(rawBody)) {
    throw new Error(`Formulaic qualifier remains in ${path}.`);
  }
  if (
    /\b(?:It|This|That) (?:is|was|are|were) not [^.?!]{1,180}[.?!]\s+(?:It|This|That|They) (?:is|was|are|were)\b/i.test(
      rawBody,
    )
  ) {
    throw new Error(`Formulaic sentence reversal remains in ${path}.`);
  }
  if (!rawBody.startsWith("---\n")) return rawBody.trim();
  const end = rawBody.indexOf("\n---\n", 4);
  if (end < 0) throw new Error(`Unclosed front matter in ${path}.`);
  return rawBody.slice(end + 5).trim();
}

function stableDraftMetadata(draft) {
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

const [draftRows, scheduledRows, publishedListing] = await Promise.all([
  client.getDrafts(0, 50),
  client.getScheduledPosts(0, 50),
  client.getPublishedPosts(0, 50),
]);
if (
  draftRows.length !== 9 ||
  scheduledRows.length !== 4 ||
  publishedListing.total !== 9 ||
  publishedListing.posts.length !== 9
) {
  throw new Error("A Substack management-view count changed.");
}

const results = { drafts: [], scheduled: [], published: [] };
for (const item of drafts) {
  const kind = item.scheduled ? "scheduled" : "draft";
  const backup = backups.get(`${kind}:${item.id}`);
  if (!backup) throw new Error(`Backup missing for ${kind} ${item.id}.`);
  const live = await client.getDraft(item.id);
  const expectedBody = markdownToProseMirror(markdownBody(item.path));
  if (live.draft_body !== expectedBody) {
    throw new Error(`Live body differs from local source for draft ${item.id}.`);
  }
  if (
    JSON.stringify(stableDraftMetadata(live)) !==
    JSON.stringify(stableDraftMetadata(backup.draft))
  ) {
    throw new Error(`Stable metadata differs from backup for draft ${item.id}.`);
  }
  if (item.scheduled) {
    const current = scheduledRows.find((row) => row.id === item.id);
    if (!current || current.trigger_at !== backup.management.trigger_at) {
      throw new Error(`Schedule differs from backup for ${item.id}.`);
    }
    results.scheduled.push({ id: item.id, title: live.draft_title, trigger_at: current.trigger_at });
  } else {
    results.drafts.push({ id: item.id, title: live.draft_title });
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
}

for (const item of published) {
  const backup = backups.get(`published:${item.id}`);
  if (!backup) throw new Error(`Published backup missing for ${item.id}.`);
  const management = publishedListing.posts.find((row) => row.id === item.id);
  const before = backup.management;
  if (
    !management ||
    management.id !== before.id ||
    management.slug !== before.slug ||
    management.post_date !== before.post_date ||
    management.title !== before.title ||
    management.cover_image !== before.cover_image
  ) {
    throw new Error(`Published management metadata differs from backup for ${item.id}.`);
  }
  const liveDraft = await client.getDraft(item.id);
  const expectedBody = markdownToProseMirror(markdownBody(item.path));
  if (liveDraft.draft_body !== expectedBody || liveDraft.should_send_email !== false) {
    throw new Error(`Published draft body or email safeguard failed for ${item.id}.`);
  }
  if (
    JSON.stringify(stableDraftMetadata(liveDraft)) !==
    JSON.stringify(stableDraftMetadata(backup.draft))
  ) {
    throw new Error(`Published stable metadata differs from backup for ${item.id}.`);
  }
  const response = await fetch(
    `${publicationUrl}/api/v1/posts/by-id/${item.id}?audit=anti-template-${Date.now()}`,
    { headers: { "User-Agent": "Mozilla/5.0" } },
  );
  if (!response.ok) throw new Error(`Public fetch failed for ${item.id}: ${response.status}.`);
  const payload = await response.json();
  const post = payload.post || payload;
  const html = post.body_html || "";
  if (
    post.id !== item.id ||
    post.slug !== before.slug ||
    post.post_date !== before.post_date ||
    post.title !== before.title ||
    post.cover_image !== before.cover_image ||
    !post.is_published ||
    html.includes("—") ||
    !html.includes(item.marker)
  ) {
    throw new Error(`Public content or identity audit failed for ${item.id}.`);
  }
  results.published.push({
    id: item.id,
    title: post.title,
    slug: post.slug,
    post_date: post.post_date,
    marker_live: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 700));
}

console.log(JSON.stringify(results, null, 2));
