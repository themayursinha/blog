# Publishing Checklist (Website + Substack)

Use this workflow for every new post so the site stays the SEO source of truth and Substack drives distribution.

## 1) Publish on Website First

1. Create a new file in `_posts/` with front matter:
   - `layout`, `title`, `date`, `description`, `tags`
   - optional: `share-img`, `related_posts`
2. Run checks locally:
   - `node scripts/check-tags.js`
   - `node --test tests/*.test.js`
   - `bundle exec jekyll build`
3. Verify local preview:
   - `bundle exec jekyll serve --host 0.0.0.0 --port 4000`

## 2) Publish on Substack

1. Create a Substack version of the same essay.
2. Keep the framing email-friendly:
   - tighter intro
   - clear reader takeaway in first 3-5 lines
3. Add canonical mention in Substack body:
   - "Originally published at https://themayursinha.com/..."

## 3) Link Back From Website Post

After the Substack post is live, add this front matter field to the website post:

```yaml
substack_url: "https://your-publication.substack.com/p/your-post-slug"
```

The post layout will automatically show: "This essay is also available on Substack."

## 4) Final Sanity Checks

1. Confirm home/nav/post subscribe links point to Substack:
   - `newsletter.url` in `_config.yml`
2. Confirm no tag style regressions:
   - lowercase slugs only
3. Confirm OG image is set:
   - `share-img` preferred for important posts

## 5) Ship

1. Commit changes.
2. Push to `master`.
3. CI runs build/tests/tag checks.
4. Deploy workflow publishes to `gh-pages` after CI passes.
