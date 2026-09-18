---
title: "Taste Is the Last Human Bottleneck"
subtitle: "When machines can generate the code, judgment becomes the scarce part of engineering."
platform: x-article
status: draft
source_substack_id: 212460995
source_substack_url: ""
canonical_link_status: pending-until-substack-scheduling
cover_image: "https://substack-post-media.s3.amazonaws.com/public/images/152b4fcc-96d3-437f-8c22-8bbadee1fd7f_1614x975.png"
---
When a machine can produce ten solutions before you have finished describing the problem, generation stops being the scarce resource. Judgment becomes scarce instead.

This is already visible in software. A coding agent can draft an API, write tests, refactor a module, produce documentation, and explain its own choices in minutes. The impressive part is no longer that code appeared. The difficult questions arrive afterward, when somebody has to decide what the code means for the system around it.

Someone still has to decide whether the code belongs in the system, which assumption the abstraction hides, and where a locally elegant solution may damage the larger architecture.

AI is turning engineers into editors of possibility, which makes taste an operational concern rather than a decorative one.

## Production is becoming abundant

Before generative AI, implementation cost acted as a filter. An idea had to be valuable enough to justify the time required to build it.

That filter is weakening.

Now every plausible feature can acquire a prototype. Every architectural impulse can become a pull request. Every half-understood request can arrive wrapped in polished code, confident documentation, and passing tests written by the same system that produced the implementation.

This abundance feels like acceleration, and sometimes it genuinely is. It is also a flood of decisions disguised as finished work.

The machine reduces the cost of producing an option. It does not remove the cost of choosing well.

## Vibe coding avoids the judgment

The phrase *vibe coding* describes a seductive loop: prompt, generate, run, adjust, ship.

It works remarkably well when the consequences are small, the system has little history, and failure is cheap. A prototype with no users can tolerate architectural improvisation.

Production cannot tolerate the same improvisation. Generated code has to coexist with existing conventions, security boundaries, data models, operational constraints, and people who will maintain it later. The damage rarely announces itself on the day of generation. It appears months afterward as an authorization gap, a duplicated abstraction, an impossible migration, or a feature that technically works but makes the whole system harder to change.

Vibe coding treats runnable output as evidence that the thinking is complete.

More often, it means that the thinking has only become inspectable.

## Taste is compressed experience

Taste can sound decorative: an aesthetic preference added after the serious engineering is finished.

In practice, technical taste is compressed experience.

It is the intuition that this abstraction is too early, this dependency too powerful, this interface too broad, this test too coupled to implementation, or this clever shortcut too expensive for the next person. The intuition may arrive instantly because years of failures have been condensed into it.

Good taste is a fallible set of priors earned through contact with consequences.

That is why a novice and an expert can use the same model and receive very different value. The model may generate similar candidates. The expert is more likely to notice which one violates an invariant nobody put in the prompt.

AI amplifies the context and judgment supplied to it.

It cannot supply the history you never acquired.

## The work moves upstream

As implementation becomes cheaper, valuable engineering moves before generation.

The human has to define the real problem, identify the part of the system that should change, state what must remain true, and decide what success means under both failure and the happy path.

Compare two requests:

> Write a billing function.

And:

> Extend the existing invoice flow to support usage-based tiers. Reuse the currency and authorization boundaries already applied to subscriptions. Preserve idempotency, and prove the old pricing behavior remains unchanged.

The second request is better for reasons that have little to do with its length. It reveals that somebody has already formed a model of the system. The prompt is the residue of that thinking, not a substitute for it.

## The work also moves downstream

Judgment is needed after generation too.

Tests can verify specified behavior, but they cannot tell you whether the specification was wise. Code review can detect a local defect, but it may miss that the feature should not exist. An agent can explain why it chose an approach, but eloquence is not independent evidence that the approach belongs in the product.

The human remains responsible for:

- deciding which generated option deserves to survive
- checking whether it fits the surrounding architecture
- identifying assumptions absent from the prompt
- testing behavior at boundaries and under failure
- rejecting unnecessary complexity
- owning the consequences when the output reaches other people

This is curation in the serious sense: controlling what enters the world and accepting responsibility for the selection. Decoration comes later, if it matters at all.

## Constraints are a form of authorship

Good AI-assisted engineering therefore depends on constraints.

Plans make the intended change legible. Tests turn expectations into executable checks. Architectural rules define what kinds of solutions belong. Narrow permissions prevent a coding agent from converting convenience into authority. Small diffs keep review possible.

These constraints keep the human responsible for the system's direction even when the machine supplies much of its syntax. Creativity has something firm to push against.

The more capable the generator becomes, the more important the selection environment becomes.

Infinite output without judgment may look like abundance, but much of it is simply noise with excellent grammar.

## Taste cannot remain mystical

If taste becomes economically important, we should avoid turning it into an excuse for unchallengeable senior intuition.

Judgment has to become teachable and inspectable. Why is this abstraction wrong? Which future change does it make harder? What invariant does it threaten? What incident or maintenance pattern shaped the preference?

The best experts can translate instinct back into reasons. They write design principles, preserve examples, construct tests, and teach others to see what they see. Without that translation, “taste” easily becomes hierarchy wearing artistic clothing.

## The final bottleneck is responsibility

Machines will continue getting better at producing software, images, arguments, plans, and decisions.

As output becomes abundant, the human contribution becomes easier to misunderstand. We may appear to be doing less because fewer keystrokes originate in our hands.

But the deepest work was never the keystrokes.

It was understanding the world well enough to choose what should be built, recognizing quality among plausible alternatives, and accepting responsibility for the choice.

The machine can generate the birds. Someone still has to decide which one can fly, and explain why the others should remain on the conveyor.

---

An earlier version appeared as [Vibe Engineering](https://themayursinha.com/architecture/2025/10/10/vibe-engineering/) on themayursinha.com.
