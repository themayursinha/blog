import { readFileSync, statSync } from "node:fs";
import { SubstackClient } from "/home/mayur/.local/share/substack-mcp/node_modules/@conorbronsdon/substack-mcp/dist/api/client.js";

const cookiePath =
  process.env.SUBSTACK_COOKIE_FILE ||
  "/home/mayur/.codex/secrets/substack_cookie.txt";

const mode = statSync(cookiePath).mode & 0o777;
if ((mode & 0o077) !== 0) {
  throw new Error("Substack cookie file must not be accessible by group or others");
}

const cookieHeader = readFileSync(cookiePath, "utf8");
const tokenMatch = cookieHeader.match(
  /(?:^|[;\s])(?:substack\.sid|connect\.sid)=([^;\s]+)/m,
);
if (!tokenMatch) {
  throw new Error("No Substack session cookie found");
}

const publicationUrl =
  process.env.SUBSTACK_PUBLICATION_URL || "https://mayursinha.substack.com";
const userId = process.env.SUBSTACK_USER_ID || "39193434";
const client = new SubstackClient(publicationUrl, tokenMatch[1], userId);

if (process.argv.length < 3) {
  throw new Error("Pass one or more draft-id=image-url pairs");
}

const results = [];
for (const pair of process.argv.slice(2)) {
  const separator = pair.indexOf("=");
  if (separator < 1) {
    throw new Error(`Invalid draft cover pair: ${pair}`);
  }

  const id = Number(pair.slice(0, separator));
  const coverImage = pair.slice(separator + 1);
  if (!Number.isInteger(id) || !coverImage.startsWith("https://")) {
    throw new Error(`Invalid draft cover pair: ${pair}`);
  }

  const before = await client.getDraft(id);
  if (before.post_date || before.published_at) {
    throw new Error(`Refusing to edit published post ${id}`);
  }

  await client.updateDraft(id, { cover_image: coverImage });
  const after = await client.getDraft(id);
  results.push({ id, title: after.draft_title, cover_image: after.cover_image });
}

console.log(JSON.stringify(results, null, 2));
