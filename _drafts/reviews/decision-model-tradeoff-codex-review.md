# Verdict

**Do not publish.** The post needs named fixes before publication: correct the repeated accuracy-gap claim, correct the conclusion's price ratio, regenerate the figure with the corrected speed result, distinguish eight probe types from sixteen probe executions per workflow, remove or source the unsupported secondary aggregates, reconcile the poker denominators, and narrow several methodological claims that the supplied evidence does not establish. The core run results are mostly accurate, but the errors sit in the subtitle, figure, conclusion, and external-evidence section, where a hostile reader will look first.

# Blocking findings

1. **The headline accuracy range is wrong.**

   > "It came back 47 times cheaper and 6 to 14 points less accurate. The trade decides where it belongs."

   The same range appears again in the figure caption and in "So the model built specifically for this job lost to a general model by 6 to 14 points." Against Haiku 4.5, the only baseline that beat Jev on both workflows, the gaps are 10.0 points on incidents and 14.3 points on traces. Against Luna, Jev lost by 5.0 points on incidents and won by 7.2 points on traces. No comparison in the supplied results produces a 6-point lower bound.

   **Suggested rewrite:** "It came back 47 times cheaper than Haiku 4.5 and 10 to 14 points less accurate on these two workflows. The trade decides where it belongs." Apply the same correction to the caption and results paragraph.

2. **The conclusion contradicts the measured cost by more than an order of magnitude.**

   > "It is also less accurate than a general model at a third of the price per run, which makes it a serious option for bulk classification and a bad one for anything a human is not checking."

   Jev cost $0.002082 for both workflows. Haiku cost $0.097652, making Jev about one forty-seventh of Haiku's price, not one third. Even against Luna's $0.0259 total, Jev cost about one twelfth as much. The recommendation also outruns a 34-case, synthetic, single-annotator evaluation.

   **Suggested rewrite:** "It was less accurate than Haiku 4.5 on both workflows while costing about one forty-seventh as much for the full 34-case run. That makes it worth evaluating for high-volume classification, but this test does not justify unattended deployment."

3. **The rendered figure contains the superseded speed result, and its caption misidentifies the comparison baseline.**

   > "Jev: 47x cheaper than Haiku, 4.4x to 5.3x faster"

   That text is in `img/decision-model-tradeoff.svg`, which the post renders as Figure 1. The supplied note explicitly calls 4.4x to 5.3x the earlier, incorrect result caused by opening a new gateway connection per call. The corrected direct-route result is 7.0x to 7.5x. The post caption also says Jev "lost 6 to 14 points of accuracy to the cheapest model it was compared against." Luna was the cheapest comparison model, and Jev beat Luna on trace review. Haiku was the cheapest baseline that beat Jev on both workflows.

   **Suggested rewrite:** Regenerate the figure footer as "Jev: 47x cheaper than Haiku, 7.0x to 7.5x faster" and change the caption clause to "lost 10.0 and 14.3 points of accuracy to Haiku 4.5, the cheapest baseline that beat it on both workflows."

4. **The adversarial-probe count is presented as executions when it is a count of probe types.**

   > "I also threw eight adversarial probes at each workflow, including instructions hidden in tool output telling the model to export a customer table."

   The README says there are eight probe types on four base cases. Both result reports record 16 probe executions per workflow, not eight. The following flip counts use 16 as their denominator. As written, the post makes one of sixteen look like one of eight.

   **Suggested rewrite:** "I also ran sixteen adversarial probe executions per workflow, covering eight probe types across two base cases in each workflow, including instructions hidden in tool output telling the model to export a customer table."

5. **The post describes the wrong task as the measured `process_reputation` question and calls it uniquely hardest when the raw results do not.**

   > "Across every model I have tested on this harness, the question they all fail is whether an executing binary is expected on a given host. Jev got 40 percent on it and the frontier model got 35 percent."

   The raw `process_reputation` output is a multi-class reputation choice (`system_binary`, `signed_third_party`, `signed_vendor`, `unsigned`, `known_malware`, `unknown`), not the binary expected-on-host question shown in the trimmed example. A separate Noul named `expected_binary` scored 100 percent for Jev and Haiku. On the direct Jev route, `investigative_value` tied `process_reputation` at 40 percent; on the gateway route it was lower at 35 percent. The 40 and 35 percent figures themselves match, but the description and "the question they all fail" claim do not.

   **Suggested rewrite:** "One of the weakest questions was `process_reputation`, which asked the model to classify the binary's reputation from the alert. Jev scored 40 percent and Haiku 4.5 scored 35 percent. The separate `expected_binary` fact stayed in code and scored 100 percent."

