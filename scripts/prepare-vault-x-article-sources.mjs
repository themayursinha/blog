import { copyFileSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const vaultManifestPath = "/home/mayur/code/blog/_drafts/vault-essays/manifest.json";
const queueManifestPath = "/home/mayur/code/blog/_drafts/x-articles/manifest.json";
const outputDir = "/home/mayur/code/blog/_drafts/x-articles";
const backupPath = `/home/mayur/code/blog/_backups/x-articles/${new Date().toISOString().replace(/[:.]/g, "-")}-pre-vault-append-manifest.json`;

function atomicWrite(path, value) {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, value, { mode: 0o600 });
  renameSync(temporary, path);
}

const leads = {
  "Who Is Asking?": "AI has made answers abundant. It has also made an older problem harder to ignore: every answer still appears to a subject for whom it matters.",
  "How Much of the Body Can Attention Reach?": "A memoir claim about stopping a heartbeat sounds like a test of belief. A more useful question asks how far disciplined attention can influence physiology.",
};

const vault = JSON.parse(readFileSync(vaultManifestPath, "utf8"));
const queue = JSON.parse(readFileSync(queueManifestPath, "utf8"));
copyFileSync(queueManifestPath, backupPath);

for (const item of vault.items) {
  if (queue.items.some((existing) => existing.title === item.title)) {
    throw new Error(`Refusing to duplicate existing X queue title: ${item.title}`);
  }
  const source = readFileSync(item.source_path, "utf8");
  const body = source.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "").trim();
  const slug = basename(item.source_path, ".md");
  const xPath = join(outputDir, `${slug}.md`);
  const lead = leads[item.title] ? `${leads[item.title]}\n\n` : "";
  const frontMatter = [
    "---",
    `title: ${JSON.stringify(item.title)}`,
    `subtitle: ${JSON.stringify(item.subtitle)}`,
    "platform: x-article",
    "status: draft",
    `source_substack_id: ${item.substack_id}`,
    'source_substack_url: ""',
    "canonical_link_status: pending-until-substack-scheduling",
    `cover_image: ${JSON.stringify(item.cover_url)}`,
    "---",
    "",
  ].join("\n");
  atomicWrite(xPath, `${frontMatter}${lead}${body}\n`);
  queue.items.push({
    ...item,
    substack_source_path: item.source_path,
    source_path: xPath,
    x_draft_id: null,
    x_editor_url: null,
    x_state: "pending-creation",
    verified_at: null,
  });
}

queue.prepared_at = new Date().toISOString();
atomicWrite(queueManifestPath, `${JSON.stringify(queue, null, 2)}\n`);
console.log(JSON.stringify({ x_sources: vault.items.length, queue_items: queue.items.length, backup_path: backupPath }, null, 2));
