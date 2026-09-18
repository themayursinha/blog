# Task: hostile pre-publication review of one blog post

You are reviewing a blog post before it is published on themayursinha.com. The
author is a senior security engineer. Your job is to find what is wrong with it,
not to praise it or rewrite it.

## The artifact under review

`/home/mayur/code/blog/_drafts/decision-model-tradeoff-blog.md`

It is a measured evaluation of TypeSafe's Jev, a "decision-native" model that
returns typed decisions instead of generated text, tested against a cheap
frontier LLM on two security workflows.

## Read these before you judge anything

Tone and house style references (the post must match these, not generic blog
voice):

- `/home/mayur/code/blog/_posts/2026-09-03-ai-safety-without-ai-security-is-not-safety.md`
- `/home/mayur/code/blog/_posts/2026-08-18-hacking-the-auditor.md`
- `/home/mayur/code/blog/BLOG_STYLE.md`
- `/home/mayur/code/blog/AGENTS.md`

Evidence for the numbers and claims (check the post against these, do not trust
the post):

- `/home/mayur/code/jev-judgment-layer/README.md`
- `/home/mayur/code/jev-judgment-layer/results/REPORT-routes-vs-llm.md`
- `/home/mayur/code/jev-judgment-layer/results/REPORT-jev-vs-llm.md`
- `/home/mayur/code/jev-judgment-layer/results/VISOR-DENIAL-RANKING.md`
- `/home/mayur/code/jev-judgment-layer/results/jev-direct.json`
- `/home/mayur/code/jev-judgment-layer/results/jev-openrouter.json`
- `/home/mayur/code/jev-judgment-layer/results/haiku45.json`
- `/datadisk/PARA/10-Areas/Notes/Obsidian/PARA/20-Areas/Research/TypeSafe AI Jev — Decision-Native Model Assessment 2026-09-17.md`
- `/datadisk/PARA/10-Areas/Notes/Obsidian/PARA/20-Areas/Research/TypeSafe Jev — Independent Evidence and Use-Case Survey (2026-09-18).md`

## What to check, in priority order

1. **Factual accuracy against the evidence files.** Every number in the post must
   match the result files or the notes. List any number that does not, with the
   post's figure and the correct figure.
2. **Unsupported claims.** Flag any assertion the evidence does not carry. This
   matters most for the external claims about other people's tests (a poker
   evaluation, a coding-agent gate, a Norwegian document test) and about the
   vendor's own documentation.
3. **Tone mismatch against the two sibling posts.** Be specific: this author
   writes dense technical prose, links primary sources inline, avoids hype, and
   does not use bullet lists for argument. Say where this post drifts.
4. **Anything a hostile or expert reader would attack.** Name the weakest
   sentence in the post and say why.
5. **AI-writing tells.** Flag sentences that read machine-written. The author's
   hard rules: never an em dash, at most one antithesis construction, no
   "not just X but Y", no rule-of-three chains, varied sentence length.
6. **Structure.** Is the section order right for a reader who knows nothing about
   Jev? Is the first paragraph a reason to keep reading?

## Rules you must follow

- **Do NOT edit the post.** Produce a review, not a revision.
- **Do NOT invent anything.** If you cannot verify a claim from the files above,
  say "unverifiable from the files given" and name what would settle it. Do not
  supply a replacement number, date, or attribution from your own knowledge.
- **Do NOT run git commands that write.** No commit, no push, no branch.
- Do not reformat the post, do not rename it, and do not create any file other
  than the one report specified below.
- Every finding needs the exact quoted sentence from the post and a concrete
  suggested rewrite.
- If a section is good, say so in one line and move on. Do not pad.

## Deliverable

Write exactly one new file:

`/home/mayur/code/blog/_drafts/reviews/decision-model-tradeoff-codex-review.md`

Structure it as:

- **Verdict**: publish as-is, publish after named fixes, or do not publish. Pick one.
- **Blocking findings**: numbered, each with the quoted sentence, why it is wrong,
  and the suggested rewrite.
- **Non-blocking findings**: same shape, lower stakes.
- **Numbers audit**: a table of every figure in the post against the value in the
  evidence files, with a match or mismatch column.
- **Tone diff**: specific lines where the voice drifts from the siblings.
- **The weakest sentence**, named and explained.

Then run the author's own gate on the post and paste the raw output into your
report:

```
python3 ~/.hermes/scripts/x-post-gate.py /home/mayur/code/blog/_drafts/decision-model-tradeoff-blog.md --raw
```

Report that output verbatim, including a failure if there is one. Do not claim
the gate passed unless the output says PASS.