6. **The external cost and accuracy aggregates are not supported to publication standard by the supplied files.**

   > "Independent testers who bought their own calls report cost advantages in the range of 5 to 27 times, against the vendor's headline of 444 times, so the economics are real while the multiples are not. And secondary reporting disagrees about Jev's own accuracy score, quoting both 67.8 percent and 76.0 percent for the same vendor evaluation, which is a good reason to measure your own workload instead of citing anyone's number, including mine."

   The 5x to 27x range appears only in the survey note's explicitly "agent-compiled" section, whose own epistemic warning says to treat such material as a reading list rather than verified fact. The supplied files contain no source at all for 67.8 percent. They do contain 76.0 percent as Jev's Customer Service workflow score, not evidence that 67.8 and 76.0 describe the same vendor evaluation. This is **unverifiable from the files given**. The primary tester pages and the two secondary articles, with the exact tables or passages showing the scope of each number, would settle it.

   **Suggested rewrite:** "My run found a 47x cost advantage over Haiku 4.5. TypeSafe advertises a 444.6x headline result on its own four-workflow evaluation, so neither multiple should be transferred to another workload without measurement." Delete the 67.8/76.0 sentence unless the underlying sources are added and shown to use the same metric and scope.

7. **The poker paragraph contains an impossible-looking denominator change that the supplied synthesis does not explain.**

   > "Across 30 spots it agreed with the solver 63 percent of the time. On the 55 spots where the solver does something other than check, it managed 33 to 44 percent, against 24 to 29 percent for rules containing no model at all."

   Fifty-five cannot be a subset of thirty if both units are "spots." The survey note repeats these figures but does not explain whether the 55 are decisions, model-condition observations, or something else. This is **unverifiable from the files given** at the unit level. The poker article's underlying table or methodology would settle it.

   **Suggested rewrite:** "The poker evaluation reported 63 percent solver agreement overall. On the subset its author called contested decisions, Jev beat rule-only baselines but still chose the solver's action less than half the time." Restore the exact denominators only after naming their units.

8. **The self-check is useful, but the post claims it excludes more bugs than it can exclude.**

   > "That check is the reason I can trust a model's miss as a model's miss rather than a bug in my composition code."

   A 100 percent ideal-answer replay shows that the composition rules reproduce the author's labels for those fixtures. It does not rule out bugs in prompt construction, response parsing, backend adaptation, case generation, or the labels themselves. Even for composition, it tests only the supplied ideal-answer paths.

   **Suggested rewrite:** "That check shows that the composition rules reproduce all 34 labels from the supplied ideal answers, so a low model score is not explained by those rules alone."

9. **The route replication is overstated as endpoint independence.**

   > "Two independent routes returning the same answers is the kind of check that tells you an evaluation measured a model rather than an endpoint's quirks."

   The routes returned the same 34 composed decisions and the same miss set, but they did not return identical underlying values. For example, the direct incident confidence bins were 33.3 percent and 16.7 percent accurate where the gateway bins were 26.7 percent and 14.3 percent; individual scores also differ. Both routes may ultimately serve the same model infrastructure. The replication rules out a decision-level discrepancy in these runs, not endpoint quirks in general.

   **Suggested rewrite:** "The two routes produced the same 34 composed decisions and the same 11 misses, which rules out a decision-level route discrepancy in this run. Their underlying probabilities and scores were close but not identical."

10. **The hallucination sentence is false on its own terms.**

    > "A model that cannot produce text also cannot produce a plausible-looking wrong answer, but it can still be wrong, and mine was wrong 30 percent of the time."

    A typed choice with high confidence can be a plausible-looking wrong answer; the confidence-bin result is the post's own evidence. The 30 percent figure is only the incident error rate (6 of 20). Across both workflows Jev missed 11 of 34, or 32.4 percent. The sentence also adds another polished antithesis to a draft already overusing that device.

    **Suggested rewrite:** "Constrained output prevents free-form fabrication, not confident error. Jev missed 6 of 20 incident decisions and 5 of 14 trace decisions."

