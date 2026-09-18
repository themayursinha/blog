import { readFileSync, statSync } from "node:fs";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";
import { markdownToProseMirror } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/utils/markdown-to-prosemirror.js";

const cookiePath = "/home/mayur/.codex/secrets/substack_cookie.txt";
const manifestPath = "/home/mayur/code/blog/_drafts/vault-essays/manifest.json";
const alts = {
  "Who Is Asking?": "A machine releases pages of answers while a person faces an inward room lit by a small lamp.",
  "Karma Without Fatalism": "A hand releases one seed where tangled ground and cultivated paths begin to diverge.",
  "How Much of the Body Can Attention Reach?": "A seated figure attends to a warm pulse while breath and subtle physiological patterns pass through the body.",
  "What the Name ‘Artificial Intelligence’ Made Us Expect": "A modest mechanical apparatus sits behind a theatrical curtain casting an outsized human profile.",
  "The Trouble With Wanting to Build Something Important": "An anonymous builder faces a brilliant scientific sphere whose shadow suggests a much larger consequence.",
  "Three Maps to the Same Country": "Three worn maps with wandering routes converge on one illuminated destination.",
};

if (((statSync(cookiePath).mode & 0o777) & 0o077) !== 0) throw new Error("Cookie permissions are too broad.");
const rawCookie = readFileSync(cookiePath, "utf8");
const token = rawCookie.match(/(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m)?.[1];
if (!token) throw new Error("No Substack session cookie found.");
const client = new SubstackClient("https://mayursinha.substack.com", token, "39193434");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const draftRows = await client.getDrafts(0, 50);
const scheduledRows = await client.getScheduledPosts(0, 50);

for (const item of manifest.items) {
  const source = readFileSync(item.source_path, "utf8");
  const body = source.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "").trim();
  const expected = markdownToProseMirror(`![${alts[item.title]}](${item.cover_url})\n\n${body}`);
  const live = await client.getDraft(item.substack_id);
  if (live.draft_title !== item.title || live.draft_subtitle !== item.subtitle) throw new Error(`Identity mismatch for ${item.title}.`);
  if (live.draft_body !== expected) throw new Error(`Body mismatch for ${item.title}.`);
  if (live.cover_image !== item.cover_url) throw new Error(`Cover mismatch for ${item.title}.`);
  if (live.audience !== "everyone" || live.is_published) throw new Error(`Audience or publication state mismatch for ${item.title}.`);
  if (!draftRows.some((row) => Number(row.id) === Number(item.substack_id))) throw new Error(`${item.title} is absent from the draft listing.`);
  if (scheduledRows.some((row) => Number(row.id) === Number(item.substack_id)) || live.postSchedules?.length) throw new Error(`${item.title} was unexpectedly scheduled.`);
  console.log(JSON.stringify({ title: item.title, id: item.substack_id, body: true, cover: true, audience: "everyone", published: false, scheduled: false }));
}

console.log(JSON.stringify({ event: "substack-fresh-audit-complete", drafts: manifest.items.length, published: false, scheduled: false }));
