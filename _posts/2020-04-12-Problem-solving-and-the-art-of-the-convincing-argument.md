---
layout: post
title: "The Art of the Convincing Argument"
date: 2020-04-12
categories: [engineering, mathematics]
tags: [mathematics, problem-solving, modeling, engineering]
description: "Mathematical modelling is not about equations. It is about choosing which details to keep, which to discard, and being honest about what you left out."
share-img: /img/circuit.svg
mathjax: true
subtitle: "Why the most important part of mathematical modelling is not the equation you solve, but the assumptions you declare before you solve it."
---

Every engineer learns to solve equations. What separates useful solutions from mathematical theatre is not the solving technique. It is what happens before the first variable is written down.

Mathematics solves problems by building models. A model is a deliberate simplification: keep the features that matter, document the ones you discarded, and justify why the discarded ones don't change the answer. The same instinct that makes an engineer ignore air resistance when calculating how far a ball rolls is the instinct that keeps security models from collapsing under their own complexity. If your model includes everything, it includes nothing useful.

## The modelling instinct

Consider a trivial example. Three people sit in a room. Two more join them. How many people are in the room?

The answer is five — but only under assumptions so obvious we rarely state them. Nobody left. Nobody else entered. The building did not collapse. The room still exists. These assumptions are invisible because they are universally shared between the problem poser and the solver.

The moment a problem becomes interesting, the assumptions cease to be invisible. This is where most modelling efforts fail. Not at the equation-solving stage. At the assumption-declaration stage.

## The circuit that teaches everything

Take a concrete problem. Three resistors are connected in series. Two are known: 3 Ω and 4 Ω. The voltage source is a 12 V battery, and the measured current is 1 A. What is the resistance of the third resistor?

The first useful thing to do is draw it.

{% include figure.html src="/img/circuit.svg" label="Fig. 1 · Series Circuit" caption="Three resistors in series with a 12 V battery — the problem expressed as a circuit diagram. The diagram forces you to be explicit about what is connected to what." alt="Series circuit diagram" %}

From the diagram, Ohm's law and the series resistance rule give us the mathematical form immediately. If *x* is the unknown resistance and *R = R₁ + R₂ + R₃*, then *V = RI* becomes:

$$
12 = (3 + 4 + x) \times 1
$$

This is a single-variable linear equation. The solving is trivial. The modelling is where everything interesting lives.

Look at what we assumed to get here. Pure resistors with no capacitance or inductance. Constant resistance unaffected by temperature. A battery that holds 12 V without sagging and introduces no internal resistance of its own. The real world violates every one of these assumptions. A physical resistor shows inductive behaviour at high frequencies. Resistance drifts with temperature as current flows. A real battery's terminal voltage drops under load. And yet the model works — because the error introduced by these simplifications is small enough that the answer remains useful.

That judgement — *how small is small enough* — is not mathematical. It is engineering.

## The four stages that never change

Every mathematical model follows the same four-stage cycle, regardless of domain:

**1. Express.** Translate the real problem into mathematical language using scientific rules and declared assumptions. Assign letters to unknowns. Draw the diagram. Write the equations. This is the stage most people rush through and most failures trace back to.

**2. Solve.** Apply mathematical technique — algebra, calculus, probability, geometry, whatever the model demands. This is what textbooks spend all their pages on and what computers now do faster than humans.

**3. Translate.** Take the mathematical solution back to the original context. *x = 5* is not an answer. *The third resistor is 5 Ω* is an answer.

**4. Validate.** Test the model against reality. Does it predict correctly for inputs it was not trained on? Does the error stay within acceptable bounds? If not, return to stage one and reconsider your assumptions.

The cycle is the same whether you are calculating a resistor value, modelling an attacker's breakeven cost in a game-theoretic defence, or reasoning about how many tool calls an AI agent should be allowed before a circuit breaker trips. The tools change. The structure does not.

## Why assumptions matter more than equations

Engineers are trained to solve. We are less well trained to declare what we assumed before we started solving. This asymmetry produces a specific failure mode: a mathematically correct solution to a problem that was incorrectly modelled.

I see this constantly in security architecture reviews. Someone presents a threat model with precise probabilities and a clear mitigation strategy. When I ask what assumptions they made about the attacker's capabilities, the answer is usually vague. When I ask what they assumed about the trustworthiness of upstream data, the answer is often that they did not consider it at all. The math was correct. The model was wrong.

The habit of listing assumptions explicitly — before you solve, before you present, before you commit to an architecture — is one of the few genuinely transferable skills between security engineering and any other discipline that uses models. The resistor example is simple enough to see the entire modelling cycle in one page. The instinct it trains applies to everything from circuit design to threat modelling to agent architecture governance.

The model is only as good as the assumptions you were willing to write down.