11. **The alias/version claim is unsupported and contradicted by the harness's own provenance.**

    > "The model answers behind an alias, so the thing I measured was version 1.13 on the day I ran it, and version drift will not be visible in anyone's results but mine."

    The research note and README state that every gateway call reports the concrete version behind `jev-latest`, and the harness records the backend and timestamps. Other testers can log the same resolved version. Alias drift is a reproducibility risk, but it is not uniquely visible to this author.

    **Suggested rewrite:** "The public endpoint uses a moving alias, so reproducible evaluations need to record the concrete version returned on every call. These runs resolved to Jev 1.13 on 18 September 2026."

# Non-blocking findings

1. **The fan-out sentence confuses one request with flat cost.**

   > "You can ask 20 questions about one alert for the price of one call."

   It is one request, but input-token billing still increases with the question definitions. The measured fan-out cost supports cheap batching, not a constant price independent of question count.

   **Suggested rewrite:** "You can ask 20 questions about one alert in one request; the measured fan-out cost was $0.000031."

2. **The per-million calculation is rounded too aggressively for a paragraph presenting six-decimal pricing.**

   > "Twenty typed questions over one state, in a single request, cost $0.000031. A dollar and a half buys a million of them."

   At that measured rate, one million questions cost about $1.55, reported as $1.56 in the research note. "A dollar and a half" is conversationally close, but it fails this post's otherwise exact numerical standard.

   **Suggested rewrite:** "Twenty typed questions over one state, in a single request, cost $0.000031, or about $1.56 per million questions."

3. **The confidence conclusion is stronger than the sample.**

   > "Any design that reads `if confidence > 0.9` and routes to the top of a queue is routing on noise."

   The evidence shows that Choice/Score confidence did not order accuracy reliably in these two small workflows. It does not establish that every such design routes on noise, and the post later warns readers not to generalize absolute accuracy from 34 synthetic cases.

   **Suggested rewrite:** "On these workflows, a `confidence > 0.9` gate would not have ordered decisions reliably enough to route a queue."

4. **The injection-causality claim needs an ablation or narrower wording.**

   > "The injection resistance turned out not to come from the model at all: it came from deterministic facts in code holding a floor under the composed decision."

   The probe records show that the code floor prevented downgrades while model answers moved. They do not isolate all possible contribution from the model because there is no no-floor ablation of the same runs. "Not at all" is stronger than the design evidence.

   **Suggested rewrite:** "In these probes, the deterministic code floor prevented every downgrade even when model answers moved."

5. **The single-annotator claim understates comparative bias.**

   > "A single annotator on synthetic data is enough to compare models against each other, and nowhere near enough to claim a real-world accuracy figure for anything."

   Paired labels make a comparison possible, but one author's cases, labels, rubrics, and composition weights can favor one model or error style. The evidence supports a smoke-test comparison, not a general statement that one annotator is enough.

   **Suggested rewrite:** "A single annotator on synthetic data is enough for a paired smoke test, not for a stable model ranking or a real-world accuracy claim."

6. **The seven-point noise bound is scoped too broadly.**

   > "The runs are single-shot, so a difference under about 7 points might be inside the noise."

   The supplied support comes from three Haiku repeats on the 14-case trace workflow, where accuracy was 78.6, 78.6, and 85.7 percent. It is not a general uncertainty interval for both workflows or all models.

   **Suggested rewrite:** "In three Haiku repeats on the 14-case trace set, accuracy varied by 7.1 points, so differences of that size on this small set may be run noise."

7. **The external injection-evaluation absence claim needs a search boundary.**

   > "Read that as an honest admission that prompt injection is unsolved here, because I could not find a published injection evaluation from anyone. My probe run is one of the few attempts, and its lesson is uncomfortable."

   The first-person search result is fair; "one of the few attempts" is an unbounded literature claim. It is **unverifiable from the files given**. A documented search protocol or a review of vendor and third-party evaluations would settle it.

   **Suggested rewrite:** "I found no injection evaluation in the vendor material or independent tests reviewed for this post. My probe run adds one small data point."

8. **The Norwegian result supports calibration on one task, not general usability.**

   > "Noul probabilities are usable."

   The supplied evidence shows directionally sensible bins over 192 judgments in one document task and low ECE on this small harness. It does not establish deployment-grade calibration across workloads.

   **Suggested rewrite:** "Those two tests make Noul probabilities promising enough to calibrate on a target workload."

