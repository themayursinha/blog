---
layout: post
title: "The Unverified Context Document"
subtitle: "A public harness writes down what the code should guarantee before it hunts, then trusts that document across five rounds without checking it. Repeating the hunt nearly doubled recall, from 16.85 percent to 32.6 percent. The unchecked document is the part nobody is measuring."
date: 2026-09-21
categories: [ai, security, architecture]
tags: [ai, security, agents, code-review, invariants, evaluation, agentic-ai, benchmark-validity]
description: "An AI bug-hunting harness generates a written model of what the code should guarantee, then trusts that model across five hunting rounds without ever re-deriving or reviewing it. Repeating the hunt nearly doubled recall, from 16.85 percent to 32.6 percent. The generated intent document is the one artifact upstream of every round that nothing checks, and its errors point at a failure mode that produces no artifact at all."
share-img: /img/unverified-context-document.svg
related_posts:
  - "Hacking the Auditor"
  - "AI Safety Without AI Security Is Not Safety"
  - "Spec Engineering: The Missing Layer in AI Agent Security"
---

A public bug-hunting harness reads Solidity and reports vulnerabilities. Its most useful line is not in either of its prompts. It is one bullet in the harness's own limitations list: the context document is trusted, not checked.

That document is generated before the hunt. A separate model pass reads the codebase and writes down what each contract is supposed to guarantee: its role, who calls it, what trust level each actor has, and the invariants that have to hold. The document then goes into the hunting call alongside the code.

