# Task: swap the body image in Substack draft 216133929 from SVG to PNG

Context: you just created the unpublished Substack draft `216133929` ("Legacy Is a Custody Problem") for mayursinha.substack.com and placed the body image as an SVG. Substack accepted it, but SVG does not render reliably in newsletter emails. Replace it with a PNG version, keeping everything else in the draft identical.

Hard permission boundary: this is an edit to one existing unpublished draft. Do not publish, do not send email, do not schedule, do not share, do not delete anything, do not touch any other post. Do not click or call any control named Publish, Send, Schedule, or Delete.

Steps:

1. Rasterize the diagram to PNG at its native size:

```bash
timeout 60 chromium --headless --disable-gpu --no-sandbox --screenshot=/tmp/legacy-custody-columns.png --window-size=1600,900 --virtual-time-budget=6000 "file:///home/mayur/code/blog/img/legacy-custody-columns.svg"
ls -la /tmp/legacy-custody-columns.png
```

2. Upload the PNG to the publication through your existing Substack client and cookie. Keep the returned Substack URL.
3. Update draft `216133929` so the body image `src` points at the new PNG URL. Keep the caption exactly as it is: "Three artifacts, four questions. Custody is the row the framework was missing."
4. Keep the alt text, the position (the captioned image sits directly under the "The missing column is custody" heading, before "This leads to the largest correction."), the title, the subtitle, the audience, and every other node unchanged. Do not reformat the prose, do not re-wrap paragraphs, do not touch the links in RFC 801, IEEE Spectrum, PEP 13, or the repo.
5. Back up the draft state before the edit, as your workflow reference requires for a live draft edit.
6. Verify after saving, by re-reading the draft from the platform:
   - the image URL now ends in `.png` and fetching it returns HTTP 200 with content type image/png;
   - the draft still shows `is_published: false` and `email_sent_at: null`;
   - the stored body still contains every heading and paragraph, and the word count is unchanged apart from nothing (the prose did not change);
   - the old SVG URL no longer appears in the body.

Report: the new PNG URL and its verified content type, the previous SVG URL, confirmation that the old URL is gone from the body, `is_published` quoted from the platform response, and the draft editor URL. If the PNG upload path fails, say so plainly and leave the draft as it is.
