import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";
import { markdownToProseMirror } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/utils/markdown-to-prosemirror.js";

const cookiePath = "/home/mayur/.codex/secrets/substack_cookie.txt";
const publicationUrl = "https://mayursinha.substack.com";
const items = [
  {
    id: 134193812,
    slug: "the-interplay-of-science-humanity",
    postDate: "2023-07-09T22:53:14.003Z",
    path: "/home/mayur/code/blog/_drafts/substack-live-revamps/the-interplay-of-science-humanity-and-the-soul.md",
    bodyAlreadyStaged: true,
  },
  {
    id: 107487315,
    slug: "mans-greatest-achievement",
    postDate: "2023-03-09T22:27:15.148Z",
    path: "/home/mayur/code/blog/_drafts/substack-live-revamps/mans-greatest-achievement.md",
    bodyAlreadyStaged: false,
  },
];

const mode = statSync(cookiePath).mode & 0o777;
if ((mode & 0o077) !== 0) throw new Error("Cookie file permissions are too broad.");
const raw = readFileSync(cookiePath, "utf8");
const token = raw.match(/(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m)?.[1];
if (!token) throw new Error("No Substack session cookie found.");
const client = new SubstackClient(publicationUrl, token, "39193434");

const beforeListing = await client.getPublishedPosts(0, 50);
if (beforeListing.total !== 9 || beforeListing.posts.length !== 9) {
  throw new Error("Published post count changed before resume.");
}

const results = [];
for (const item of items) {
  const beforeRow = beforeListing.posts.find((post) => post.id === item.id);
  if (!beforeRow || beforeRow.slug !== item.slug || beforeRow.post_date !== item.postDate) {
    throw new Error(`Pre-resume identity invariant failed for ${item.id}.`);
  }
  const beforeDraft = await client.getDraft(item.id);
  const stable = {
    title: beforeDraft.draft_title,
    subtitle: beforeDraft.draft_subtitle,
    cover_image: beforeDraft.cover_image,
    audience: beforeDraft.audience,
    section_id: beforeDraft.section_id,
    draft_created_at: beforeDraft.draft_created_at,
  };
  const markdown = readFileSync(item.path, "utf8").trim();
  if (markdown.includes("—")) throw new Error(`Em dash remains in ${item.path}.`);
  const body = markdownToProseMirror(markdown);
  if (item.bodyAlreadyStaged) {
    if (beforeDraft.draft_body !== body) {
      throw new Error(`Expected staged body is missing for ${item.id}.`);
    }
  } else {
    await client.updateDraft(item.id, { draft_body: body, should_send_email: false });
  }

  const published = await client.request(
    `${publicationUrl}/api/v1/drafts/${item.id}/publish`,
    {
      method: "POST",
      body: JSON.stringify({ send: false, share_automatically: false }),
    },
  );
  const afterDraft = await client.getDraft(item.id);
  const afterStable = {
    title: afterDraft.draft_title,
    subtitle: afterDraft.draft_subtitle,
    cover_image: afterDraft.cover_image,
    audience: afterDraft.audience,
    section_id: afterDraft.section_id,
    draft_created_at: afterDraft.draft_created_at,
  };
  if (
    published.id !== item.id ||
    published.slug !== item.slug ||
    published.post_date !== item.postDate ||
    published.title !== beforeRow.title ||
    published.should_send_email !== false ||
    JSON.stringify(afterStable) !== JSON.stringify(stable) ||
    afterDraft.draft_body !== body
  ) {
    throw new Error(`Post-resume invariant failed for ${item.id}.`);
  }
  results.push({
    id: item.id,
    title: published.title,
    slug: published.slug,
    post_date: published.post_date,
    body_sha256: createHash("sha256").update(body).digest("hex"),
    should_send_email: published.should_send_email,
  });
  await new Promise((resolve) => setTimeout(resolve, 12000));
}

console.log(JSON.stringify(results, null, 2));