I pulled the [repository](https://github.com/asendz/ai-web3-security-course), read the harness source, opened one of the published run files, and read the [answer key](https://github.com/asendz/ai-web3-security-course/blob/master/target/GROUND_TRUTH.md) the runs are scored against. The numbers are published rather than asserted, and the limitations section names its own weak points, including the one above.

## The pattern, in code

Two moves separate this harness from a single prompt.

The first is the intent document. `build_context` is one function and one model call, with no schema to validate against. Its system prompt is explicit that this pass is not a hunt: "Describe intended behavior only, as the code defines it. Do not speculate about what might go wrong." The output is prose, meant to be read rather than parsed, and the prompt asks for one section per contract covering role, actors, invariants, and dependencies.

The second is repetition. `find_bugs_loop` runs the same context-aware prompt five times, and from the second round it appends a title-and-description summary of everything earlier rounds reported, with an instruction not to repeat it: "Do not report any of them again, even rephrased or with a different title. Look at contracts, functions, and guarantees not yet covered by this list."

The document goes into the same single call as the code, not into a separate pass per invariant. The work instruction inside that call asks the model to take each invariant in turn and consider whether any path through the code breaks it.

{% include figure.html src="/img/unverified-context-document.svg" label="Fig. 1 · One document, five rounds, no check" caption="The analyst pass produces a prose intent model in a single call with no schema. The five hunting rounds each treat it as ground truth, and nothing in the pipeline ever re-derives it, diffs it against the code, or reviews it. Recall rose from 16.85 percent for a single context-aware pass to 32.6 percent for the loop. The document itself is never verified, and an error in it points at a failure that produces no artifact at all." alt="Pipeline diagram of a bug-hunting harness: codebase into a single analyst pass that produces a prose intent model marked unverified, then five hunting rounds that each trust that document, producing findings. A side panel shows measured recall rising from 16.85 percent for a single context-aware pass to 32.6 percent for the five-round loop, and a second panel lists what was never checked: the intent model is never re-derived, never diffed against the code, and inherited silently by all five rounds." %}

The prompt work around those two moves is where the value is. The analyst pass is forbidden from hunting, so that it produces a model of intent to reason from rather than a list of suspicions. The change to the hunt is in how the model is told to work: it reasons about invariants rather than per contract, which turns a vague task into a falsifiable question. Every finding has to carry a location, the flawed logic, the impact, and ordered exploit steps, validated against a schema, which is what makes the output triageable by a human. The published run matches that description.

## What the numbers did

The runs use `openai/gpt-5.6-luna` at temperature 0.3 with reasoning effort set high, against one Solidity target. A single context-aware pass averaged 16.85 percent recall per run, and that pass already includes the generated intent document. Adding the document alone raised recall modestly. What nearly doubled it was the loop: context plus five exclusion rounds averaged 32.6 percent across five sequences, ranging from 28.3 to 37.0.

The answer key holds 23 issues, three High and twenty Medium. Scoring gives full credit when a finding names the same defect and would fix it, half credit when the root cause matches but the fix is narrower, different, or missing, or when the reported severity is two or more levels off, and nothing otherwise. That is why a sequence touching ten issues scores 8.5 of 23 rather than 10.

The most useful thing in the published data is the trajectory of two specific findings, both High. H-01 is a listing-order problem: `stepsClaimed` in the vesting manager is shared state inherited across listings, so the order in which allocations are listed changes what a buyer can claim. H-02 is that same state carried across sales, which lets a new buyer unlock tokens early. Across four cold runs with no context at all, both were missed every time. With the intent document added, they appeared in two of the four runs. With the document and the loop together, they landed as exact matches in all five sequences. The document is where they first appear. Repetition is what makes them reliable.

## The document nobody checks

Nothing in the pipeline validates the intent document. It is generated once, never re-derived, never diffed against the source it describes, and never reviewed by anything, and it sits upstream of every round. Each round is asked to work through the guarantees not yet covered, and those guarantees are the ones the document wrote down.

The honest counter-argument is in the prompt itself. The hunter also receives the complete codebase on every call, and it is instructed to walk every contract and every state-changing function before finalising an answer. So this is a risk the architecture creates rather than an effect anyone has measured, and it is worth being precise about which failure it points at.

A false finding puts an artifact in front of a reviewer, who has to spend time adjudicating it. That is a real cost, and the harness's own numbers show it: a confident, well-formatted finding with no bug behind it recurred. An error in the intent document produces no artifact at all. A guarantee that was omitted, or written down more weakly than the code requires, removes a question instead of adding one, so nothing arrives for anyone to adjudicate. That asymmetry is a property of the architecture rather than a result this experiment produced, and it is why the document deserves more scrutiny than it currently gets.

## Repetition is not verification

Five rounds is one hunter looking five times, and the write-up says so directly: a blind spot this lens has stays its blind spot round after round. The loop buys coverage of the ground the hunter already knows how to walk. It cannot buy coverage of ground the hunter never noticed.

The exclusion instruction is worth watching too, for a reason that is a hypothesis rather than a finding. "Do not report any of them again, even rephrased" is a novelty instruction, and novelty instructions tend to reward surface variation. The pressure it creates points toward findings that look new rather than findings that are true. Nothing in the published runs isolates that effect, so I am flagging it as a risk in the design rather than a measured outcome. The same limit applies to any judge added downstream: a judge that only sees the findings which were surfaced cannot recover one that never was, however good it is at grading the ones it can see.

## What I would do instead

Four changes are worth making. They are not all cheap, and the third is real engineering.

**Derive the intent model twice and diff it.** Two independent passes over the same code, from different framings, then look at where the invariant lists disagree. That is the same trick as the loop, applied to the artifact the loop trusts, and the disagreements are the interesting output rather than the consensus. The cost is one more large call.

**Make the document cite its source.** Every invariant should carry the file and line it was derived from. An uncited invariant is hard to audit, and an uncited invariant list is a set of instructions the model gave itself. This one is cheap, and it makes the first one easier.

**Make the invariants executable.** A written guarantee gets checked by reading it again, which is what the pipeline already does. The Solidity tooling for the other approach exists: a [Foundry](https://getfoundry.sh/) property test, a stateful fuzz campaign in [Echidna](https://github.com/crytic/echidna), or an invariant run in [Medusa](https://github.com/crytic/medusa) checks a guarantee by execution instead of by re-reading. This is the expensive option, because the property has to be written correctly before it can catch anything, and a property that encodes the wrong intent is its own kind of unverified context.

**Keep a human-owned artifact as the authority.** In an engagement, the source of intent is the specification and the threat model that the client owns, not a model's summary of the code. The generated document is a reading aid. It is not the standard you measure coverage against.

## What this does not prove

Three limits, starting with mine. I read the source, one published run file, and the answer key. I did not run the harness. I read one of the five loop sequences rather than all five; the four context-only runs are reported as totals rather than as files; and the four cold runs are named in the repository and I did not read those either. Everything below is therefore the write-up's numbers, reported rather than recomputed.

The second is the answer key, and it is the limit I would want a reader to hold on to. The target is SecondSwap, a real vested-token marketplace that ran as a public [Code4rena audit contest](https://github.com/code-423n4/2024-12-secondswap). The answer key in the repository is derived from that contest's [published findings report](https://code4rena.com/reports/2024-12-secondswap), adopting its identifier scheme and its three High and twenty Medium split, with the root-cause lines rewritten as one-liners. The report has been public since February 2025, which means recall against this key cannot separate reasoning from the code from recall of a published report, and nothing in the experiment controls for that. Two findings that no cold run surfaced start appearing as soon as a written model of the protocol is added, and both explanations fit: the model of the protocol supplied the frame the cold pass lacked, or the added detail made the published finding retrievable. I am not claiming the second happened. I am claiming the evaluation cannot rule it out, and that is enough to make these recall figures a direction of travel rather than a measurement of capability. Score against a private codebase, or one whose findings were disclosed after the model's training cutoff, and the question goes away.

The third is the size of the key. Twenty-three issues is small. One exact match is worth about 4.35 points of recall and a partial match half that, so the distance between a 28 percent sequence and a 37 percent sequence is two full-credit findings either way. That is my arithmetic from the key's size, not a figure from the write-up.

## What I would tell a team

The useful part of this design is the shape, and I would take the shape. Write the intent down before hunting, forbid the analyst pass from hunting, anchor the hunt to invariants, and require evidence for every finding. Those four moves are worth adopting this week.

Then check the document, and check what you are scoring against. A coverage claim needs both halves: the intent model has to be complete, and the search has to be good enough to detect a violation of it. Neither substitutes for the other, and a complete intent model with a weak hunter is as misleading as a strong hunter pointed at the wrong guarantees. In my experience the coverage claim is the deliverable, and it is the one most likely to be repeated in a procurement deck with neither half measured.

Both problems are solvable, and neither is solved by another round of the same pass.
