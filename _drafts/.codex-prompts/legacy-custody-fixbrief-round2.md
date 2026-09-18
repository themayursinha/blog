# Round 2: apply the verified review fixes to the same essay

Same file, same task: `/home/mayur/code/blog/_drafts/legacy-custody-substack.md`. A separate reviewer (Grok 4.6 High) returned CHANGES_REQUESTED. Its claims have been verified by the lead. Apply the fixes below exactly. Read the current file first, then edit it in place. Do not create any other file, do not touch `_posts/`, do not commit or push.

Keep unchanged: the title `Legacy Is a Custody Problem`, and the first three lines (the hook, starting "When I say I want to build a legacy"). Keep 1000 to 1400 words. Keep zero em dashes. Keep the frontmatter shape.

## Fix 1 (P1): the networking history is wrong as written

The draft uses 1 January 1983 as if it decided TCP/IP over OSI. That is a conflation and a technical reader will catch it. Verified facts:

- 1 January 1983 was the ARPANET cutover from NCP to TCP/IP (flag day). Planned in RFC 801, "NCP/TCP Transition Plan", Jon Postel, November 1981, https://www.rfc-editor.org/rfc/rfc801.txt (verified HTTP 200). Some NCP exemptions persisted for days or months, so do not imply an instantaneous total switch.
- The OSI Basic Reference Model was published as ISO 7498 in 1984. The contest between the ISO/OSI protocol suite and the TCP/IP family ran through the late 1980s and early 1990s, and OSI was widely expected to win at the time (government procurement mandates such as GOSIP).
- The TCP/IP side won on running code, free BSD implementations, rough consensus in the IETF, and the cost and delay of ISO documents. Source for that later contest: Andrew L. Russell, "OSI: The Internet That Wasn't", IEEE Spectrum, 2013, https://spectrum.ieee.org/osi-the-internet-that-wasnt (verified HTTP 200).

Rewrite so the two stories stay sequential: the ARPANET protocol switch is one sentence and is described accurately, and the OSI versus TCP/IP adoption contest is the example that carries the merit-versus-adoption point. Or drop flag day entirely. Do not let flag day do work it cannot do. Explain OSI in one plain clause the first time it appears (the international committee effort to define how networks should talk).

## Fix 2 (P2): custody is asserted, not shown

The essay names custody as the missing column and then concludes that governance is what survives. Give it one worked case, 2 or 3 sentences, using only these verified facts:

- Python: Guido van Rossum stepped down as BDFL in July 2018, PEP 13 established an elected steering council, the first council was seated in 2019, and releases continued under that governance (https://peps.python.org/pep-0013/, verified HTTP 200).
- If it fits better, the same history supports a shorter contrast: the IETF kept a deliberately weak and replaceable authority structure, while the ISO committee process produced expensive documents that were often not implemented.

Pick one and keep it accurate. Do not add details beyond the above. Do not invent anything about the Linux kernel, Redis, or OpenSearch unless you verify it at write time, and prefer the Python case.

## Fix 3 (P2): the contrast stencil is overused

These sentences all run the same "not X, it is Y" shape. Reduce to at most one instance in the whole essay:

- "Attention is an input to adoption, not the rival of legacy."
- "Legacy is a governance problem, not an engineering problem."
- "Legacy is not what survives you. It is what others can carry without you."
- "The legacy of that project is not the repository. It is the control-plane pattern."
- "The binding constraint is identity, not effort."

Recast the pull quote to this single positive statement, on its own line as the pull quote:

> Legacy is what other people can carry without you.

Also stop ending every section on a polished aphorism. At least two sections must end on a plain, unremarkable sentence.

## Fix 4 (P2): register drifts into internal vocabulary in the back half

The first half reads like the publication. The second half reads like an internal document. Fix:

- Delete the bold slide-title labels (`Reputation as distribution`, `The follower ledger as an asset`). Say the same thing in plain prose.
- Replace the "The first is / The second is / The third is" passage with flowing prose.
- Cut jargon: decoupling, follower ledger, agent action boundary, binding constraint. Keep the phrase "the decoupling test" at most once, and explain it in plain words the first time (whether the work still functions when you stop).

## Fix 5 (P2): do not call the open proxy a control plane

Remove "control-plane pattern". Reason: in the author's own strategy the open source piece is the data plane (the enforcement proxy) and the control plane is a later, commercial concept. The two must not be merged on a public page.

Verified facts about the project, use only these: public repo https://github.com/themayursinha/mcp-visor, MIT licensed, a self hosted proxy that intercepts MCP `tools/call` requests before relay and evaluates them against policy. Description the repo itself uses: runtime policy enforcement for MCP tool execution.

Do not claim users, adopters, a second maintainer, or that the pattern is already standard practice. The maintainership question may appear only as a question, for example: does anyone run this who has never spoken to me, and is there someone else with the judgment and the commit rights to say no? Keep it unanswered.

Allowed links in the whole essay: RFC 801, the IEEE Spectrum article, PEP 13 if used, and https://github.com/themayursinha/mcp-visor. Nothing else unless you verify it returns HTTP 200 at write time.

## Fix 6 (P2): replace the image concepts

Replace the HTML comment at the end of the file with these three, and keep them clearly marked as not part of the body:

1. Body, at the custody section: a real diagram, not decoration. Three columns for virality, fame and legacy across the essay's three axes, plus a fourth column, custody, filled only under legacy. Restrained, no slogans.
2. Body, at the test that survives: a small decay sketch, three curves for hours, years, decades, with the third continuing only where a second hand holds the line. Caption must say this is a lens, not measured data.
3. Cover only, not in the body: a photograph of a maintained public object, such as a repaired tool, a library book with overlapping stamps, or a worn footpath.

Ban the current two ideas (a bridge passed between hands, an annotated blueprint on a table) and any image of the author receding into a horizon.

## Fix 7 (P3): small cleanups

- Merge the two isolated one sentence paragraphs ("Three parts of this framework still seem right to me." and "That leaves me with a stricter sentence.") into the prose around them.
- Recast "fame with extra steps" into a plain sentence, it reads as meme cadence.
- Do not describe OSI as merely "careful". If it stays, note that the reference model was architecturally sound while the protocol suite was costly, slow, and often not implemented.

## Verification before you report done

```bash
python3 /home/mayur/.hermes/scripts/x-post-gate.py /home/mayur/code/blog/_drafts/legacy-custody-substack.md
python3 /home/mayur/.hermes/scripts/x-post-gate.py /home/mayur/code/blog/_drafts/legacy-custody-substack.md --quiet
grep -c $'\u2014' /home/mayur/code/blog/_drafts/legacy-custody-substack.md
wc -w /home/mayur/code/blog/_drafts/legacy-custody-substack.md
```

Report: final word count, gate output, em dash count, a numbered list of which fixes you applied, and any fix you deliberately did not apply with the reason.