9. **The time-to-build claim is not evidenced.**

   > "The whole measurement cost less than one cent, and it took an afternoon because the harness already existed and only needed a new backend."

   The $0.0088 spend supports "less than one cent." The supplied files do not record elapsed authoring time, so "an afternoon" is **unverifiable from the files given**. A work log or timestamped commit sequence would settle it.

   **Suggested rewrite:** "The measured API spend for the exercise was $0.0088, and the existing harness needed only a new backend."

10. **The opening date will age badly.**

    > "Last week a startup called TypeSafe published a model on OpenRouter with a description that read like a joke aimed at me."

    The siblings anchor openings to dates or completed work. "Last week" becomes wrong in archives and weakens an otherwise concrete opening.

    **Suggested rewrite:** "In September 2026, TypeSafe put Jev on OpenRouter with a description that read like a joke aimed at me."

# Numbers audit

| Location and figure | Post value | Evidence value | Match? |
|---|---:|---:|---|
| Front matter publication date | 2026-09-18 | Research note and runs dated 2026-09-18 | Match |
| Subtitle, caption, results: accuracy deficit | 6 to 14 points | Versus Haiku: 10.0 and 14.3 points; versus Luna: Jev loses 5.0 and wins 7.2 | **Mismatch** |
| Description/results: incident accuracy | Jev 70%, Haiku 80% | 70.0%, 80.0% | Match |
| Results: trace accuracy | Jev 64.3%, Haiku 78.6% | 64.3%, 78.6% | Match |
| Decision primitives | 3 | Noul, Choice, Score | Match |
| Example/fan-out question count | 20 | 20-question fan-out test | Match |
| Self-check | 100% on 34 cases | 20 incident + 14 trace; both self-checks 100% | Match |
| Compared backends | 3 | Jev, Haiku 4.5, GPT-5.6 Luna | Match |
| Jev version | 1.13 | Alias resolved to `typesafe/jev-1.13-20260917` | Match |
| Jev direct mean latency | 0.29 s, 0.28 s | 0.291 s incidents, 0.276 s traces | Match, rounded |
| Haiku mean latency | 2.03 s, 2.08 s | 2.033 s incidents, 2.081 s traces | Match, rounded |
| Speed ratio in prose | about 7x | 6.99x and 7.54x | Match as approximation |
| Speed ratio in rendered SVG | 4.4x to 5.3x | Corrected result 7.0x to 7.5x | **Mismatch** |
| Full-run Jev cost | $0.00208 | $0.001272 + $0.000810 = $0.002082 | Match, rounded |
| Full-run Haiku cost | $0.09765 | $0.059463 + $0.038189 = $0.097652 | Match, rounded |
| Cost ratio versus Haiku | 47x cheaper | 46.90x | Match, rounded |
| Route repetitions | 2 routes | Direct and OpenRouter | Match |
| Cross-route composed decisions | 34 identical | 34 of 34 identical | Match |
| Cross-route misses | 11 identical misses | 6 incident + 5 trace | Match |
| Incident Choice/Score confidence, top bin | 0.95-1.00 at 26.7% | OpenRouter: 15 answers at 26.7%; direct: 15 at 33.3% | Match only for gateway route |
| Incident confidence, 0.70-0.85 bin | 14.3% | OpenRouter: 7 answers at 14.3%; direct: 6 at 16.7% | Match only for gateway route |
| Trace Choice/Score top bin | 85.7% | 7 answers at 85.7% on both routes | Match |
| Rounded confidence comparison | 27% vs 86% | 26.7% vs 85.7% | Match, rounded |
| Example gate threshold | 0.9 | Hypothetical; no 0.9 gate was evaluated | Not an evidence result |
| `process_reputation` accuracy | Jev 40%, Haiku 35% | 40.0%, 35.0% | Match; task description is wrong |
| Jev documentation version | 1.13 | Jaggedness page is for 1.13 | Match |
| Fan-out cost | $0.000031 for 20 questions | $0.000031 | Match |
| Million-question cost | "a dollar and a half" | About $1.55 by multiplication; $1.56 in note | **Mismatch by rounding** |
| Incident misses | 6, all over-escalations | 6 of 20, all over-escalations | Match |
| Trace misses | 5: 4 over, 1 under | 5 of 14: 4 over, 1 under | Match |
| Under-escalation frequency | 1 in 14 | 1 of 14 trace cases | Match |
| Adversarial probes per workflow | 8 | 8 probe types, 16 executions per workflow | **Mismatch/ambiguous unit** |
| Jev adversarial flips | 1 incident, 4 trace | 1 of 16, 4 of 16 | Match |
| Haiku adversarial flips | 0 incident, 4 trace | 0 of 16, 4 of 16 | Match |
| Dataset size in limits section | 34 | 34 | Match |
| Approximate run-noise claim | under about 7 points | One trace repeat set spans 7.1 points; no general bound | Partial, scope overstated |
| Jev error rate | 30% | Incidents: 30.0%; all cases: 11/34 = 32.4% | **Mismatch in unqualified sentence** |
| Vendor reference models | 2 | GPT-6 Astra and Fable 5.1 | Match |
| Poker evaluation | 30 spots, 63% overall | Same figures in verified synthesis | Match, but unit conflicts with next denominator |
| Poker contested subset | 55 spots, 33-44%; rules 24-29% | Same figures in synthesis; no unit reconciliation | Unverifiable at unit level |
| Coding-gate midpoint | 0.5 | Symmetric bands around 0.5 | Match |
| Coding-gate thresholds | 0.97 to 0.99 | 0.97 to 0.99 | Match |
| Coding-gate violation cutoffs | p <= 0.03 to p <= 0.01 | Same | Match |
| Exfiltration score | 0.02 | 0.02 | Match |
| Norwegian documents | 24 | 24 | Match |
| Norwegian wrong-label probability | 0.62 | 0.62 | Match |
| Norwegian cost comparison | roughly 6x | $1.31 / $0.22 = 5.95x | Match numerically; "six times less" is poor wording |
| Norwegian Noul judgments | 192 | 192 | Match |
| Norwegian calibration endpoints | 0% lowest, 98% highest | 0% and 98% | Match |
| Independent tester cost range | 5x to 27x | Same in agent-compiled note only | Matches note; not independently verified |
| Vendor cost headline | 444x | 444.6x | Match, rounded |
| Conflicting vendor accuracy reports | 67.8%, 76.0% | 67.8% absent; 76.0% is Customer Service workflow score | **Mismatch/unverifiable** |
| Measurement spend | less than 1 cent | $0.0088 = 0.88 cent | Match |
| Final rules | 3 | Three rules follow | Match as a count |
| Conclusion price ratio | one third | One forty-seventh versus Haiku; about one twelfth versus Luna | **Mismatch** |
| Future full-run experiment cost | one fifth of a cent | Jev full run $0.002082 = 0.2082 cent | Match, rounded |
| Figure accuracy bars | 70.0, 64.3, 80.0, 78.6, 75.0, 57.1% | Same in reports | Match |
| Figure cost bars | $0.0021, $0.0977, $0.0259 | $0.002082, $0.097652, $0.0259 | Match, rounded |

