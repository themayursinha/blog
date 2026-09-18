TypeSafe's Jev cannot write a sentence.

It returns a probability over a fixed set of options. There is no text decoder in the model. Ask it for a security decision and you get back a decided answer with a confidence number, never a paragraph.

I ran 34 security cases through it, plus four chat models through TypeSafe's own adapter.

The results changed how I read every model benchmark post I see.

The cost story is real. Jev came back 47x cheaper than Claude Haiku 4.5 for the full 34-case run, and 438x cheaper than Claude Opus 5, at 0.29 seconds per decision against Opus 5's 10.81.

The accuracy story is not. Jev landed 23 of the 34 decisions against Haiku's 27, two behind on each of the two workflows. Terra landed 18 of 20 on incidents and 8 of 14 on traces. Opus 5, at 438 times the price, landed 15 of 20 and 10 of 14.

Five models spanning a 438x range in what one run costs, and not one pairwise difference against Jev is significant. This study is underpowered, so that means the difference was not demonstrated, not that the models are equal.

What survives is more interesting. Across 32 adversarial probe executions, Jev produced zero downgrades on a decision. Haiku produced zero. Luna, the cheapest model in the set, produced nine.

The thing holding those decisions in place is not the model's judgement. It is the deterministic floor in the code that composes the model's answers into a final call.

Do not gate on model confidence. TypeSafe's own docs say Jev is calibrated, that higher confidence means higher accuracy, and criticise other models for not saying when they are in the unreliable 5 percent. On my workload that held for yes/no answers and did not hold for choices: the 0.95 to 1.00 bin was right 4 of 15 times on one workflow and 6 of 7 on another. Same model, same number, two workflows, a swing from worse than a coin flip to near perfect.

The question set was my real mistake. One heavily weighted question asked the model to classify a binary's provenance, which is a hash, a signature and an allowlist. Both models failed it. TypeSafe's own docs tell you not to ask the model what code can compute exactly, and I asked anyway.

Three rules I would keep whatever happens to this category of model:

Keep model-reported confidence out of the gate until it orders accuracy on your own workload.
Move every question a lookup table can answer into code.
Keep a deterministic floor under every composed decision.

Full write-up, with the counts, the intervals and the per-case results, is here:

https://themayursinha.com/architecture/2026/09/18/i-tested-a-model-that-refuses-to-write-anything/

Prompts guide. Specs enforce. Boundaries decide.

---

## Short alternative

TypeSafe's Jev cannot write a sentence. It returns a decision, never prose.

I ran 34 security cases through it and four chat models. It was 47x cheaper than Haiku and 438x cheaper than Opus 5.

Accuracy: five models across a 438x price range, and no gap between them survives a significance test.

https://themayursinha.com/architecture/2026/09/18/i-tested-a-model-that-refuses-to-write-anything/
