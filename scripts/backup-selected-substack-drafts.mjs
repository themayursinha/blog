import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";

const cookiePath = "/home/mayur/.codex/secrets/substack_cookie.txt";
const outputDir = process.argv[2];
const targetIds = new Set(process.argv.slice(3).map(Number));
if (!outputDir || targetIds.size === 0) throw new Error("Usage: script OUTPUT_DIR DRAFT_ID...");
if ((statSync(cookiePath).mode & 0o077) !== 0) throw new Error("Cookie file permissions are too broad.");
if (existsSync(outputDir)) throw new Error(`Refusing to overwrite ${outputDir}`);

const cookie = readFileSync(cookiePath, "utf8");
const token = cookie.match(/(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m)?.[1];
if (!token) throw new Error("No Substack session cookie found.");

const client = new SubstackClient("https://mayursinha.substack.com", token, "39193434");
const drafts = await client.getDrafts(0, 50);
const selected = drafts.filter((draft) => targetIds.has(Number(draft.id)));
if (selected.length !== targetIds.size) {
  throw new Error(`Expected ${targetIds.size} selected drafts, found ${selected.length}.`);
}

mkdirSync(outputDir, { recursive: true, mode: 0o700 });
const index = { backed_up_at: new Date().toISOString(), items: [] };
for (const item of selected) {
  const full = await client.getDraft(item.id);
  const body = full.draft_body || "";
  const filename = `draft-${item.id}.json`;
  const snapshot = {
    management: item,
    draft: full,
    draft_body_sha256: createHash("sha256").update(body).digest("hex"),
  };
  writeFileSync(join(outputDir, filename), JSON.stringify(snapshot, null, 2), {
    mode: 0o600,
    flag: "wx",
  });
  index.items.push({
    id: item.id,
    title: item.title || item.draft_title || full.draft_title,
    file: filename,
    draft_body_sha256: snapshot.draft_body_sha256,
  });
}
writeFileSync(join(outputDir, "index.json"), JSON.stringify(index, null, 2), {
  mode: 0o600,
  flag: "wx",
});
console.log(JSON.stringify({ output_dir: outputDir, count: index.items.length }, null, 2));
