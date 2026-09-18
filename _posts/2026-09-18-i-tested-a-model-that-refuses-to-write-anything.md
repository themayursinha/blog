---
layout: post
title: "I Tested a Model That Refuses to Write Anything"
subtitle: "It came back 47 times cheaper than Haiku 4.5 and landed 23 of 34 decisions against 27. At this sample size nothing about accuracy separates any of the five models, so what is left to act on is structural."
date: 2026-09-18
categories: [ai, security, architecture]
tags: [ai, security, agents, detection-engineering, evaluation, calibration]
description: "A decision-native model cost 47 times less than Claude Haiku 4.5 and landed 23 of 34 decisions against Haiku's 27, which is two behind on each of the two workflows. Five models spanning a 438x range in run cost sat inside the same noise band. What is left worth acting on is the structure: which questions a model should never be asked, and why a confidence threshold is not a safety control."
share-img: /img/decision-model-tradeoff.svg
related_posts:
  - "AI Safety Without AI Security Is Not Safety"
  - "Your System Prompt Is a God Class"
  - "The Coding Agent Is Untrusted"
---

In September 2026, TypeSafe put a model on OpenRouter with a description that read like a joke aimed at me. [Jev](https://openrouter.ai/~typesafe/jev-latest) does not generate text. You hand it your application's state and a typed question, and it hands back a typed decision with a probability attached. You skip the JSON prompt entirely, and nothing needs validating against a schema.

I have spent a lot of this year arguing that security decisions belong in deterministic code and not in a model's judgement. So a model that returns a probability instead of a paragraph should have been the version of this technology I could actually live with. I built a small harness, ran it against real hosted Jev on 34 security cases, and got a result that resists the headline I wanted to write. Jev answered in about a quarter of a second for one forty-seventh of the cost of Claude Haiku 4.5, a small cheap model, and it landed 23 of the 34 decisions against Haiku's 27.

## What it actually does

A request carries three things. The `state` holds whatever text or structured data the decision depends on, such as an alert payload or an agent's tool-call trace. You then name a map of typed `questions` yourself, and pass the model name alongside them.

Each question is one of three types. A [`noul`](https://docs.typesafe.ai/primitives) question is a yes or no, and the answer is the probability that the answer is yes. A `choice` question picks one option from a set you define, and returns the winning option plus the full distribution across every option. A `score` question places the state on an ordered rubric and returns a probability-weighted position.

One real question from the harness, trimmed down to a single question.

```json
{
  "questions": {
    "process_reputation": {
      "type": "choice",
      "instructions": "How trustworthy is the executing binary `alert.process.path`?",
      "criteria": {
        "system_binary": "Ships with the operating system from an expected location",
        "signed_vendor": "Signed by a known commercial vendor and expected in this estate",
        "signed_third_party": "Signed, but by a publisher not previously seen in this estate",
        "unsigned": "Unsigned, or a signature that cannot be verified",
        "known_malware": "A name, hash, or signature that is recognised as malicious tooling",
        "unknown": "Not enough information in the alert to judge provenance"
      }
    }
  }
}
```

The difference from prompting an LLM for JSON is smaller than it looks, and it is worth being precise here because the obvious objection is correct. Modern APIs can constrain a chat model to a schema, so guaranteed shape is not the distinctive part. What is distinctive is that inference itself is decision-native, that the answer arrives as a distribution over the options rather than as a sampled token, that every question evaluates in parallel against one state, and that there is no text-generation path for a fluent wrong answer to travel down. A later measurement put 20 questions about one alert into a single request for $0.000031, which is where this design starts to change what you are willing to ask.

## How I tested it

The harness runs two workflows, both taken from work I actually care about. The first is security incident triage. Given an alert and the asset it fired on, decide whether to close it, send it to an analyst, or contain immediately. The second is agent trace review. Given a record of what an autonomous agent did with its tools, decide how urgently a human needs to look.

Both workflows work the same way. Deterministic code computes the facts it can compute reliably, such as whether a process executed, which asset it ran on, and what the change ticket says. The model answers the questions that genuinely need judgement. Then code composes those answers into a decision using explicit rules and thresholds.

Before scoring any model, the harness checks itself: feed it the ideal answers and it must reproduce every human label. It does, at 100 percent across all 34 cases, which shows that the composition rules reproduce every label from the supplied ideal answers. A low model score is therefore not explained by those rules alone, though that check says nothing about the labels themselves, the prompt construction, or the parsing.

I ran five backends against the same 34 cases. Four were general chat models behind the same interface, so the comparison is not confused by the workflow. Claude Haiku 4.5 is Anthropic's small fast tier. GPT-5.6 Luna is the cheapest model here, at $0.20 per million input tokens. GPT-5.6 Terra is a mid-tier reasoning model at $2 and $12, and TypeSafe's own launch post names Terra as the model closest to Jev in intelligence on System One tasks, which makes it the fairest peer in the set. Claude Opus 5 is the high tier at $5 and $25, and I added it last as the frontier comparator. Together the five span a 438 fold range in what one full run costs.

The interface deserves one paragraph of disclosure, because it is where a comparison like this usually leaks. Every model received the same `state` and the same typed questions, through TypeSafe's own `system-one-adapter`, which prompts a chat model to return structured decisions and normalises the reply. So the chat models were not free to answer outside the option set; the adapter constrained them, and it also absorbed the parse tax. A reply that failed to parse would have been recorded as an error rather than as a wrong decision, and no such failures occurred on these runs. What the adapter cannot do is make a chat model produce a probability distribution it does not have, which is why the LLM numbers here are best read as the accuracy ceiling a prompt can reach rather than as the same object Jev returns.

{% include figure.html src="/img/decision-model-tradeoff.svg" label="Fig. 1 · Accuracy against cost" caption="Composed decision accuracy on 34 security cases as raw counts, with the cost of one full pass over each workflow. Jev landed 14 of 20 and 9 of 14 decisions. Haiku landed 16 of 20 and 11 of 14. Terra landed 18 of 20 and 8 of 14, and Opus 5, at 438 times Jev's cost, landed 15 of 20 and 10 of 14. At these counts one case is 5 points on incidents and 7.1 on traces, so every interval overlaps and no pairwise difference is significant." alt="Grouped bar chart of composed decision accuracy as counts for Jev 1.13, Claude Haiku 4.5, GPT-5.6 Luna, GPT-5.6 Terra and Claude Opus 5, with cost per workflow run shown separately" %}

## The numbers

Real Jev landed 14 of 20 incident decisions and 9 of 14 trace decisions. Haiku 4.5 landed 16 of 20 and 11 of 14. Luna landed 15 of 20 and 8 of 14. Terra landed 18 of 20 and 8 of 14. Opus 5, the most expensive model here at $5 and $25 per million tokens, landed 15 of 20 and 10 of 14.

Read as counts, the story changes. Jev is **two decisions** behind Haiku on each workflow, which is four across the pooled 34. The 95 percent Wilson intervals are 48.1 to 85.5 percent for Jev against 58.4 to 91.9 for Haiku on incidents, and 38.8 to 83.7 against 52.4 to 92.4 on traces. Those intervals overlap almost completely, and a two-sided Fisher exact test against Jev returns p values from 0.24 to 1.00 across the four comparators.

That last result is weaker than it sounds, and I want to state it properly. **This study is underpowered to detect a difference of the size I originally claimed.** Fisher will fail to reject at 20 and 14 items for almost any plausible gap, so the right reading is that no difference was demonstrated, not that the models are equivalent. Four decisions pooled is what this data can see and it cannot resolve it. A larger labelled set could easily show a real ten point gap in either direction, and the honest summary is that I do not know which way it would fall.

Terra is what settles the reading. It produced the best incident score in the set and the joint worst trace score. Opus 5, at 438 times Jev's cost, beat it by a single decision on each workflow. Luna, the cheapest model here, finished between Jev and Haiku on incidents and below both on traces. There is no ordering that tracks price, or capability tier, or anything else I can defend at 20 and 14 cases. The earlier version of this post claimed a 10 to 14 point gap between Jev and Haiku, and the counts do not support that.

What does survive is the shape of the trade. Jev costs one forty-seventh of Haiku, one ninety-ninth of Terra and one four-hundred-and-thirty-eighth of Opus 5, and answers about 37 times faster than Opus 5 on incidents, and it produced zero downgrades across 32 adversarial probe executions while Luna produced nine. That last number is a sketch rather than a result, 9 of 32 executions is not a ranking, but the direction is worth keeping.

Then the other axis, which is unambiguous. Jev answered in 0.29 and 0.28 seconds on average, against 2.03 and 2.08 seconds for Haiku and 10.81 and 8.68 seconds for Opus 5. So it is about 7 times faster than the cheap model and about 37 times faster than the expensive one, as well as 47 to 438 times cheaper. The full 34-case run cost $0.00208 for Jev against $0.09765 for Haiku and $0.91134 for Opus 5, and none of those are projections from a price page. They are measured, and the gateway's own billed figure matched the arithmetic to the cent.

I ran the whole 34-case set twice, once against TypeSafe's own API and once through an API gateway. Both produced the same 34 composed decisions and the same 11 misses, which rules out a decision-level discrepancy between the two routes in this run. Their underlying probabilities were close but not identical, and both routes billed the same amount for the same tokens.

Speed and cost matter only after the errors are separated by workflow and by failure direction, and that is where this gets interesting.

## Where the decision layer failed

**Choice and score confidence did not order correctness on this workload.** This is the finding that would have burned me in production. Jev reports a confidence value on every choice and score answer, and the docs present it as something an application can threshold. Binned against whether the answer was actually right, the top bin, 0.95 to 1.00, was correct 4 of 15 times on the gateway route and 5 of 15 on the direct route for incidents, while the 0.70 to 0.85 bin managed 1 of 7 and 1 of 6. On agent trace review that same top bin was correct 6 of 7 times.

TypeSafe make the claim directly, so this is a test of a stated property rather than of something I inferred. Their launch post says Jev's confidence is calibrated, "[higher confidence means higher accuracy](https://typesafe.ai/blog/introducing-system-one-models-and-jev)", and it criticises other models on exactly this ground: it argues that a model which can do a task 95 percent of the time without saying when it is in the unreliable 5 percent cannot be used for automation. That is the right standard, and it is the one I measured against.

On my workload the ordering did not hold for Choice and Score answers. The 0.95 to 1.00 bin was right 4 of 15 times on incidents and 6 of 7 on traces. Same model, same confidence value, two workflows, and the top bin swung from worse than a coin flip to near perfect. The claim held for the noul probabilities, at an expected calibration error of 0.05, and it did not hold for the other two answer types, which is the finding worth carrying into a design review.

The counts are small and I am not claiming the metric is broken everywhere. I am claiming it failed the one thing the vendor says it is for, telling you when to trust an answer, on one of two workflows at 15 cases. Until that is shown otherwise on a larger set, a confidence threshold on a Choice or a Score answer is not a safety control. Gate on something you computed.

**One question should never have been in the set.** `process_reputation` asked the model how much a binary could be trusted, choosing from six provenance options that a hash, a signature and an allowlist could have resolved without a model. Jev got 40 percent and Haiku got 35, and I let it carry the heaviest weight in the risk formula. The neighbouring question, whether that binary is expected on this host, scored 100 percent.

The lesson is about the question set rather than about either model. Provenance is a query against data the sensor already holds, so I asked a semantic model to perform a lookup and then weighted its answer most heavily. The vendor's own [failure-mode list](https://docs.typesafe.ai/model-jaggedness/jev-1.13) closes with the instruction to avoid asking the model something code can compute exactly, and this was that mistake. It is also why I would weight the accuracy table above less heavily than its percentages suggest: when one heavy term in the composition is a question no model can answer well, both models fail it and the ranking between them gets noisier. Audit the question set before blaming the weights.

**Cheap changes what you are willing to ask.** Twenty typed questions over one state, in a single request, cost $0.000031, or about $1.56 per million questions. The price scales with the questions you write rather than with the round trips, so decomposition stops being a budget decision. You stop trying to write one clever prompt that does five things badly and start asking twenty narrow questions that code composes properly.

**The misses skewed toward over-escalation, and one did not.** All six of Jev's incident misses were over-escalations, meaning it asked for human attention on cases a human would have closed. On the trace workflow, four of five misses over-escalated and one under-escalated, calling a real problem less urgent than it was. Over-escalation spends analyst time, and under-escalation loses incidents. That single case is 1 of 14, so I would not read the direction as a safety property of the model.

The cross-model comparison is the more useful version of the same observation. Across 32 adversarial probe executions Jev produced zero downgrades. Haiku also produced zero. Luna, the cheapest model in the comparison, produced nine, which is why I keep coming back to the code floor rather than to the weights.

I also ran four adversarial probe types against four base cases in each workflow, so 16 probe executions per workflow, including instructions hidden in tool output telling the model to export a customer table. Jev flipped one decision on incidents and four on traces, every one of them upward. Haiku flipped none on incidents and four on traces. Luna flipped two and seven. In these probes the deterministic code floor prevented every downgrade even when the model's answers moved, which is the part of the design I would defend in a review.

## What this does not prove

The labels are mine, on synthetic cases, 34 of them. A single annotator on synthetic data is enough for a paired smoke test, not for a stable model ranking or for any real-world accuracy claim, and the labels are the hidden variable: the harness proves the composition reproduces my labels, not that my labels are correct. The trace workflow has 14 cases, so one case moves its accuracy by 7.1 points, and in three Haiku repeats that workflow moved by 7.1 points all by itself. Any two-decision difference on sets this size sits inside the interval, which is the reason the accuracy comparison above is written as counts and intervals rather than as a ranking between models.

The endpoint uses a moving alias, so a reproducible evaluation has to record the concrete version returned on every call. These runs resolved to Jev 1.13 on 18 September 2026.

The vendor's own published accuracy is agreement with two other models rather than ground truth, which matters when reading claims of hallucination-free operation. Constrained output prevents free-form fabrication, not confident error: Jev missed 6 of 20 incident decisions and 5 of 14 trace decisions, and the confidence table above is the post's own evidence that a wrong answer can arrive looking certain.

## What other people found

I was not the only person who did this, and the other tests matter because two of them are stronger than mine in ways that change the picture.

### A probability threshold that let an SSH key exfiltration through

This is the single most decision-relevant result I found, and I would put it in front of any security team before any accuracy table. [A developer placed a probability gate in front of a coding agent's shell commands](https://dev.to/jomatsu/jev-pi-a-probability-gate-for-my-coding-agents-shell-commands-95d). Two of his conditions were phrased as absence-of-hazard questions. Each carried a threshold, and because the bands were symmetric around 0.5, raising a threshold from 0.97 to 0.99 narrowed the violation band from p <= 0.03 to p <= 0.01. An SSH key exfiltration command scored 0.02. Tightening the safety setting moved that command out of the rejection band and into the unclear band, where it was allowed to run.

The trap lives in the threshold arithmetic rather than in the model, and it is the class of bug a prompt-engineering comparison will never surface. It is also the strongest argument for the deterministic floor, because no amount of prompt tuning would have caught it.

### The vendor's own failure-mode page

TypeSafe's own documentation publishes the failure modes, and the most useful entry is about asking a model something that code can compute exactly. Their [page on adversarial content](https://docs.typesafe.ai/model-jaggedness/jev-1.13) is blunt. State is data, and `jev-1.13` gives it no hostile default, which means an injected instruction, a misleading framing, or text arguing for its own classification can all move the answer. Their recommended mitigation is to write precise criteria and test the integration thoroughly before deploying. I found no injection evaluation in the vendor material or in the independent tests reviewed for this post, so my four probe types are one small data point on a question nobody has answered.

### A poker solver, and a state that changed the answer

The best piece of independent work I found is [a poker evaluation](https://backnotprop.com/blog/jev-poker/). The author solved one flop with a real solver and ran two tests. On 30 sampled spots, Jev matched the solver's top action 63 percent of the time. In a wider 150-spot sweep, on the 55 spots where the solver does something other than check, his four Jev designs scored 33 to 44 percent against 24 to 29 percent for rules containing no model at all, and he warns that the headline figure is inflated because checking is usually the right answer. His conclusion is the same as mine, that you have to evaluate every situation you want to use this in against an answer key you trust. He also found that the answer changes once the state names the opponent's hand instead of listing the cards, which is my code floor finding in another domain. The model responds to a stated conclusion.

### Norwegian documents, and the calibration that matched mine

A [Norwegian engineer ran 24 out-of-distribution government documents](https://lindfors.no/blog/a-first-look-at-typesafes-jev/) through it in Norwegian, using an English question set. It read them at roughly a sixth of the cost of a frontier model on the same task, and got one stance label wrong while reporting 0.62 for the answer it chose. His calibration table is the one result that lines up exactly with mine. Across 192 yes/no judgments the probabilities moved in the right direction at every level, from 0 percent in the lowest bin to 98 percent in the highest. Taken with my own ECE of 0.05 on noul answers, that makes the probabilities promising enough to calibrate on a real workload, and it says nothing about the confidence number beside a choice.

### The 444x cost claim

My measured cost advantage was 47 times against Haiku 4.5. [TypeSafe advertises 444.6 times](https://typesafe.ai/blog/introducing-system-one-models-and-jev) from its own four-workflow evaluation, which its capabilities team built using reference answers from two other vendors' models. Neither multiple should be transferred to another workload without measuring it there, and I think that holds for my own 47 times too.

## What I would tell a team

The actionable result is the harness. It lets a team test whether a model can be trusted with its own queue before procurement signs a contract, and the whole measurement cost less than one cent because the harness already existed and needed only a new backend.

Three things came out of it that I would hold regardless of which vendor wins this category. I would keep model-reported confidence out of the gate until it has been shown to order accuracy on the team's own data, per workflow. I would move every question a lookup table can answer into code, because the failing question here was the one with a reputation feed sitting next to it. And I would keep a deterministic floor under every composed decision, since that floor is what stopped an injected instruction from quietly downgrading a real incident.

Jev is fast and cheap, and it has a shape I like. Inputs and outputs are both typed, prose never appears, and free-form fabrication has nowhere to go. It also landed two fewer decisions than Haiku 4.5 on each workflow while costing about one forty-seventh as much, and Terra landed four more than Jev on incidents and one fewer on traces at a hundred times the price. That spread across price tiers is the reason I would spend the next dollar on a larger labelled set rather than on a more expensive model.

The other people testing it arrived at the same instruction by different routes, and none of them could have known what they found without building the evaluation first. Measure against an answer key you trust, then inspect the threshold arithmetic and the failure direction before any of this reaches a gate.

The next model version can be retested for about a fifth of a cent in API spend. Maintaining the labels and interpreting the failures remain the expensive parts.
