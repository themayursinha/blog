# Task: place the finished essay as an unpublished Substack draft

Use your `weekly-substack-x-publisher` skill. Read `/home/mayur/.codex/skills/weekly-substack-x-publisher/SKILL.md`, then `references/workflow.md` and `references/voice.md` before any platform write, and follow its draft-creation path and its permission boundary.

## Hard permission boundary

Create or update ONE unpublished Substack draft. That is the entire authorization for this run. Do not publish, do not send an email, do not schedule, do not share or promote, do not change any existing publication date, do not delete anything. Do not click or call any control named Publish, Send, Schedule, or Delete.

## Manuscript

`/home/mayur/code/blog/_drafts/legacy-custody-substack.md`

- Title and subtitle come from the frontmatter.
- The body is everything after the frontmatter. Do not include the frontmatter, and do not include the trailing HTML comment block (that block lists image concepts for the author, it is not part of the essay).
- Do not add a level-1 heading that duplicates the title.
- Keep the prose exactly as written. This draft has already passed a straight-through gate and one external review round. Do not rewrite sentences while placing it.

## Body image

`/home/mayur/code/blog/img/legacy-custody-columns.svg` is the diagram for the custody section. It is XML-valid and has passed a rendered visual check (no overflow, no clipping, aligned cards).

- Upload it as a body image at the custody section, ideally near "The missing column is custody".
- The Substack image path may reject SVG. If so, rasterize first with headless Chromium at 1600x900, then upload the PNG:

```bash
timeout 60 chromium --headless --disable-gpu --no-sandbox --screenshot=/tmp/legacy-custody-columns.png --window-size=1600,900 --virtual-time-budget=6000 "file:///home/mayur/code/blog/img/legacy-custody-columns.svg"
```

- Caption: "Three artifacts, four questions. Custody is the row the framework was missing."
- Do NOT set a cover image. The author chooses the cover himself.
- If image upload is not available on your current path, say so plainly and leave the draft text-only. Do not substitute a generated image.

## Platform hygiene

- Use the existing client and the cookie at `/home/mayur/.codex/secrets/substack_cookie.txt`. Never print, echo, copy, or embed the cookie value anywhere, including in your report or any local file.
- Inventory the publication first. If a draft with this title already exists, update that record instead of creating a duplicate. If no draft exists, create one.
- Before overwriting an existing live draft, take the timestamped backup the skill describes.
- Do not change title, subtitle, audience, section, or date fields on any other post.

## Report when done

1. Whether you created a new draft or updated an existing one.
2. The Substack draft ID.
3. The exact editor URL.
4. Confirmation that `is_published` is false, quoted from the platform response, not assumed.
5. The word count that the platform actually stored.
6. Whether the body image uploaded, and the image URL if it did.
7. Anything you could not set, and any deviation from this brief with the reason.
