import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";

const cookiePath = "/home/mayur/.codex/secrets/substack_cookie.txt";
const manifestPath = "/home/mayur/code/blog/_drafts/vault-essays/manifest.json";
const backupDir = `/home/mayur/code/blog/_backups/substack-vault/${new Date().toISOString().replace(/[:.]/g, "-")}-pre-cover`;

if (((statSync(cookiePath).mode & 0o777) & 0o077) !== 0) {
  throw new Error("Cookie file permissions are too broad.");
}
const raw = readFileSync(cookiePath, "utf8");
const match = raw.match(/(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m);
if (!match) throw new Error("No Substack session cookie found.");

const client = new SubstackClient("https://mayursinha.substack.com", match[1], "39193434");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
mkdirSync(backupDir, { recursive: true, mode: 0o700 });

for (const item of manifest.items) {
  const before = await client.getDraft(item.substack_id);
  if (before.is_published) throw new Error(`Refusing to edit published post ${item.substack_id}.`);
  writeFileSync(join(backupDir, `${item.substack_id}-before.json`), JSON.stringify(before, null, 2), { mode: 0o600, flag: "wx" });
  await client.updateDraft(item.substack_id, { cover_image: item.cover_url });
  const after = await client.getDraft(item.substack_id);
  if (after.cover_image !== item.cover_url) throw new Error(`Cover did not persist for ${item.title}.`);
  if (after.draft_title !== item.title) throw new Error(`Title changed for ${item.title}.`);
  if (after.is_published || after.postSchedules?.length) throw new Error(`${item.title} is no longer an unscheduled draft.`);
  writeFileSync(join(backupDir, `${item.substack_id}-after.json`), JSON.stringify(after, null, 2), { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ title: item.title, id: item.substack_id, cover: true, published: false, scheduled: false }));
}

console.log(JSON.stringify({ event: "substack-cover-batch-complete", drafts: manifest.items.length, backup_dir: backupDir, published: false, scheduled: false }));
