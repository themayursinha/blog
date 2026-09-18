# Task: correct Substack draft 216133929 (remove the inline diagram, retitle the subtitle, tighten one dated sentence)

This draft was built to the wrong channel convention. Substack posts open with a hero image at the top of the body. They do not carry inline technical diagrams, and the dark neon-green figure style belongs to the author's website, not to this publication. Fix the draft.

Hard permission boundary: one existing unpublished draft. Do not publish, do not send email, do not schedule, do not share, do not delete anything, do not touch any other post.

Target draft: `216133929` on mayursinha.substack.com.

## Fix 1: remove the inline image entirely

Delete the whole `captionedImage` node (the `image2` plus its `caption`) from the body. The essay is prose only. Do not replace it with another diagram, chart, or generated image. A hero image will be added at the top of the body later, in a separate step, once the asset exists at `img/substack/legacy-custody-hero.png`. Do not set `cover_image` in this run.

Wording change that becomes necessary once the image is gone: the custody section currently opens with "The missing column is custody" and then goes straight into "This leads to the largest correction." Check that the transition still reads cleanly without the image between them, and if a single short sentence is needed to carry the reader across, keep it plain and do not add a new claim.

## Fix 2: subtitle

Change the subtitle from:

`The work that outlives you is the work other people can carry, change, and keep alive.`

to:

`Would the work still function if you stopped?`

This line is the email subject and preview hook. Keep the title as it is: "Legacy Is a Custody Problem".

## Fix 3: one dated sentence is imprecise

Current sentence: "On January 1, 1983, ARPANET began its planned cutover from NCP to TCP/IP; RFC 801, published in 1981, laid out the transition and allowed temporary exemptions, so the old protocol did not disappear everywhere at once."

RFC 801 planned the cutover and set up relay hosts that spoke both NCP and TCP. The NCP exemptions that persisted after the cutover were later DDN-PMO approvals, not a clause of RFC 801. Rewrite so the sentence is exactly right, for example:

"On January 1, 1983, ARPANET began its planned cutover from NCP to TCP/IP. RFC 801, published in 1981, laid out the transition and set up relay hosts that spoke both protocols, so the old one did not vanish everywhere at once."

Keep the link to https://www.rfc-editor.org/rfc/rfc801.txt.

## Fix 4: the local manuscript

Update `/home/mayur/code/blog/_drafts/legacy-custody-substack.md` to match the corrected draft, and replace the trailing `<!-- IMAGE CONCEPTS ... -->` block with a short note that this is a Substack post, so the only image is the hero at the top of the body from `img/substack/<slug>-hero.png`, generated per `_drafts/substack-live-revamps/image-prompts.md`, and that the dark neon SVG figure style is for the website only.

Do not change any other sentence of prose. Do not reformat paragraphs. Do not touch the links to RFC 801, IEEE Spectrum, PEP 13, or the repository.

## Verification before you report done

Re-read the draft from the platform and confirm, quoting the platform response:

1. the body contains no `captionedImage`, no `image2`, and no `caption` node;
2. `draft_subtitle` is the new line;
3. the RFC 801 sentence reads correctly and the link is intact;
4. `is_published` is false and `email_sent_at` is null;
5. the number of headings and paragraphs, and the word count, with one line on what changed (the caption removal should be the only word count change);
6. `cover_image` is still null, deliberately, because the hero asset does not exist yet.

Report: the changes applied, the verification numbers, the editor URL, and the path where the manuscript now stands. If any step fails, stop and report the failure instead of guessing.