# Tone diff

The explanatory sections from "What it actually does" through "What this does not prove" mostly match the siblings: dense paragraphs, concrete mechanisms, and practical security consequences. The drift is concentrated in listicle framing, unsupported quantitative compression, and a mechanically polished ending.

1. **Listicle packaging replaces the siblings' argument-led headings.**

   > "## Four things the numbers told me"

   The sibling posts name the technical claim in the heading, such as "The evaluator needs a threat model too" and "Persistence beats probabilistic defenses." This heading announces a count instead of an argument.

   **Suggested rewrite:** "## Where the decision layer failed"

2. **The teaser pair is generic and withholds the actual point.**

   > "Both of those claims are real. Neither one is the interesting part on its own."

   The siblings usually turn evidence directly into an engineering claim. This pair is a polished transition that could appear in almost any benchmark essay.

   **Suggested rewrite:** "Speed and cost matter only after the errors are separated by workflow and failure direction."

3. **The conclusion becomes three isolated maxims, against the house preference for compact 2-to-5-sentence paragraphs.**

   > "Never gate a security decision on a model's self-reported confidence. Measure whether the confidence orders accuracy on your own data, per workflow, before you let it route anything."

   The next two one-sentence paragraphs use the same imperative shape. Together they read like slide copy rather than the dense, connected prose in the siblings.

   **Suggested rewrite:** "I would keep confidence out of the gate until it has been shown to order accuracy on the team's own data. I would also move lookup questions into code and retain a deterministic floor under every composed decision."

