import { readFileSync, statSync } from "node:fs";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";

const cookiePath = "/home/mayur/.codex/secrets/substack_cookie.txt";
const mode = statSync(cookiePath).mode & 0o777;
if ((mode & 0o077) !== 0) throw new Error("Cookie file permissions are too broad.");

const raw = readFileSync(cookiePath, "utf8");
const match = raw.match(/(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m);
if (!match) throw new Error("No Substack session cookie found.");

const client = new SubstackClient(
  "https://mayursinha.substack.com",
  match[1],
  "39193434",
);

const [drafts, scheduled] = await Promise.all([
  client.getDrafts(0, 50),
  client.getScheduledPosts(0, 50),
]);

const wanted = new Set([
  212285921, 212433500, 212437243, 212437718, 212460995, 212460987,
  212460980, 212460977, 212460970, 212433944, 212432521, 212438151,
  212460991,
]);

const inventory = [];
for (const [state, items] of [["draft", drafts], ["scheduled", scheduled]]) {
  for (const item of items) {
    if (!wanted.has(Number(item.id))) continue;
    const full = await client.getDraft(item.id);
    let body;
    try { body = JSON.parse(full.draft_body || "{}"); } catch { body = {}; }
    const firstImage = JSON.stringify(body).match(/https:\/\/substack-post-media[^"\\]+/i)?.[0] || null;
    inventory.push({
      id: Number(item.id),
      title: item.title || item.draft_title || full.draft_title,
      subtitle: full.draft_subtitle || item.subtitle || null,
      slug: item.slug || full.slug || full.draft_slug || null,
      canonical_url: item.canonical_url || full.canonical_url || null,
      cover_image: item.cover_image || full.cover_image || firstImage,
      state,
      scheduled_at: item.trigger_at || item.scheduled_at || null,
      created_at: item.created_at || full.created_at || null,
      management_keys: Object.keys(item).sort(),
      draft_keys: Object.keys(full).sort(),
    });
  }
}

inventory.sort((a, b) => a.id - b.id);
console.log(JSON.stringify(inventory, null, 2));
