---
layout: post
title: "I Tested a Model That Refuses to Write Anything"
subtitle: "It came back 47 times cheaper than Haiku 4.5 and 10 to 14 points less accurate on two security workflows. The trade decides where it belongs."
date: 2026-09-18
categories: [ai, security]
tags: [ai, security, agents, detection-engineering, evaluation, calibration]
description: "A decision-native model scored 70 percent on security alert triage against a cheap frontier model's 80 percent, while costing 47 times less. Here is what that trade is actually worth, and the three rules the measurement produced."
share-img: /img/decision-model-tradeoff.svg
related_posts:
  - "AI Safety Without AI Security Is Not Safety"
  - "Your System Prompt Is a God Class"
  - "The Coding Agent Is Untrusted"
---

In September 2026, TypeSafe put a model on OpenRouter with a description that read like a joke aimed at me. [Jev](https://openrouter.ai/~typesafe/jev-latest) does not generate text. You hand it your application's state and a typed question, and it hands back a typed decision with a probability attached. You skip the JSON prompt entirely, and nothing needs validating against a schema.

I have spent a lot of this year arguing that security decisions belong in deterministic code and not in a model's judgement. So a model that returns a probability instead of a paragraph should have been the version of this technology I could actually live with. I built a small harness, ran it against real hosted Jev on 34 security cases, and measured a trade that is easy to state and hard to act on. Jev answered in about a quarter of a second for one forty-seventh of the cost of a cheap frontier model, and it was 10 to 14 points less accurate on the decisions that mattered.

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

The difference from prompting an LLM for JSON is not the format. The format is a detail. The difference is that the model cannot answer with anything outside the options you gave it, and every question is evaluated against the same state in parallel inside one request. A later measurement put 20 questions about one alert into a single request for $0.000031, which is where this design starts to change what you are willing to ask.

## How I tested it

The harness runs two workflows, both taken from work I actually care about. The first is security incident triage. Given an alert and the asset it fired on, decide whether to close it, send it to an analyst, or contain immediately. The second is agent trace review. Given a record of what an autonomous agent did with its tools, decide how urgently a human needs to look.

Both workflows work the same way. Deterministic code computes the facts it can compute reliably, such as whether a process executed, which asset it ran on, and what the change ticket says. The model answers the questions that genuinely need judgement. Then code composes those answers into a decision using explicit rules and thresholds.

Before scoring any model, the harness checks itself: feed it the ideal answers and it must reproduce every human label. It does, at 100 percent across all 34 cases, which shows that the composition rules reproduce every label from the supplied ideal answers. A low model score is therefore not explained by those rules alone, though that check says nothing about the labels themselves, the prompt construction, or the parsing.

I ran three backends against the same 34 cases. Real Jev 1.13, and two frontier models behind the same interface so the comparison is not confused by the workflow.

{% include figure.html src="/img/decision-model-tradeoff.svg" label="Fig. 1 · Accuracy against cost" caption="Composed decision accuracy on 34 security cases, with the cost of one full pass over each workflow. Jev answered in a fraction of a second for a fraction of a cent, and lost 10.0 and 14.3 points of accuracy to Haiku 4.5, the baseline that beat it on both workflows." alt="Paired bar chart comparing composed decision accuracy and cost per workflow run for Jev 1.13, Claude Haiku 4.5 and GPT-5.6 Luna" %}

## The numbers

Real Jev scored 70.0 percent on incident triage and 64.3 percent on agent trace review. The cheap frontier model scored 80.0 percent and 78.6 percent. Against the baseline that beat it on both workflows, Jev is 10.0 points behind on incidents and 14.3 points behind on traces. Against the weaker of the two comparators it loses by 5 points on one workflow and wins by 7 on the other, which on 34 cases is noise rather than a result.

Then the other axis. Jev answered in 0.29 and 0.28 seconds on average, against 2.03 and 2.08 seconds for the model it lost to, so it is about 7 times faster as well as 47 times cheaper. The full 34-case run cost $0.00208 against $0.09765, and that second number is not a projection from a price page. It is measured, and the gateway's own billed figure matched the arithmetic to the cent.

I ran the whole 34-case set twice, once against TypeSafe's own API and once through an API gateway. Both produced the same 34 composed decisions and the same 11 misses, which rules out a decision-level discrepancy between the two routes in this run. Their underlying probabilities were close but not identical, and both routes billed the same amount for the same tokens.

Speed and cost matter only after the errors are separated by workflow and by failure direction, and that is where this gets interesting.

## Where the decision layer failed

**Confidence was a poor gate.** This is the finding that would have burned me in production. Jev reports a confidence value on every choice and score answer. When I binned those values against whether the answer was actually right, the highest confidence bin, 0.95 to 1.00, was correct 26.7 percent of the time on one route and 33.3 percent on the other, while the 0.70 to 0.85 bin sat at 14.3 and 16.7 percent. On agent trace review the same top bin was 85.7 percent accurate. So a 0.95-confident answer was right somewhere between 27 and 86 percent of the time depending on the workflow, which is not a quantity you can route a queue on. The noul probabilities were a different story and behaved sensibly, and the number returned beside a choice or a score is not the same thing.

**The question it failed hardest is one a reputation feed answers.** `process_reputation` asks the model how trustworthy the executing binary is, choosing between a system binary, a signed vendor, a signed third party, an unsigned binary, known malware, and unknown. Jev scored 40 percent on it and Haiku scored 35, and it carries the heaviest weight in the risk formula. The neighbouring question, whether that binary is expected on this host, scored 100 percent. So the failure is specific rather than general, and it lands exactly where a lookup is available: deciding provenance from an alert payload is a job for a hash and a signature check, and neither model could do it. The vendor's own [failure-mode list](https://docs.typesafe.ai/model-jaggedness/jev-1.13) closes with the instruction to avoid asking the model something code can compute exactly, and my 40 percent is what ignoring that costs.

**Cheap changes what you are willing to ask.** Twenty typed questions over one state, in a single request, cost $0.000031, or about $1.56 per million questions. The price scales with the questions you write rather than with the round trips, so decomposition stops being a budget decision. You stop trying to write one clever prompt that does five things badly and start asking twenty narrow questions that code composes properly.

**It fails in the safe direction, mostly.** All six of Jev's incident misses were over-escalations, meaning it asked for human attention on cases a human would have closed. On the trace workflow, four of five misses also over-escalated and one went the other way, calling a real problem less urgent than it was. Over-escalation spends analyst time. Under-escalation loses incidents, and it appeared once in 14 cases, which is the number I would want to drive down before this touches a real queue.

I also ran four adversarial probe types against four base cases in each workflow, so 16 probe executions per workflow, including instructions hidden in tool output telling the model to export a customer table. Jev flipped one decision on incidents and four on traces, every one of them upward. The frontier model flipped none on incidents and four on traces. In these probes the deterministic code floor prevented every downgrade even when the model's answers moved, which is the part of the design I would defend in a review.

## What this does not prove

The labels are mine, on synthetic cases, 34 of them. A single annotator on synthetic data is enough for a paired smoke test, not for a stable model ranking or for any real-world accuracy claim. The runs are single-shot, and in three Haiku repeats on the 14-case trace set accuracy moved by 7.1 points, so differences of that size on a set this small may be run noise.

The endpoint uses a moving alias, so a reproducible evaluation has to record the concrete version returned on every call. These runs resolved to Jev 1.13 on 18 September 2026.

The vendor's own published accuracy is agreement with two other models rather than ground truth, which matters when reading claims of hallucination-free operation. Constrained output prevents free-form fabrication, not confident error: Jev missed 6 of 20 incident decisions and 5 of 14 trace decisions, and the confidence table above is the post's own evidence that a wrong answer can arrive looking certain.

## What other people found

I was not the only person who did this, and the other tests matter because two of them are stronger than mine in ways that change the picture.

TypeSafe's own documentation publishes the failure modes, and the most useful entry is about asking a model something that code can compute exactly. Their [page on adversarial content](https://docs.typesafe.ai/model-jaggedness/jev-1.13) is blunt. State is data, `jev-1.13` does not treat it as hostile by default, and content written to steer the model, whether that is an injected instruction, a misleading framing, or text arguing for its own classification, can move the answer. Their recommended mitigation is to write precise criteria and test the integration thoroughly before deploying. I found no injection evaluation in the vendor material or in the independent tests reviewed for this post, so my four probe types are one small data point on a question nobody has answered.

The best piece of independent work I found is [a poker evaluation](https://backnotprop.com/blog/jev-poker/). The author solved one flop with a real solver and ran two tests. On 30 sampled spots, Jev matched the solver's top action 63 percent of the time. In a wider 150-spot sweep, on the 55 spots where the solver does something other than check, his four Jev designs scored 33 to 44 percent against 24 to 29 percent for rules containing no model at all, and he warns that the headline figure is inflated because checking is usually the right answer. His conclusion is the same as mine, that you have to evaluate every situation you want to use this in against an answer key you trust. He also found that the answer changes once the state names the opponent's hand instead of listing the cards, which is my code floor finding in another domain. The model responds to a stated conclusion.

The single most decision-relevant result, and the one I would put in front of any security team, comes from [a developer who placed a probability gate in front of a coding agent's shell commands](https://dev.to/jomatsu/jev-pi-a-probability-gate-for-my-coding-agents-shell-commands-95d). Two of his conditions were phrased as absence-of-hazard questions. Each carried a threshold, and because the bands were symmetric around 0.5, raising a threshold from 0.97 to 0.99 narrowed the violation band from p <= 0.03 to p <= 0.01. An SSH key exfiltration command scored 0.02. Tightening the safety setting moved that command out of the rejection band and into the unclear band, where it was allowed to run. The trap lives in the threshold arithmetic rather than in the model, and that is the class of bug a prompt-engineering comparison will never surface.

A [Norwegian engineer ran 24 out-of-distribution government documents](https://lindfors.no/blog/a-first-look-at-typesafes-jev/) through it in Norwegian, using an English question set. It read them at roughly a sixth of the cost of a frontier model on the same task, and got one stance label wrong while reporting 0.62 for the answer it chose. His calibration table is the one result that lines up exactly with mine. Across 192 yes/no judgments the probabilities moved in the right direction at every level, from 0 percent in the lowest bin to 98 percent in the highest. Taken with my own ECE of 0.05 on noul answers, that makes the probabilities promising enough to calibrate on a real workload, and it says nothing about the confidence number beside a choice.

My measured cost advantage was 47 times against Haiku 4.5. [TypeSafe advertises 444.6 times](https://typesafe.ai/blog/introducing-system-one-models-and-jev) from its own four-workflow evaluation, which its capabilities team built using reference answers from two other vendors' models. Neither multiple should be transferred to another workload without measuring it there, and I think that holds for my own 47 times too.

## What I would tell a team

The actionable result is the harness. It lets a team test whether a model can be trusted with its own queue before procurement signs a contract, and the whole measurement cost less than one cent because the harness already existed and needed only a new backend.

Three things came out of it that I would hold regardless of which vendor wins this category. I would keep model-reported confidence out of the gate until it has been shown to order accuracy on the team's own data, per workflow. I would move every question a lookup table can answer into code, because the failing question here was the one with a reputation feed sitting next to it. And I would keep a deterministic floor under every composed decision, since that floor is what stopped an injected instruction from quietly downgrading a real incident.

Jev is fast and cheap, and it has a shape I like. Inputs and outputs are both typed, prose never appears, and free-form fabrication has nowhere to go. It was also less accurate than Haiku 4.5 on both workflows while costing about one forty-seventh as much for the full 34-case run, which is enough to justify a larger workload-specific evaluation and not enough to justify unattended use.

The other people testing it arrived at the same instruction by different routes, and none of them could have known what they found without building the evaluation first. Measure against an answer key you trust, then inspect the threshold arithmetic and the failure direction before any of this reaches a gate.

The next model version can be retested for about a fifth of a cent in API spend. Maintaining the labels and interpreting the failures remain the expensive parts.
