import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";
import { markdownToProseMirror } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/utils/markdown-to-prosemirror.js";

const cookiePath =
  process.env.SUBSTACK_COOKIE_FILE ||
  "/home/mayur/.codex/secrets/substack_cookie.txt";
const publicationUrl = "https://mayursinha.substack.com";
const userId = "39193434";
const root = "/home/mayur/code/blog/_drafts/substack-live-revamps";
const items = [
  {
    id: 212252221,
    slug: "the-pile-of-hindu-texts-i-could-never",
    postDate: "2026-08-22T12:44:20.255Z",
    path: `${root}/the-pile-of-hindu-texts-i-could-never.md`,
  },
  {
    id: 169933661,
    slug: "designing-a-living-ecosystem-of-ai",
    postDate: "2025-08-02T15:44:30.409Z",
    path: `${root}/designing-a-living-ecosystem-of-ai-agents.md`,
  },
  {
    id: 152819726,
    slug: "the-metamorphosis-in-the-21st-century",
    postDate: "2024-12-09T00:44:27.287Z",
    path: `${root}/the-metamorphosis-in-the-21st-century.md`,
  },
  {
    id: 141775722,
    slug: "exploring-the-depths-of-consciousness",
    postDate: "2024-02-18T16:37:49.550Z",
    path: `${root}/exploring-the-depths-of-consciousness.md`,
  },
  {
    id: 141755605,
    slug: "quantum-mechanics-and-finance",
    postDate: "2024-02-17T12:25:54.283Z",
    path: `${root}/quantum-mechanics-and-finance.md`,
  },
  {
    id: 135442420,
    slug: "resolving-the-epicurean-paradox",
    postDate: "2023-07-25T15:41:00.686Z",
    path: `${root}/resolving-the-epicurean-paradox.md`,
  },
  {
    id: 135055676,
    slug: "elon-musks-xai",
    postDate: "2023-07-16T22:59:21.239Z",
    path: `${root}/elon-musks-xai.md`,
  },
  {
    id: 134193812,
    slug: "the-interplay-of-science-humanity",
    postDate: "2023-07-09T22:53:14.003Z",
    path: `${root}/the-interplay-of-science-humanity-and-the-soul.md`,
  },
  {
    id: 107487315,
    slug: "mans-greatest-achievement",
    postDate: "2023-03-09T22:27:15.148Z",
    path: `${root}/mans-greatest-achievement.md`,
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

const client = new SubstackClient(publicationUrl, tokenMatch[1], userId);
const beforeListing = await client.getPublishedPosts(0, 50);
if (beforeListing.total !== 9 || beforeListing.posts.length !== 9) {
  throw new Error(
    `Expected 9 published posts, received ${beforeListing.posts.length} of ${beforeListing.total}.`,
  );
}

const beforeRows = new Map();
for (const item of items) {
  const row = beforeListing.posts.find((candidate) => candidate.id === item.id);
  if (!row || row.slug !== item.slug || row.post_date !== item.postDate) {
    throw new Error(`Pre-edit published identity invariant failed for ${item.id}.`);
  }
  beforeRows.set(item.id, row);
}

const results = [];
for (const item of items) {
  const beforeRow = beforeRows.get(item.id);
  const beforeDraft = await client.getDraft(item.id);
  const beforeMetadata = stableDraftMetadata(beforeDraft);
  const markdown = readFileSync(item.path, "utf8").trim();
  if (markdown.includes("—")) throw new Error(`Em dash remains in ${item.path}.`);
  const body = markdownToProseMirror(markdown);

  await client.updateDraft(item.id, {
    draft_body: body,
    should_send_email: false,
  });
  const published = await client.request(
    `${publicationUrl}/api/v1/drafts/${item.id}/publish`,
    {
      method: "POST",
      body: JSON.stringify({ send: false, share_automatically: false }),
    },
  );
  const afterDraft = await client.getDraft(item.id);
  if (
    published.id !== item.id ||
    published.slug !== item.slug ||
    published.post_date !== item.postDate ||
    published.title !== beforeRow.title ||
    published.should_send_email !== false
  ) {
    throw new Error(`Post-edit published identity invariant failed for ${item.id}.`);
  }
  if (
    JSON.stringify(stableDraftMetadata(afterDraft)) !==
    JSON.stringify(beforeMetadata)
  ) {
    throw new Error(`Published metadata changed for ${item.id}.`);
  }
  if (afterDraft.draft_body !== body || afterDraft.should_send_email !== false) {
    throw new Error(`Published body or email safeguard verification failed for ${item.id}.`);
  }
  results.push({
    id: item.id,
    title: published.title,
    slug: published.slug,
    post_date: published.post_date,
    body_sha256: createHash("sha256").update(body).digest("hex"),
    should_send_email: published.should_send_email,
  });
}

const afterListing = await client.getPublishedPosts(0, 50);
if (afterListing.total !== 9 || afterListing.posts.length !== 9) {
  throw new Error("Published post count changed after the revision pass.");
}
for (const item of items) {
  const before = beforeRows.get(item.id);
  const after = afterListing.posts.find((candidate) => candidate.id === item.id);
  if (
    !after ||
    after.slug !== before.slug ||
    after.post_date !== before.post_date ||
    after.title !== before.title ||
    after.cover_image !== before.cover_image
  ) {
    throw new Error(`Final published listing invariant failed for ${item.id}.`);
  }
}

console.log(JSON.stringify(results, null, 2));
