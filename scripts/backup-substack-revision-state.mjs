import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";

const cookiePath =
  process.env.SUBSTACK_COOKIE_FILE ||
  "/home/mayur/.codex/secrets/substack_cookie.txt";
const outputDir =
  process.env.SUBSTACK_BACKUP_DIR ||
  "/home/mayur/code/blog/_backups/substack-all/2026-08-24-pre-anti-template";
const publicationUrl = "https://mayursinha.substack.com";
const userId = "39193434";

const mode = statSync(cookiePath).mode & 0o777;
if ((mode & 0o077) !== 0) {
  throw new Error("Cookie file must not be accessible by group or others.");
}
if (existsSync(outputDir)) {
  throw new Error(`Refusing to overwrite existing backup directory: ${outputDir}`);
}

const rawCookieHeader = readFileSync(cookiePath, "utf8");
const tokenMatch = rawCookieHeader.match(
  /(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m,
);
if (!tokenMatch) throw new Error("No Substack session cookie found.");

const client = new SubstackClient(publicationUrl, tokenMatch[1], userId);
const [{ posts: published, total }, drafts, scheduled] = await Promise.all([
  client.getPublishedPosts(0, 50),
  client.getDrafts(0, 50),
  client.getScheduledPosts(0, 50),
]);
if (total !== 9 || published.length !== 9) {
  throw new Error(`Expected 9 published posts, received ${published.length} of ${total}.`);
}
if (drafts.length !== 9 || scheduled.length !== 4) {
  throw new Error(
    `Expected 9 drafts and 4 scheduled posts, received ${drafts.length} and ${scheduled.length}.`,
  );
}

mkdirSync(outputDir, { recursive: true, mode: 0o700 });
const index = { publication: publicationUrl, backed_up_at: new Date().toISOString(), items: [] };
for (const [kind, items] of [
  ["published", published],
  ["draft", drafts],
  ["scheduled", scheduled],
]) {
  for (const item of items) {
    const full = await client.getDraft(item.id);
    const body = full.draft_body || "";
    const safeSlug = String(item.slug || full.draft_title || item.id)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `${kind}-${item.id}-${safeSlug}.json`;
    const snapshot = {
      kind,
      management: item,
      draft: full,
      draft_body_sha256: createHash("sha256").update(body).digest("hex"),
    };
    writeFileSync(join(outputDir, filename), JSON.stringify(snapshot, null, 2), {
      mode: 0o600,
      flag: "wx",
    });
    index.items.push({
      kind,
      id: item.id,
      title: item.title || item.draft_title || full.draft_title,
      slug: item.slug || null,
      post_date: item.post_date || null,
      trigger_at: item.trigger_at || null,
      file: filename,
      draft_body_sha256: snapshot.draft_body_sha256,
    });
  }
}

writeFileSync(join(outputDir, "index.json"), JSON.stringify(index, null, 2), {
  mode: 0o600,
  flag: "wx",
});
console.log(
  JSON.stringify(
    {
      output_dir: outputDir,
      published: published.length,
      drafts: drafts.length,
      scheduled: scheduled.length,
      total: index.items.length,
    },
    null,
    2,
  ),
);
