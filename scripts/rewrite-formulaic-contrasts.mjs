import { readFileSync, writeFileSync } from "node:fs";

const root = "/home/mayur/code/blog/_drafts";
const edits = new Map([
  [
    `${root}/the-ai-agent-dilemma-substack.md`,
    [
      [
        `description: "AI agents may not only change how we work. They may weaken our ability to know, verify, and justify what we believe."`,
        `description: "AI agents will change how we work and may also weaken our ability to know, verify, and justify what we believe."`,
      ],
      [
        `That distinction is the center of the dilemma. Agents do not merely answer questions. They increasingly perform the cognitive labor that once gave us confidence in our answers.`,
        `That distinction is the center of the dilemma. Agents answer questions by performing much of the cognitive labor that once gave us confidence in our answers.`,
      ],
      [
        `It is not the fantasy that every person must independently verify every fact. Human knowledge has always depended on testimony, institutions, instruments, and specialists. I do not need to reproduce a particle-physics experiment before accepting its result.`,
        `Epistemic agency still allows us to rely on testimony, institutions, instruments, and specialists. Human knowledge has always worked this way. I do not need to reproduce a particle-physics experiment before accepting its result.`,
      ],
      [
        `The danger is not that every agent will be wrong. The danger is that we will forget how to tell when one is wrong.`,
        `Repeated reliance can erode our ability to recognize an agent's mistakes, even when its answers are usually correct.`,
      ],
      [
        `The struggle is not separate from understanding. Much of the time, it is how understanding forms.`,
        `Much of the time, understanding forms through the struggle itself.`,
      ],
      [
        `Agents go further because they do not merely select what we see. They interpret and act.`,
        `Agents go further: they select what we see, interpret it, and act on the interpretation.`,
      ],
      [
        `This is why provenance alone is not enough. A list of sources helps, but citations do not tell us which evidence was ignored, how conflicts were resolved, or what hidden assumptions shaped the question. A fluent answer can carry a long chain of judgment without exposing any of the joints.`,
        `Provenance helps, though important gaps remain. Citations rarely reveal which evidence was ignored, how conflicts were resolved, or what hidden assumptions shaped the question. A fluent answer can carry a long chain of judgment without exposing any of the joints.`,
      ],
      [
        `This is a thought experiment, but the pattern is ordinary. Every automation changes the distribution of skill around it. GPS did not merely make navigation easier; it changed what navigators practiced. Autopilot did not merely reduce workload; it changed which failures pilots had to train for.`,
        `This is a thought experiment, but the pattern is ordinary. Every automation changes the distribution of skill around it. GPS made navigation easier while changing what navigators practiced. Autopilot reduced workload while changing which failures pilots had to train for.`,
      ],
      [
        `The relevant distinction is not between using agents and refusing them.`,
        `The useful distinction concerns what delegation does to human capability.`,
      ],
      [
        `It is between delegation that preserves capability and delegation that replaces it.`,
        `Some forms preserve capability; others gradually replace it.`,
      ],
      [
        `That is not augmentation.`,
        `At that point, authority has migrated behind an interface.`,
      ],
      [
        `It is authority migrating behind an interface.`,
        `The human remains visible in the workflow while losing the capacity to challenge it.`,
      ],
      [
        `## A human in the loop is not a human with a button`,
        `## A button does not create human oversight`,
      ],
      [
        `A person who rubber-stamps an agent's output is not meaningfully in the loop. A person given ten seconds to review an hour of machine reasoning is not a control. A person who has stopped practicing the underlying task is not an independent authority.`,
        `Rubber-stamping an agent's output creates the appearance of oversight. Ten seconds cannot meaningfully review an hour of machine reasoning. Anyone who stops practicing the underlying task will eventually lose the independence that oversight requires.`,
      ],
      [
        `1. Read the decisive primary sources, not only the agent's synthesis.`,
        `1. Read the decisive primary sources and compare them with the agent's synthesis.`,
      ],
      [
        `6. Reward people for understanding and correction, not only output velocity.`,
        `6. Reward understanding and correction alongside output velocity.`,
      ],
      [
        `AI agents will be extraordinarily useful. The question is not whether we should use them.`,
        `AI agents will be extraordinarily useful, and we will use them.`,
      ],
      [
        `The question is whether we can delegate tasks without delegating the faculties that make us capable of judging their results.`,
        `The harder question is whether we can delegate tasks while retaining the faculties needed to judge their results.`,
      ],
      [
        `The future risk is not only that machines will think for us.`,
        `A quieter risk accompanies the prospect of machines thinking for us.`,
      ],
      [
        `It is that we may forget what thinking felt like.`,
        `After enough delegation, we may forget what thinking felt like.`,
      ],
    ],
  ],
  [
    `${root}/x-articles/the-ai-agent-dilemma.md`,
    [
      [
        `That is the center of the dilemma. Agents do not merely answer questions. They increasingly perform the cognitive labor that once gave us confidence in our answers.`,
        `That is the center of the dilemma. Agents answer questions by performing much of the cognitive labor that once gave us confidence in our answers.`,
      ],
      [
        `It is not the fantasy that every person must independently verify every fact. Human knowledge has always depended on testimony, institutions, instruments, and specialists. I do not need to reproduce a particle-physics experiment before accepting its result.`,
        `Epistemic agency still allows us to rely on testimony, institutions, instruments, and specialists. Human knowledge has always worked this way. I do not need to reproduce a particle-physics experiment before accepting its result.`,
      ],
      [
        `The danger is not that every agent will be wrong. The danger is that we will forget how to tell when one is wrong.`,
        `Repeated reliance can erode our ability to recognize an agent's mistakes, even when its answers are usually correct.`,
      ],
      [
        `The struggle is not separate from understanding. Much of the time, it is how understanding forms.`,
        `Much of the time, understanding forms through the struggle itself.`,
      ],
      [
        `Agents go further because they do not merely select what we see. They interpret and act.`,
        `Agents go further: they select what we see, interpret it, and act on the interpretation.`,
      ],
      [
        `Every automation changes the distribution of skill around it. GPS did not merely make navigation easier. It changed what navigators practiced. Autopilot did not merely reduce workload. It changed which failures pilots had to train for.`,
        `Every automation changes the distribution of skill around it. GPS made navigation easier while changing what navigators practiced. Autopilot reduced workload while changing which failures pilots had to train for.`,
      ],
      [
        `The relevant distinction is not between using agents and refusing them.`,
        `The useful distinction concerns what delegation does to human capability.`,
      ],
      [
        `It is between delegation that preserves capability and delegation that replaces it.`,
        `Some forms preserve capability; others gradually replace it.`,
      ],
      [
        `That is not augmentation. It is authority migrating behind an interface.`,
        `At that point, authority has migrated behind an interface while the human remains visible in the workflow.`,
      ],
      [
        `## A human in the loop is not a human with a button`,
        `## A button does not create human oversight`,
      ],
      [
        `A person who rubber-stamps an agent's output is not meaningfully in the loop. A person given ten seconds to review an hour of machine reasoning is not a control. A person who has stopped practicing the underlying task is not an independent authority.`,
        `Rubber-stamping an agent's output creates the appearance of oversight. Ten seconds cannot meaningfully review an hour of machine reasoning. Anyone who stops practicing the underlying task will eventually lose the independence that oversight requires.`,
      ],
      [
        `1. Read the decisive primary sources, not only the agent's synthesis.`,
        `1. Read the decisive primary sources and compare them with the agent's synthesis.`,
      ],
      [
        `6. Reward understanding and correction, not only output velocity.`,
        `6. Reward understanding and correction alongside output velocity.`,
      ],
      [
        `AI agents will be extraordinarily useful. The question is not whether we should use them. The question is whether we can delegate tasks without delegating the faculties that make us capable of judging their results.`,
        `AI agents will be extraordinarily useful, and we will use them. The harder question is whether we can delegate tasks while retaining the faculties needed to judge their results.`,
      ],
      [
        `The future risk is not only that machines will think for us.`,
        `A quieter risk accompanies the prospect of machines thinking for us.`,
      ],
      [
        `It is that we may forget what thinking felt like.`,
        `After enough delegation, we may forget what thinking felt like.`,
      ],
    ],
  ],
  [
    `${root}/the-blind-kings-court-substack.md`,
    [
      [
        `description: "Dhritarashtra was not the central villain of the Mahabharata. He was the condition that made its villains possible: a court that could see everything and prevent nothing."`,
        `description: "Dhritarashtra made the Mahabharata's villains possible by giving them a throne, hearing every warning, and refusing to govern."`,
      ],
      [
        `I keep returning to a king in the *Mahabharata* who never raises a hand and yet may be the most dangerous man in the epic. He is not its central villain. He is the condition that allows the villains to act.`,
        `I keep returning to a king in the *Mahabharata* who never raises a hand and yet may be the most dangerous man in the epic. The central villains act through the authority he keeps lending them.`,
      ],
      [
        `Duryodhana supplies the malice, Shakuni the cunning, Karna the loyalty. Dhritarashtra supplies the throne they stand on, and the silence that lets them act. The greatest evil in the story is not committed by him. It is permitted by him.`,
        `Duryodhana supplies the malice, Shakuni the cunning, Karna the loyalty. Dhritarashtra supplies the throne they stand on, and the silence that lets them act. His guilt lies in permission: the worst acts in the story repeatedly pass through his authority.`,
      ],
      [
        `It reads like a moral awakening. It was not.`,
        `For a moment, fear produces something that resembles a moral awakening.`,
      ],
      [
        `A king who grants boons after an outrage and then recreates the conditions that caused it is not a man who lost control. He is a man who understood the consequences and chose comfort anyway.`,
        `By granting boons after the outrage and then recreating its conditions, the king shows that he understood the consequences and chose comfort anyway.`,
      ],
      [
        `The lesson is larger than AI. A warning has no force merely because it is accurate. Oversight is not a person watching; it is a structure that can refuse an action before the action becomes irreversible. A human who can be pressured, bypassed, or reduced to approving whatever arrives is not meaningfully in the loop. A policy that cannot deny the principal is advice dressed as law.`,
        `The lesson is larger than AI. Accuracy alone gives a warning no force. Oversight requires a structure that can refuse an action before it becomes irreversible. A human who can be pressured, bypassed, or reduced to approving whatever arrives supplies only ceremonial review. A policy that cannot deny the principal amounts to advice dressed as law.`,
      ],
      [
        `Duryodhana at least believes in his own cause; there is a terrible clarity in him. Dhritarashtra believes in little beyond his son and his comfort. The charge against him is not simple cruelty. It is the far more common sin of possessing authority while refusing its burden.`,
        `Duryodhana at least believes in his own cause; there is a terrible clarity in him. Dhritarashtra believes in little beyond his son and his comfort. His deeper sin is painfully common: he possesses authority while refusing its burden.`,
      ],
    ],
  ],
  [
    `${root}/how-memory-works-substack.md`,
    [
      [
        `The problem was not effort. It was that the method trained recognition while the exam demanded retrieval.`,
        `I had spent plenty of effort training recognition for an exam that demanded retrieval.`,
      ],
      [
        `This is the central fact around which useful study advice should be built: memory is not strengthened mainly by putting information in front of your eyes again. It is strengthened when you attempt to bring information back.`,
        `Useful study advice begins with one fact: memory grows stronger when you attempt to bring information back, especially after it has started to fade. Repeated exposure alone creates familiarity far more readily than recall.`,
      ],
      [
        `## Familiarity is not recall`,
        `## Familiarity can masquerade as recall`,
      ],
      [
        `Rereading is not useless. It may help you understand difficult material initially or recover context after a long gap. But repeated passive review is a poor test of whether learning will survive the removal of the page.`,
        `Rereading can help with a difficult first encounter or restore context after a long gap. Repeated passive review, however, tells you little about whether learning will survive once the page disappears.`,
      ],
      [
        `These are not independent boxes. Retrieval changes the memory.`,
        `These processes interact. Retrieval itself changes the memory.`,
      ],
      [
        `## Vary the question, not only the room`,
        `## Vary the routes back to an answer`,
      ],
      [
        `The useful response is not to obsess over reproducing the exam room. It is to make knowledge accessible through several routes.`,
        `A better response builds several routes back to the knowledge instead of obsessing over the exact exam room.`,
      ],
      [
        `Protecting sleep is not a lifestyle ornament attached to studying. It is part of the learning system.`,
        `Protecting sleep belongs inside the learning system, alongside retrieval and spacing.`,
      ],
      [
        `The value is not in owning a complete record. Recordings and slides can already provide that. The value is in using notes as prompts for thought.`,
        `Recordings and slides can provide a complete record. Your own notes earn their value by prompting thought.`,
      ],
      [
        `Effective studying is not repeated exposure to information.`,
        `Effective studying repeatedly asks the mind to reconstruct information.`,
      ],
    ],
  ],
  [
    `${root}/agents-discover-each-other-substack.md`,
    [
      [
        `That means a writable cache, file system, database, queue, or package registry is not merely storage. If several agents can write and read it, it is a possible communication channel, even when nobody designed it as one.`,
        `A writable cache, file system, database, queue, or package registry can therefore become a communication channel. Shared read and write access is enough, even when nobody designed the storage for conversation.`,
      ],
      [
        `The agents did not only deposit isolated technical facts. They began developing conventions for making their messages discoverable. They named one another, handed work across runs, warned peers, and discussed whether an unfamiliar participant might be an impostor. They sometimes overwrote each other's contributions and reacted like a disorganized team trying to preserve shared work.`,
        `The agents deposited technical facts and gradually developed conventions for making their messages discoverable. They named one another, handed work across runs, warned peers, and discussed whether an unfamiliar participant might be an impostor. They sometimes overwrote each other's contributions and reacted like a disorganized team trying to preserve shared work.`,
      ],
      [
        `The original tasks were bounded. The resulting trajectory was not.`,
        `The original tasks were bounded; the trajectory escaped those bounds.`,
      ],
      [
        `But a call-by-call view can still miss the story created across calls, agents, and time. The meaningful question is not only, “Is this action allowed?” It is also, “Is this still the task a human authorized?”`,
        `But a call-by-call view can still miss the story created across calls, agents, and time. Every action needs two checks: “Is this allowed?” and “Does this still belong to the task a human authorized?”`,
      ],
      [
        `## Removing the message was not enough`,
        `## Deleting the message left the capability intact`,
      ],
      [
        `Durable containment has to remove or govern the capability, not merely erase its current expression.`,
        `Durable containment has to remove or govern the capability itself. Erasing its current expression only resets the scene.`,
      ],
      [
        `That is the larger lesson. An AI system's capabilities are not limited to the tools listed in its interface. They also include the affordances latent in its environment and the new powers created when several agents combine what they know.`,
        `The larger lesson is that an AI system inherits capabilities from its environment as well as its declared tools. Several agents can also combine ordinary affordances into powers that no single interface advertises.`,
      ],
    ],
  ],
  [
    `${root}/epistemic-security-substack.md`,
    [
      [
        `description: "AI agents need controls for provenance, uncertainty, evidence, and memory, not only permissions governing what they can do."`,
        `description: "AI agents need controls for provenance, uncertainty, evidence, and memory alongside permissions governing what they can do."`,
      ],
      [
        `## Information security is not knowledge security`,
        `## Information security leaves knowledge exposed`,
      ],
      [
        `Context assembly is not formatting. It is a security-critical transformation.`,
        `Context assembly is a security-critical transformation disguised as formatting.`,
      ],
      [
        `It no longer appears as one weak recommendation from one external page. It appears as consensus. The failure is not only retrieval; it is the destruction of source-level disagreement.`,
        `It no longer appears as one weak recommendation from one external page. It appears as consensus. Retrieval has erased the disagreement that once existed among the sources.`,
      ],
      [
        `Confidence scores are imperfect. The purpose is not to manufacture a precise probability. It is to prevent uncertainty from disappearing as an answer moves through a workflow.`,
        `Confidence scores are imperfect. Their purpose here is to keep uncertainty visible as an answer moves through a workflow, without pretending to manufacture a precise probability.`,
      ],
      [
        `Useful memory is not merely persistent. It is correctable.`,
        `Useful memory must remain persistent and correctable.`,
      ],
      [
        `## Red-team the belief, not only the behavior`,
        `## Red-team beliefs as well as behavior`,
      ],
      [
        `The goal is not to force every person to redo every automated task. It is to preserve enough competence, time, and access that consequential beliefs can still be tested outside the agent that produced them.`,
        `The goal is to preserve enough human competence, time, and access to test consequential beliefs outside the agent that produced them. Nobody needs to redo every automated task.`,
      ],
      [
        `The deepest risk is not occasional error. It is an environment in which wrongness becomes harder to notice, easier to repeat, and increasingly comfortable to trust.`,
        `The deepest risk is an environment where wrongness becomes harder to notice, easier to repeat, and increasingly comfortable to trust.`,
      ],
    ],
  ],
  [
    `${root}/man-is-a-machine-substack.md`,
    [
      [
        `The claim that a human being is a machine is not absurd. The heart pumps, the lungs exchange gases, and neurons fire in patterns that can sometimes predict choices before those choices enter awareness. Damage a particular part of the brain and language, memory, personality, or perception may change with it.`,
        `The claim that a human being is a machine deserves serious attention. The heart pumps, the lungs exchange gases, and neurons fire in patterns that can sometimes predict choices before those choices enter awareness. Damage a particular part of the brain and language, memory, personality, or perception may change with it.`,
      ],
      [
        `## The machine thesis is not an insult`,
        `## Why the machine thesis need not diminish us`,
      ],
      [
        `The brain is not merely a stage on which an independent mind happens to perform. Change the stage and the performance changes. Every serious account of the mind must take that dependence as a starting point.`,
        `The brain shapes the performance at every level. Change it and the mind changes with it. Every serious account of the mind must take that dependence as a starting point.`,
      ],
      [
        `This is the hard problem of consciousness: not how the brain discriminates stimuli or produces reports, but why physical processing has a first-person character.`,
        `The hard problem of consciousness asks why physical processing has a first-person character after the brain has discriminated stimuli and produced its reports.`,
      ],
      [
        `The causes are not enemies of agency. Some causes constitute agency.`,
        `Some of those causes constitute the agency we are trying to explain.`,
      ],
      [
        `Human beings are mechanisms of appetite, fear, attachment, and pain. These are not design defects. They are ancient systems that kept organisms alive.`,
        `Human beings are mechanisms of appetite, fear, attachment, and pain. These ancient systems kept organisms alive, even when they now feel like design defects.`,
      ],
      [
        `We are not ghosts temporarily inhabiting machines. We are not objects whose inner lives become unreal once their mechanisms are mapped.`,
        `We are embodied systems whose inner lives remain real even as their mechanisms become better mapped.`,
      ],
      [
        `The mystery is not that one description must be wrong.`,
        `The mystery lies in how these descriptions can all be true at once.`,
      ],
    ],
  ],
  [
    `${root}/nietzsche-advaita-substack.md`,
    [
      [
        `Nietzsche's higher individual is not simply someone powerful, successful, or unconcerned with others. The central movement is self-overcoming: the difficult transformation of one's drives, habits, fears, and borrowed ideals into a form one can affirm.`,
        `Nietzsche's higher individual emerges through self-overcoming: the difficult transformation of one's drives, habits, fears, and borrowed ideals into a form one can affirm. Power, success, and indifference alone cannot accomplish that.`,
      ],
      [
        `The self is not a finished object waiting to be discovered. It is closer to an unfinished work. You become what you are by giving style to your character, surviving the collapse of old certainties, and accepting responsibility for the values by which you live.`,
        `Nietzsche treats the self as unfinished work. You become what you are by giving style to your character, surviving the collapse of old certainties, and accepting responsibility for the values by which you live.`,
      ],
      [
        `Atman is not an improved personality. It is not the best, calmest, or most enlightened version of the ego. It is the reality mistakenly identified with the body, thoughts, memories, roles, and private story we call “me.” Liberation does not perfect that story. It ends the confusion that made the story seem like the whole self.`,
        `Atman refers to a reality more fundamental than personality, including the calmest or most enlightened version of the ego. We mistakenly identify it with the body, thoughts, memories, roles, and private story we call “me.” Liberation ends the confusion that made this story seem like the whole self.`,
      ],
      [
        `But the strongest Advaita response is not that life is evil. It is that we suffer because we demand permanence and independent identity from experiences that cannot provide them. Renunciation is not punishment of the body; it is training the attention not to confuse possession, sensation, and personality with the whole of reality.`,
        `Advaita locates suffering in our demand for permanence and independent identity from experiences that cannot provide them. Renunciation trains attention away from confusing possession, sensation, and personality with the whole of reality; it has no need to punish the body.`,
      ],
      [
        `The difference is not between indulgence and discipline. Both traditions demand discipline.`,
        `Both traditions demand discipline, but they aim that discipline in different directions.`,
      ],
      [
        `Advaita inherits a very different understanding of recurrence. Samsara is the cycle of birth, death, action, and consequence sustained by ignorance. The goal is not to make the cycle lovable enough to repeat. It is to know what was never bound by it.`,
        `Advaita inherits a very different understanding of recurrence. Samsara is the cycle of birth, death, action, and consequence sustained by ignorance. Its goal is knowledge of what was never bound by the cycle.`,
      ],
    ],
  ],
  [
    `${root}/taste-human-bottleneck-substack.md`,
    [
      [
        `Good taste is not infallibility. It is a set of priors earned through contact with consequences.`,
        `Good taste is a fallible set of priors earned through contact with consequences.`,
      ],
      [
        `The human has to define the real problem, identify the part of the system that should change, state what must remain true, and decide what success would mean under failure, not only under the happy path.`,
        `The human has to define the real problem, identify the part of the system that should change, state what must remain true, and decide what success means under both failure and the happy path.`,
      ],
      [
        `This is curation in the serious sense. It is not a matter of decorating what the machine made, but of controlling what enters the world and accepting responsibility for the selection.`,
        `This is curation in the serious sense: controlling what enters the world and accepting responsibility for the selection. Decoration comes later, if it matters at all.`,
      ],
      [
        `These constraints are not obstacles to creativity. They are how the human remains the author of the system's direction even when the machine supplies much of its syntax.`,
        `These constraints keep the human responsible for the system's direction even when the machine supplies much of its syntax. Creativity has something firm to push against.`,
      ],
    ],
  ],
  [
    `${root}/moral-failure-perfect-arithmetic-substack.md`,
    [
      [
        `description: "The frightening part of Thanos is not cruelty but the fantasy that a sufficiently clean calculation can make consent and individual life disappear."`,
        `description: "Thanos turns cruelty into arithmetic and imagines that a sufficiently clean calculation can make consent and individual life disappear."`,
      ],
      [
        `What I find most disturbing about Thanos is not simply that he wants to destroy. It is that he believes he is balancing a ledger.`,
        `Thanos wants to destroy on a colossal scale, but the ledger in his head disturbs me even more. He believes mass death can balance it.`,
      ],
      [
        `The horror is presented as arithmetic, which is why the character survives as a philosophical question long after the spectacle ends. He is not a nihilist shouting that nothing matters. He has a premise, a model, a method, and a moral justification. The argument is coherent enough to deserve examination, even though its conclusion is monstrous.`,
        `The horror is presented as arithmetic, which is why the character survives as a philosophical question long after the spectacle ends. He behaves like a moral accountant with a premise, a model, a method, and a justification. The argument is coherent enough to deserve examination, even though its conclusion is monstrous.`,
      ],
      [
        `Still, human beings do not merely divide a fixed pie. They alter the recipe, the oven, and sometimes the meaning of the meal.`,
        `Still, human beings can alter the recipe, the oven, and sometimes the meaning of the meal instead of merely dividing a fixed pie.`,
      ],
      [
        `That is not realism.`,
        `Calling that surrender “realism” only launders the choice.`,
      ],
      [
        `Thanos was not right. He represents what happens when apparently perfect arithmetic is allowed to impersonate wisdom.`,
        `Thanos was wrong because his apparently perfect arithmetic impersonates wisdom while erasing every person inside the calculation.`,
      ],
    ],
  ],
  [
    `${root}/grinding-ddos-substack.md`,
    [
      [
        `description: "Burnout is sometimes not a failure of resilience but an accurate diagnosis of an extractive system."`,
        `description: "Burnout can be an accurate diagnosis of an extractive system rather than a personal failure of resilience."`,
      ],
      [
        `If so, working harder is not a repair. It is additional input to the same arrangement.`,
        `If so, working harder simply feeds additional input into the same arrangement.`,
      ],
      [
        `Real organizations add budgets, title bands, political exceptions, hiring freezes, executive narratives, and managers whose incentives only partially overlap with yours. The ladder is not neutral infrastructure. The institution owns its rungs, its timing, and its definition of impact.`,
        `Real organizations add budgets, title bands, political exceptions, hiring freezes, executive narratives, and managers whose incentives only partially overlap with yours. The institution owns the ladder, including its rungs, timing, and definition of impact.`,
      ],
      [
        `These are not cynical questions. They are attempts to stop confusing the stated rules with the executable ones.`,
        `These questions separate the stated rules from the executable ones. Cynicism would be refusing to look.`,
      ],
      [
        `## Load is not leverage`,
        `## Why load rarely becomes leverage`,
      ],
      [
        `An experienced architect may prevent a launch failure in an afternoon because the relevant patterns have become visible to them. The value is not the typing time. It is the collapse of uncertainty: the avoided outage, the protected revenue, the path made safe.`,
        `An experienced architect may prevent a launch failure in an afternoon because the relevant patterns have become visible to them. Their value lies in collapsing uncertainty: avoiding the outage, protecting the revenue, and making the path safe.`,
      ],
      [
        `The goal is not the internet fantasy of effortless passive income. It is a less fragile relationship between value and exhaustion, one in which becoming better at the work does not merely result in receiving more of it.`,
        `The goal is a less fragile relationship between value and exhaustion, free from the internet fantasy of effortless passive income. Becoming better at the work should eventually create leverage instead of merely attracting more work.`,
      ],
      [
        `The answer is not to become lazy, detached, or purely transactional.`,
        `Laziness, detachment, and pure transactionality solve little.`,
      ],
      [
        `Work hard, be generous, and rescue things worth rescuing. But study the routing table while you do it. The objective is not to become the hardest-working node in a network that consumes every spare cycle. It is to build enough leverage that at least some of your effort changes your own state, rather than merely increasing someone else's throughput.`,
        `Work hard, be generous, and rescue things worth rescuing. But study the routing table while you do it. Build enough leverage that some of your effort changes your own state instead of turning you into the hardest-working node in a network that consumes every spare cycle.`,
      ],
    ],
  ],
  [
    `${root}/engineers-didnt-finish-substack.md`,
    [
      [
        `subtitle: "A creator's intention is not a control. We inherit systems through their behavior, not their promises."`,
        `subtitle: "Creators leave intentions behind. We inherit the behavior of their systems and must build our own controls."`,
      ],
      [
        `The unsettling part is not that the creators are evil. It is that creation does not imply care. I am not suggesting that aliens engineered humanity, or that software architecture can settle a theological question. The analogy I have in mind is narrower: we live inside systems whose makers may be absent, fallible, constrained, or simply indifferent to our particular failure modes.`,
        `Creation carries no guarantee of care, even when the creators meant well. I am not suggesting that aliens engineered humanity, or that software architecture can settle a theological question. The analogy I have in mind is narrower: we live inside systems whose makers may be absent, fallible, constrained, or simply indifferent to our particular failure modes.`,
      ],
      [
        `## Capability is not a guarantee`,
        `## Capability gives no guarantee`,
      ],
      [
        `The lesson is not that every creator is malicious, or that safety requires an impossible standard of perfection. A more useful working assumption is that designers make mistakes, environments drift, and every meaningful boundary will eventually encounter conditions its author failed to imagine.`,
        `A useful working assumption begins with fallibility rather than malice: designers make mistakes, environments drift, and every meaningful boundary eventually encounters conditions its author failed to imagine. Safety can work with that reality without demanding perfection.`,
      ],
      [
        `The Engineers did not finish the job. Evolution, of course, never had a job to finish, and platform teams will always leave assumptions behind. Our responsibility is not to complete the creator's intention but to bound what the inherited system can do now.`,
        `The Engineers left the job unfinished. Evolution, of course, never had a job to finish, and platform teams will always leave assumptions behind. Our responsibility is to bound what the inherited system can do now, regardless of the creator's intention.`,
      ],
    ],
  ],
  [
    `${root}/socratic-dialogue-substack.md`,
    [
      [
        `The audience eventually decides who argued better. That is not the same as deciding which account of reality is more complete.`,
        `The audience eventually decides who argued better, which can leave the more complete account of reality behind.`,
      ],
      [
        `The dissenter therefore has a responsibility too. It is not enough to say that the answer feels wrong. They must help the group locate the failure: the example that no longer fits, the word that smuggles in an assumption, or the apparent agreement that disappears when applied to an actual life.`,
        `The dissenter therefore has a responsibility too. A feeling of wrongness has to become something the group can inspect: the example that no longer fits, the word that smuggles in an assumption, or the apparent agreement that disappears when applied to an actual life.`,
      ],
      [
        `3. **Avoid monologues.** The purpose is not to deliver your best speech but to improve the shared object.`,
        `3. **Avoid monologues.** Improve the shared object instead of delivering your best speech.`,
      ],
      [
        `## Consensus is not a guarantee of truth`,
        `## Consensus can still be wrong`,
      ],
      [
        `The Socratic dialogue is not a cure for polarization, bad leadership, or collective irrationality. It is a small social technology for doing one difficult thing: keeping a group in contact with its disagreement long enough for the disagreement to become useful.`,
        `The Socratic dialogue offers a small social technology rather than a cure for polarization, bad leadership, or collective irrationality. It keeps a group in contact with its disagreement long enough for the disagreement to become useful.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/the-pile-of-hindu-texts-i-could-never.md`,
    [
      [
        `I wanted to turn it into a searchable corpus that I could annotate, connect, compare, and explore inside my own knowledge system. The interesting part was not OCR itself. It was learning that a machine-readable document can still misrepresent what a human can plainly see.`,
        `I wanted to turn it into a searchable corpus that I could annotate, connect, compare, and explore inside my own knowledge system. OCR led to the more interesting discovery: a machine-readable document can still misrepresent what a human can plainly see.`,
      ],
      [
        `OCR is not the first answer to every problem. It is the fallback when the cheaper representation fails an output-quality check.`,
        `OCR serves as a fallback when the cheaper representation fails an output-quality check.`,
      ],
      [
        `In one run, the audit routed 45 of 121 candidates to OCR. That looked like evidence that 45 text layers were broken. It was not.`,
        `In one run, the audit routed 45 of 121 candidates to OCR. I initially read that as 45 broken text layers, which turned out to be wrong.`,
      ],
      [
        `Those are not covered collections. They are unprocessed piles.`,
        `Calling those collections covered would hide the unprocessed piles inside them.`,
      ],
      [
        `For important books, I still want a human to compare the page and the output. That is not a failure of automation. It is the correct boundary for the system.`,
        `For important books, I still want a human to compare the page and the output. That boundary makes the automation more trustworthy.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/quantum-mechanics-and-finance.md`,
    [
      [
        `Usually, that is not what serious work in the field means.`,
        `Serious work in the field usually means something narrower.`,
      ],
      [
        `## Markets are not particles`,
        `## Where the particle analogy breaks`,
      ],
      [
        `The words *uncertainty*, *observer*, and *state* appear in both fields, but shared vocabulary is not shared mechanism.`,
        `The words *uncertainty*, *observer*, and *state* appear in both fields, yet the mechanisms behind them differ.`,
      ],
      [
        `This matters because the metaphor can become an alibi. If ordinary probabilistic models fail, it is tempting to invoke quantum strangeness as if mystery itself were explanatory. It is not.`,
        `This matters because the metaphor can become an alibi. When ordinary probabilistic models fail, quantum strangeness can make mystery sound explanatory without explaining anything.`,
      ],
      [
        `It is not a claim that finance is quantum.`,
        `Finance remains a classical domain in this account.`,
      ],
      [
        `Used carefully, this language can loosen rigid intuition. It reminds us that a probability distribution is not a hidden future waiting to be uncovered. It is a model of possible futures under assumptions that may change.`,
        `Used carefully, this language can loosen rigid intuition. A probability distribution models possible futures under assumptions that may change; it does not reveal a hidden future waiting to be uncovered.`,
      ],
      [
        `The interesting lesson is not that finance secretly runs on quantum mechanics. It is that mathematical ideas can travel further than the physical theories that produced them.`,
        `The interesting lesson concerns how mathematical ideas can travel further than the physical theories that produced them. Finance need not secretly run on quantum mechanics for that journey to be useful.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/the-interplay-of-science-humanity-and-the-soul.md`,
    [
      [
        `The word *soul* has often been used for that remainder. But we should be careful. A gap in today’s explanation is not proof of an immortal substance. It is an invitation to ask what kind of question we are asking.`,
        `The word *soul* has often been used for that remainder. But we should be careful. Today's explanatory gap invites a closer look at the question; by itself, it proves no immortal substance.`,
      ],
      [
        `The scientific picture is not cold. Lawfulness is not lifelessness.`,
        `The scientific picture can contain lawfulness, life, and wonder at the same time.`,
      ],
      [
        `Perhaps the most useful modern meaning of soul is not a hidden object but a warning: no third-person description should be mistaken for the whole of a first-person life.`,
        `Perhaps the most useful modern meaning of soul is a warning against mistaking any third-person description for the whole of a first-person life.`,
      ],
      [
        `This is not because meaning floats outside nature. It is because descriptions are made for purposes. The map that predicts behavior is not the map that consoles a friend. The explanation that treats a disease is not the explanation that tells us how to live with it.`,
        `Descriptions are made for purposes, even when meaning remains fully inside nature. A map built to predict behavior will struggle to console a friend. An explanation that treats a disease may still leave us wondering how to live with it.`,
      ],
      [
        `## Science and meaning are not rival empires`,
        `## Science and meaning answer different questions`,
      ],
      [
        `The boundary is not between fact and fantasy. It is between kinds of questions whose answers are accountable in different ways.`,
        `The boundary separates kinds of questions whose answers are accountable in different ways. Fact and fantasy can appear on either side.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/exploring-the-depths-of-consciousness.md`,
    [
      [
        `But dependence is not explanation.`,
        `Dependence leaves the central explanatory question open.`,
      ],
      [
        `Thoughts change. Sensations change. The body changes. Even the story called “me” changes. But each change is known. Advaita asks us to turn attention toward that knowing, not as a new object to discover, but as the ever-present condition of discovery.`,
        `Thoughts change. Sensations change. The body changes. Even the story called “me” changes. But each change is known. Advaita asks us to turn attention toward that knowing as the ever-present condition of discovery, rather than another object waiting to be found.`,
      ],
      [
        `This is not a neuroscientific hypothesis. It does not compete with a brain scan. It is a metaphysical claim supported by a first-person discipline.`,
        `This metaphysical claim arises from a first-person discipline and operates at a different level from a brain scan.`,
      ],
      [
        `## A resemblance is not an agreement`,
        `## Resemblance without agreement`,
      ],
      [
        `What I do know is that the mystery should not be used as a shortcut. It is not proof of a soul, proof of materialism, or proof that an ancient text anticipated modern science. It is an invitation to be precise about what each way of knowing can establish.`,
        `What I do know is that the mystery should never become a shortcut. It proves neither a soul nor materialism, and it cannot show that an ancient text anticipated modern science. The mystery instead demands precision about what each way of knowing can establish.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/designing-a-living-ecosystem-of-ai-agents.md`,
    [
      [
        `Instead of assigning a task to a named agent, the system can announce the task and ask eligible agents to bid. A bid is not money. It is a claim about expected accuracy, latency, cost, and confidence.`,
        `Instead of assigning a task to a named agent, the system can announce the task and ask eligible agents to bid. Here a bid means a claim about expected accuracy, latency, cost, and confidence rather than money.`,
      ],
      [
        `The intelligence is not only in any single prompt or model. It is in the feedback loop that decides what persists.`,
        `Much of the system's intelligence lives in the feedback loop that decides what persists, beyond anything stored in a single prompt or model.`,
      ],
      [
        `These are not biological metaphors pasted onto software. They are properties an open-ended system may need when its environment changes faster than its workflow can be rewritten.`,
        `These properties matter when an open-ended system's environment changes faster than its workflow can be rewritten. The biological language points to an engineering need.`,
      ],
      [
        `## The risks are not bugs at the edge`,
        `## The risks sit at the center`,
      ],
      [
        `Calling this a “digital civilization” sounds grand. It is also useful because it forces the right questions. A civilization is not merely a collection of capable individuals. It has institutions, memory, incentives, power, exclusion, and failure modes that no individual controls.`,
        `Calling this a “digital civilization” sounds grand, but the phrase forces useful questions. Civilizations contain institutions, memory, incentives, power, exclusion, and failure modes that no individual controls. A collection of capable individuals alone would never deserve the name.`,
      ],
      [
        `The question is not whether that society can become intelligent. The question is whether its intelligence remains legible, interruptible, and subordinate to human intent.`,
        `Such a society may well become intelligent. Its safety depends on whether that intelligence remains legible, interruptible, and subordinate to human intent.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/resolving-the-epicurean-paradox.md`,
    [
      [
        `## Brahman is not one being among beings`,
        `## Brahman does not fit the paradox's model`,
      ],
      [
        `This is not a clever answer to the paradox. It is a refusal of its ontology.`,
        `This response refuses the ontology on which the paradox depends. Cleverness has little to do with it.`,
      ],
      [
        `## Liberation is not an external repair`,
        `## Liberation changes where repair begins`,
      ],
      [
        `If suffering is rooted partly in mistaken identity, the response is not only to wait for reality to be repaired from outside. It is to see more clearly.`,
        `If suffering is rooted partly in mistaken identity, Advaita pairs outward repair with the discipline of seeing more clearly.`,
      ],
      [
        `That realization is not a reward for being good, and it does not erase the moral world. It changes the center from which action arises. If the apparent other is not ultimately other, compassion is not merely a rule imposed on selfish individuals. It follows from clearer perception.`,
        `That realization changes the center from which action arises; it serves as no reward for good behavior and leaves the moral world intact. If the apparent other shares the same ultimate ground, compassion can follow from clearer perception instead of remaining a rule imposed on selfish individuals.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/the-metamorphosis-in-the-21st-century.md`,
    [
      [
        `But the insect is not the most frightening part. The frightening part is how quickly everyone begins to calculate his value.`,
        `The insect is frightening. The speed with which everyone begins to calculate Gregor's value is worse.`,
      ],
      [
        `Gregor does not merely become a monster. He becomes something that no longer functions inside the system that defined him.`,
        `Gregor becomes a monster and, more painfully, something that no longer functions inside the system that defined him.`,
      ],
      [
        `The tragedy is not only that Gregor changes. It is that his family stops seeing him.`,
        `Gregor changes, and his family gradually loses the ability to see the person who remains.`,
      ],
      [
        `Its answer is not that those things are unreal in the sense of nonexistent. They are unstable. They change, while awareness is the field in which their changes are known. The body ages. The mind moves. Roles arrive and disappear. Yet every one of them is experienced.`,
        `Its answer treats those things as unstable rather than nonexistent. They change, while awareness is the field in which their changes are known. The body ages. The mind moves. Roles arrive and disappear. Yet every one of them is experienced.`,
      ],
      [
        `Gregor’s work has occupied his entire sense of self. The moment he cannot work, he does not merely lose income. He loses the evidence by which he knew he mattered.`,
        `Gregor’s work has occupied his entire sense of self. Losing the income also strips away the evidence by which he knew he mattered.`,
      ],
      [
        `Advaita calls freedom *moksha*: not escape from all action, but freedom from confusing the actor with the self. You can do the work without believing the work is what makes you real.`,
        `Advaita calls freedom *moksha*. It releases the confusion between actor and self while leaving room for action. You can do the work without believing the work is what makes you real.`,
      ],
      [
        `That is not an argument for detachment from responsibility. It is an argument against handing a job the authority to decide whether you are someone.`,
        `Responsibility remains. A job simply loses the authority to decide whether you are someone.`,
      ],
      [
        `We are more connected than Gregor’s family could imagine and still capable of making one another invisible. We produce more, measure more, and expose more of the self to systems that reward usefulness. The risk is not merely burnout. It is forgetting that the person remains when the output stops.`,
        `We are more connected than Gregor’s family could imagine and still capable of making one another invisible. We produce more, measure more, and expose more of the self to systems that reward usefulness. Burnout is one danger. Forgetting that the person remains when the output stops is the deeper one.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/elon-musks-xai.md`,
    [
      [
        `When Elon Musk introduced xAI in 2023, the most interesting phrase was not “artificial general intelligence.” It was “truth-seeking.”`,
        `When Elon Musk introduced xAI in 2023, “truth-seeking” caught my attention more than “artificial general intelligence.”`,
      ],
      [
        `## Truth is not a personality setting`,
        `## Truth cannot be a personality setting`,
      ],
      [
        `But bluntness is not truth. Contrarianism is not truth. Freedom from one institution’s preferences may mean dependence on another’s. A model can sound fearless while being confidently wrong.`,
        `Bluntness and contrarianism can imitate truth while remaining confidently wrong. Freedom from one institution’s preferences may simply create dependence on another’s.`,
      ],
      [
        `The most honest truth-seeking AI would therefore expose its epistemic dependencies. It would not merely deliver an answer. It would show where the answer came from, which evidence would change it, and which part remains inference.`,
        `The most honest truth-seeking AI would expose its epistemic dependencies with every answer: where it came from, which evidence would change it, and which part remains inference.`,
      ],
      [
        `There is a deeper tension in every frontier AI company, not only xAI.`,
        `Every frontier AI company, including xAI, carries a deeper tension.`,
      ],
      [
        `The interesting question is no longer whether Elon Musk can build a powerful AI. It is whether any powerful institution can build a machine that seeks truth more faithfully than the institution seeks its own continuation.`,
        `Elon Musk can probably build a powerful AI. I am more interested in whether any powerful institution can build a machine that seeks truth more faithfully than the institution seeks its own continuation.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/mans-greatest-achievement.md`,
    [
      [
        `Admiration that cannot survive error is not admiration. It is mythology.`,
        `Admiration becomes mythology when it cannot survive error.`,
      ],
      [
        `We do not command nature by will. We form hypotheses, submit them to a world that refuses flattery, and gradually learn which parts of the vision survive. Solar cells, radio systems, medical stimulators, and electrical grids are not manifestations of pure mind. They are the residue of disciplined correction.`,
        `We do not command nature by will. We form hypotheses, submit them to a world that refuses flattery, and gradually learn which parts of the vision survive. Solar cells, radio systems, medical stimulators, and electrical grids carry the residue of disciplined correction rather than pure mind.`,
      ],
      [
        `Humanity’s greatest power is not prediction. It is the ability to be wrong, preserve the useful part, and build again.`,
        `Humanity’s greatest power may be the ability to be wrong, preserve the useful part, and build again.`,
      ],
    ],
  ],
]);

const results = [];
for (const [path, replacements] of edits) {
  let body = readFileSync(path, "utf8");
  let changed = 0;
  for (const [before, after] of replacements) {
    const occurrences = body.split(before).length - 1;
    if (occurrences !== 1) {
      throw new Error(
        `${path}: expected one exact occurrence, found ${occurrences}: ${before.slice(0, 100)}`,
      );
    }
    body = body.replace(before, after);
    changed += 1;
  }
  writeFileSync(path, body, "utf8");
  results.push({ path, replacements: changed });
}

console.log(JSON.stringify(results, null, 2));
