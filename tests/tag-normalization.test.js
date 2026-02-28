const assert = require("node:assert/strict");
const test = require("node:test");

const { checkTags } = require("../scripts/check-tags");

test("post tags follow normalization rules", () => {
  const { errors, fileCount } = checkTags();
  assert.ok(fileCount > 0, "No post files were found to validate");
  assert.deepEqual(
    errors,
    [],
    `Tag normalization errors:\n${errors.join("\n")}`
  );
});
