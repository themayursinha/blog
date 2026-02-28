#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const TAG_PATTERN = /^[a-z0-9-]+$/;
const COMMON_MISSPELLINGS = new Set(["sprituality"]);

function getFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

function parseTagsLine(frontMatter) {
  const match = frontMatter.match(/^tags:\s*\[(.*)\]\s*$/m);
  if (!match) {
    return null;
  }
  return match[1]
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function checkTags(options = {}) {
  const postsDir =
    options.postsDir || path.join(__dirname, "..", "_posts");
  const files = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .sort();
  const errors = [];

  for (const file of files) {
    const fullPath = path.join(postsDir, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const frontMatter = getFrontMatter(content);

    if (!frontMatter) {
      errors.push(`${file}: missing front matter block`);
      continue;
    }

    const tags = parseTagsLine(frontMatter);
    if (!tags || tags.length === 0) {
      errors.push(`${file}: missing tags front matter`);
      continue;
    }

    const uniqueTags = new Set(tags);
    if (uniqueTags.size !== tags.length) {
      errors.push(`${file}: duplicate tag values found`);
    }

    for (const tag of tags) {
      if (COMMON_MISSPELLINGS.has(tag)) {
        errors.push(`${file}: replace "${tag}" with "spirituality"`);
      }

      if (tag !== tag.toLowerCase()) {
        errors.push(`${file}: "${tag}" must be lowercase`);
      }

      if (!TAG_PATTERN.test(tag)) {
        errors.push(
          `${file}: "${tag}" must match ${TAG_PATTERN.toString()}`
        );
      }
    }
  }

  return { errors, fileCount: files.length };
}

if (require.main === module) {
  const { errors, fileCount } = checkTags();
  if (errors.length > 0) {
    console.error(
      `Tag normalization failed with ${errors.length} issue(s):`
    );
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Tag normalization passed for ${fileCount} post(s).`);
}

module.exports = { checkTags };
