# Task: add the hero image to Substack draft 216133929 and set it as the cover

The hero asset now exists. Place it the way every other essay on this publication does: the hero is the FIRST node of the body, and the same asset is set as the post's `cover_image`.

Hard permission boundary: one existing unpublished draft. Do not publish, do not send email, do not schedule, do not share, do not delete anything, do not touch any other post.

Target draft: `216133929` on mayursinha.substack.com.
Asset: `/home/mayur/code/blog/img/substack/legacy-custody-hero.png`
Reference for the convention: any recently published Substack essay on this publication, for example "How to Study Based on How Memory Works" or "The Engineers Didn't Finish the Job". Check one of them first: the hero image is the first node of the body, with a short plain alt text and no caption underneath it in the body.

Steps:

1. Confirm the asset exists, is a PNG, and is under 10 MB.
2. Upload it to the publication through your existing Substack client and cookie. Keep the returned Substack URL.
3. Insert an image node with that URL as the FIRST node of the draft body, above the opening paragraph ("When I say I want to build a legacy..."). Use this alt text: "A quiet workshop after the maker has gone, with the work already being continued by other hands."
4. Do not add a caption under the hero. If the publication's own convention for the most recent posts includes no caption, match that.
5. Set the draft's `cover_image` to the same uploaded URL.
6. Change nothing else: not one word of prose, not the title, not the subtitle ("Would the work still function if you stopped?"), not the audience, not any link.

## Verification before you report done

Re-read the draft from the platform and confirm, quoting the platform response:

1. the first body node is an image node whose src is the uploaded URL, and its alt text is the line above;
2. the body contains exactly one image node and no caption node;
3. `cover_image` equals that same URL and fetching it returns HTTP 200 with content type image/png;
4. `is_published` is false and `email_sent_at` is null;
5. the heading list, the paragraph list, and the prose word count are unchanged apart from any words introduced by the alt text (the hero adds no prose);
6. the opening paragraph of the essay is unchanged.

Report: the image URL, the cover URL, the verified first-node type, the paragraph and heading counts, `is_published`, the editor URL, and any deviation with the reason. If the asset is missing or fails upload, stop and report that instead of improvising.
