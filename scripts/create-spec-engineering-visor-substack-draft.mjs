import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync, renameSync } from "node:fs";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";
import { markdownToProseMirror } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/utils/markdown-to-prosemirror.js";

const dryRun = process.argv.includes("--dry-run");
const cookiePath = "/home/mayur/.codex/secrets/substack_cookie.txt";
const sourcePath = "/home/mayur/code/blog/_drafts/how-i-use-spec-engineering-to-build-mcp-visor-substack.md";
const receiptPath = "/home/mayur/code/blog/_drafts/how-i-use-spec-engineering-to-build-mcp-visor-substack.json";
const publicationUrl = "https://mayursinha.substack.com";
const userId = "39193434";

if (((statSync(cookiePath).mode & 0o777) & 0o077) !== 0) {
  throw new Error("Substack cookie permissions are too broad.");
}

const rawCookie = readFileSync(cookiePath, "utf8");
const token = rawCookie.match(/(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m)?.[1];
if (!token) throw new Error("No Substack session cookie found.");

const source = readFileSync(sourcePath, "utf8");
const frontMatterMatch = source.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]+)$/);
if (!frontMatterMatch) throw new Error("Source manuscript front matter is invalid.");

const frontMatter = frontMatterMatch[1];
const bodyMarkdown = frontMatterMatch[2].trim();
const title = frontMatter.match(/^title:\s*"([^"]+)"$/m)?.[1];
const subtitle = frontMatter.match(/^subtitle:\s*"([^"]+)"$/m)?.[1];
if (!title || !subtitle) throw new Error("Source title or subtitle is missing.");
if (source.includes("\u2014")) throw new Error("Source contains an em dash.");
if (/\bnot (?:only|merely|simply|just)\b/i.test(source)) {
  throw new Error("Source contains a forbidden formulaic contrast.");
}

const draftBody = markdownToProseMirror(bodyMarkdown);
const client = new SubstackClient(publicationUrl, token, userId);
const [draftsBefore, scheduledBefore, publishedBefore] = await Promise.all([
  client.getDrafts(0, 50),
  client.getScheduledPosts(0, 50),
  client.getPublishedPosts(0, 50),
]);

const allBefore = [
  ...draftsBefore.map((item) => ({ state: "draft", item })),
  ...scheduledBefore.map((item) => ({ state: "scheduled", item })),
  ...publishedBefore.posts.map((item) => ({ state: "published", item })),
];
const duplicate = allBefore.find(({ item }) =>
  [item.title, item.draft_title].some((value) => value?.trim() === title),
);
if (duplicate) {
  throw new Error(`Exact-title ${duplicate.state} already exists with ID ${duplicate.item.id}.`);
}

const preflight = {
  event: "preflight",
  title,
  drafts: draftsBefore.length,
  scheduled: scheduledBefore.length,
  published: publishedBefore.total,
  duplicate: false,
  source_sha256: createHash("sha256").update(source).digest("hex"),
};

if (dryRun) {
  console.log(JSON.stringify(preflight, null, 2));
  process.exit(0);
}

const created = await client.createDraft(title, draftBody, subtitle, "everyone");
const id = Number(created.id);
if (!Number.isInteger(id) || id <= 0) throw new Error("Substack returned an invalid draft ID.");

await new Promise((resolve) => setTimeout(resolve, 1000));

const [live, draftsAfter, scheduledAfter] = await Promise.all([
  client.getDraft(id),
  client.getDrafts(0, 50),
  client.getScheduledPosts(0, 50),
]);

if (live.draft_title !== title) throw new Error("Draft title did not persist.");
if (live.draft_subtitle !== subtitle) throw new Error("Draft subtitle did not persist.");
if (live.draft_body !== draftBody) throw new Error("Draft body did not persist exactly.");
if (live.audience !== "everyone") throw new Error("Draft audience changed unexpectedly.");
if (live.is_published) throw new Error("Draft was unexpectedly published.");
if (!draftsAfter.some((item) => Number(item.id) === id)) {
  throw new Error("Created post is absent from the fresh draft listing.");
}
if (scheduledAfter.some((item) => Number(item.id) === id) || live.postSchedules?.length) {
  throw new Error("Draft was unexpectedly scheduled.");
}

const receipt = {
  title,
  subtitle,
  source_path: sourcePath,
  source_sha256: preflight.source_sha256,
  substack_id: id,
  substack_editor_url: `${publicationUrl}/publish/post/${id}`,
  substack_state: "draft",
  audience: live.audience,
  cover_image: live.cover_image || null,
  scheduled: false,
  published: false,
  verified_at: new Date().toISOString(),
};
const temporaryReceiptPath = `${receiptPath}.tmp`;
writeFileSync(temporaryReceiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
renameSync(temporaryReceiptPath, receiptPath);

console.log(JSON.stringify({ preflight, receipt }, null, 2));
