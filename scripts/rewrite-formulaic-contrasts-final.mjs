import { readFileSync, writeFileSync } from "node:fs";

const root = "/home/mayur/code/blog/_drafts";
const edits = new Map([
  [
    `${root}/the-ai-agent-dilemma-substack.md`,
    [[
      `The bias, omission, or manipulation no longer appears as a suspicious source in a list. It can disappear inside the delegated process.`,
      `Bias, omission, and manipulation can disappear inside the delegated process before a human ever sees a suspicious source.`,
    ]],
  ],
  [
    `${root}/x-articles/the-ai-agent-dilemma.md`,
    [[
      `The bias, omission, or manipulation no longer appears as a suspicious source in a list. It can disappear inside the delegated process.`,
      `Bias, omission, and manipulation can disappear inside the delegated process before a human ever sees a suspicious source.`,
    ]],
  ],
  [
    `${root}/epistemic-security-substack.md`,
    [
      [
        `That is not the same as data integrity.`,
        `Data integrity cannot answer that question.`,
      ],
      [
        `It no longer appears as one weak recommendation from one external page. It appears as consensus. Retrieval has erased the disagreement that once existed among the sources.`,
        `One weak recommendation from one external page now appears to be a consensus. Retrieval has erased the disagreement that once existed among the sources.`,
      ],
      [
        `No obviously malicious tool call occurred. The attack moved through institutional memory.`,
        `The attack moved through institutional memory without producing an obviously malicious tool call.`,
      ],
      [
        `The dangerous question is no longer only, “Can an attacker make the model say something bad?”\n\nIt is, “Can an attacker make the organization believe something false?”`,
        `A bad model response is only the immediate danger. The more durable attack makes the organization believe something false.`,
      ],
    ],
  ],
  [
    `${root}/how-memory-works-substack.md`,
    [[
      `The purpose is not to make notes beautiful.`,
      `Notes need to support thinking; beauty is optional.`,
    ]],
  ],
  [
    `${root}/nietzsche-advaita-substack.md`,
    [
      [
        `Nietzsche and Advaita were not saying the same thing.`,
        `Their conclusions diverge sharply.`,
      ],
      [
        `Nietzsche's *Beyond Good and Evil* is not an invitation to become immoral. It is an attack on the idea that our moral categories arrived from outside history, complete and unquestionable.`,
        `Nietzsche's *Beyond Good and Evil* attacks the idea that our moral categories arrived from outside history, complete and unquestionable. Reading it as an invitation to immorality misses the argument.`,
      ],
    ],
  ],
  [
    `${root}/man-is-a-machine-substack.md`,
    [[
      `The pain is not inferred from a scan. It is present to the person having it.`,
      `The person experiences the pain directly; no scan supplies that knowledge.`,
    ]],
  ],
  [
    `${root}/substack-live-revamps/the-metamorphosis-in-the-21st-century.md`,
    [[
      `Kafka and Advaita are not saying the same thing. Kafka shows what happens when identity is stripped away and no deeper ground is found. Advaita asks us to investigate that ground before a crisis does the stripping for us.`,
      `Kafka and Advaita diverge sharply from their shared question. Kafka shows what happens when identity is stripped away and no deeper ground is found. Advaita asks us to investigate that ground before a crisis does the stripping for us.`,
    ]],
  ],
  [
    `${root}/substack-live-revamps/exploring-the-depths-of-consciousness.md`,
    [
      [
        `That gap is where neuroscience, philosophy, and Advaita Vedanta meet. They do not agree. More importantly, they are not always trying to answer the same question.`,
        `That gap is where neuroscience, philosophy, and Advaita Vedanta meet. They disagree partly because they ask different questions.`,
      ],
      [
        `The tradition’s answer is radical. Awareness is not produced as a private possession of the individual self. The apparent separation between knower and known is not ultimate. Atman, the deepest self, is Brahman, the ground of reality.`,
        `The tradition’s answer is radical. Awareness belongs to the ground of reality rather than the private possession of an individual self. The apparent separation between knower and known eventually dissolves into the identity of Atman and Brahman.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/designing-a-living-ecosystem-of-ai-agents.md`,
    [[
      `But memory is not automatically wisdom. It can preserve bias, secrets, poisoned instructions, or a failure that happened to look like success. Provenance therefore matters as much as recall: who learned this, from what event, under which policy, and with what evidence?`,
      `Memory can preserve bias, secrets, poisoned instructions, or a failure that happened to look like success as easily as it preserves wisdom. Provenance therefore matters as much as recall: who learned this, from what event, under which policy, and with what evidence?`,
    ]],
  ],
  [
    `${root}/substack-live-revamps/resolving-the-epicurean-paradox.md`,
    [
      [
        `In Advaita, Brahman is not a very powerful entity within reality. Brahman is the non-dual ground of reality: not an object with properties, not a person located elsewhere, and not one side of a contest between good and evil.`,
        `Advaita describes Brahman as the non-dual ground of reality rather than a very powerful entity within it. The concept sits outside the familiar categories of object, distant person, and participant in a contest between good and evil.`,
      ],
      [
        `Advaita distinguishes levels of reality. At the everyday level in which persons act, pain matters and ethical duties remain. The claim is that this level is not ultimate; it is not a claim that nothing hurts within it.`,
        `Advaita distinguishes levels of reality. At the everyday level in which persons act, pain matters and ethical duties remain. The tradition treats this level as provisional while taking the hurt within it seriously.`,
      ],
    ],
  ],
  [
    `${root}/substack-live-revamps/elon-musks-xai.md`,
    [[
      `The same applies to truth. A model should not hide evidence to protect a preferred narrative. It also should not treat every private fact as something it is entitled to expose. Truthfulness is not permissionlessness.`,
      `The same applies to truth. A model should neither hide evidence to protect a preferred narrative nor assume it is entitled to expose every private fact. Truthfulness carries obligations as well as limits.`,
    ]],
  ],
]);

const results = [];
for (const [path, replacements] of edits) {
  let body = readFileSync(path, "utf8");
  for (const [before, after] of replacements) {
    const occurrences = body.split(before).length - 1;
    if (occurrences !== 1) {
      throw new Error(`${path}: expected one occurrence, found ${occurrences}: ${before.slice(0, 100)}`);
    }
    body = body.replace(before, after);
  }
  writeFileSync(path, body, "utf8");
  results.push({ path, replacements: replacements.length });
}
console.log(JSON.stringify(results, null, 2));