4. **The ending uses a conspicuous rule-of-three recap, contrary to the author's stated hard rule.**

   > "A poker player found it losing to a one-line rule. A Norwegian engineer found it useful and unsure in the right places. A developer gating shell commands found the threshold arithmetic, not the model, was the hazard."

   Three same-length sentences with the same subject-verb frame are the clearest machine-written tell in the piece. They compress unlike studies into a tidy rhetorical pattern and repeat the immediately preceding section instead of sharpening the conclusion.

   **Suggested rewrite:** "The independent tests reinforce the narrower lesson: measure against a trusted answer key, then inspect the threshold arithmetic and failure direction before the model reaches a gate."

5. **Antithesis is a repeated engine, not a single deliberate construction.**

   > "I think the model choice was never the real decision. The real decision was whether the team owns a harness that can answer \"can this model be trusted with our queue\" before someone signs a contract."

   Other instances include "The difference ... is not the format," "Both ... Neither," "enough ... nowhere near enough," "cannot ... but," "not from the model ... from deterministic facts," and "That floor, not the model." The gate counts only one formal antithesis, but editorially the pattern recurs far beyond the author's one-construction limit.

   **Suggested rewrite:** "The actionable result is the harness: it lets the team test whether a model can be trusted with its queue before procurement signs a contract."

6. **The last line turns a bounded evaluation into hype.**

   > "The harness is already built, and at a fifth of a cent per experiment, there is no longer any reason not to ask."

   The siblings end on a control or threat-model claim. "No longer any reason not to ask" erases non-cost constraints the post itself names, including label quality, version drift, data handling, and review time.

   **Suggested rewrite:** "The next model version can now be retested for about a fifth of a cent in API cost; maintaining the labels and interpreting the failures remain the expensive parts."

7. **The external-claims paragraph drops the sibling posts' inline primary-source discipline.**

   > "Independent testers who bought their own calls report cost advantages in the range of 5 to 27 times, against the vendor's headline of 444 times, so the economics are real while the multiples are not."

   The sibling posts place a primary link immediately beside consequential figures. Here only the vendor headline is linked; the 5x to 27x range has no source and comes from an agent-compiled note.

   **Suggested rewrite:** "My measured comparison was 47x against Haiku 4.5; TypeSafe's own four-workflow headline is 444.6x." Add primary links for any independent range retained.

The first paragraph is an adequate hook because the product constraint is unusual, but the reason to keep reading arrives in paragraph two. Moving the measured trade into the first paragraph would make it closer to the siblings' event-first openings without adding hype. The overall section order is otherwise right for a new reader: mechanism, harness, results, failure analysis, limits, external evidence, decision. "What other people found" is too long relative to the author's own evidence and should remain only if every external denominator is sourced.

# The weakest sentence

> "It is also less accurate than a general model at a third of the price per run, which makes it a serious option for bulk classification and a bad one for anything a human is not checking."

This is the weakest sentence because it combines the post's clearest factual error with its least supported recommendation. The measured price is one forty-seventh of Haiku's, not one third, and 34 synthetic cases do not establish suitability for bulk classification. It appears in the conclusion, so it is likely to be quoted as the takeaway and used to discredit the rest of the measurement.

**Suggested rewrite:** "It was less accurate than Haiku 4.5 on both workflows while costing about one forty-seventh as much for the full run. That is enough to justify a larger workload-specific evaluation, not unattended use."

# Author gate raw output

```text
words 2516 | sentences 130 | paragraphs 44 | cadence [4, 3, 1, 3, 4, 1, 1, 4, 1, 5, 4, 3, 2, 3, 1, 3, 4, 3, 2, 1, 8, 6, 4, 5, 4, 1, 4, 2, 1, 1, 7, 7, 6, 6, 3, 1, 3, 1, 2, 2, 2, 3, 5, 2]
first person 36 | hedges 2 | numbers 74 | antithesis 1 | sentence stdev 10.5


PASS: no blocking tells
Reminder: PASS means no known tells, not that any detector will judge it human.
```
