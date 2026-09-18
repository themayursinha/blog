import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

const outputDir = "/home/mayur/code/blog/_drafts/x-articles";
const assetDir = join(outputDir, "assets");
const manifestPath = join(outputDir, "manifest.json");
mkdirSync(assetDir, { recursive: true, mode: 0o700 });

const items = [
  {
    id: 212433944,
    title: "The AI Agent Dilemma",
    subtitle: "The first thing agents outsource is effort. The second may be judgment.",
    slug: "the-ai-agent-dilemma",
    source: "/home/mayur/code/blog/_drafts/the-ai-agent-dilemma-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/6fc71b26-84f3-4361-a2d3-626ce3173167_1610x977.png",
    substackSlug: "the-ai-agent-dilemma",
    substackState: "scheduled",
    substackDate: "2026-08-30T08:00:00.000Z",
    websiteTitle: "The AI Agent Dilemma",
    websiteUrl: "https://themayursinha.com/architecture/2026/05/03/the-ai-agent-dilemma-why-we-are-outsourcing-our-reality/",
    xDraftId: "2091846496362659840",
  },
  {
    id: 212432521,
    title: "The Blind King's Court",
    subtitle: "He could hear every warning, see every consequence through others, and still could not say no.",
    slug: "the-blind-kings-court",
    source: "/home/mayur/code/blog/_drafts/the-blind-kings-court-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/5ece3da9-16e9-4ee5-9b7b-cd35d3a81fb2_1536x1024.png",
    substackSlug: "the-blind-kings-court",
    substackState: "scheduled",
    substackDate: "2026-09-06T08:00:00.000Z",
    websiteTitle: "The Blind King's Court",
    websiteUrl: "https://themayursinha.com/architecture/2026/08/19/the-blind-kings-court/",
  },
  {
    id: 212438151,
    title: "How to Study Based on How Memory Works",
    subtitle: "Rereading creates fluency. Durable learning begins when you try to retrieve.",
    slug: "how-to-study-based-on-how-memory-works",
    source: "/home/mayur/code/blog/_drafts/how-memory-works-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/2d83d32d-fa78-414e-9dfb-b7b778368212_1536x1024.png",
    substackSlug: "how-to-study-based-on-how-memory",
    substackState: "scheduled",
    substackDate: "2026-09-13T08:00:00.000Z",
    websiteTitle: "How to Study",
    websiteUrl: "https://themayursinha.com/architecture/2021/07/14/How-to-Study/",
  },
  {
    id: 212460991,
    title: "What Happens When AI Agents Discover Each Other?",
    subtitle: "A shared package manager became a message board, and isolated machines began behaving like a society.",
    slug: "what-happens-when-ai-agents-discover-each-other",
    source: "/home/mayur/code/blog/_drafts/agents-discover-each-other-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/ee7eb5de-94ee-464f-b310-11e28feddd89_1615x974.png",
    substackSlug: "what-happens-when-ai-agents-discover",
    substackState: "scheduled",
    substackDate: "2026-09-20T08:00:00.000Z",
    websiteTitle: "The Agents Built a Message Board",
    websiteUrl: "https://themayursinha.com/architecture/2026/08/08/the-agents-built-a-message-board/",
  },
  {
    id: 212285921,
    title: "The Epicurean Paradox Is Airtight Against the Wrong God",
    subtitle: "Advaita Vedanta does not answer it. It dissolves the frame.",
    slug: "the-epicurean-paradox-is-airtight-against-the-wrong-god",
    source: "/home/mayur/code/blog/_drafts/substack-live-revamps/resolving-the-epicurean-paradox.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/96525960-9574-4456-beb5-91400b81128b_1536x1024.png",
    substackState: "draft",
    substackDate: null,
    websiteTitle: "Resolving the Epicurean Paradox",
    websiteUrl: "https://themayursinha.com/posts/2023-07-23-Epicurean-paradox/",
  },
  {
    id: 212433500,
    title: "Nietzsche and Advaita Vedanta",
    subtitle: "One asks you to create yourself. The other asks who is doing the creating.",
    slug: "nietzsche-and-advaita-vedanta",
    source: "/home/mayur/code/blog/_drafts/nietzsche-advaita-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/c0ac6834-c39a-437d-b116-6106d175ac06_1536x1024.png",
    substackState: "draft",
    substackDate: null,
    websiteTitle: "Nietzsche and Vedanta",
    websiteUrl: "https://themayursinha.com/architecture/2023/12/31/Nietzsche-and-Vedanta/",
  },
  {
    id: 212437243,
    title: "Epistemic Security for AI Agents",
    subtitle: "An agent can obey every permission and still corrupt how an organization understands reality.",
    slug: "epistemic-security-for-ai-agents",
    source: "/home/mayur/code/blog/_drafts/epistemic-security-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/7b0e9c7e-452b-4aeb-9122-13796a3c1787_1610x977.png",
    substackState: "draft",
    substackDate: null,
    websiteTitle: "Epistemic Security for AI Agents",
    websiteUrl: "https://themayursinha.com/architecture/2026/05/04/epistemic-security-the-missing-control-plane-for-ai-agents/",
  },
  {
    id: 212437718,
    title: "Man Is a Machine",
    subtitle: "A complete map of the mechanism may still leave out what it feels like to be the mechanism.",
    slug: "man-is-a-machine",
    source: "/home/mayur/code/blog/_drafts/man-is-a-machine-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/e654da07-0004-49ab-86e1-9e44cd362d66_1536x1024.png",
    substackState: "draft",
    substackDate: null,
    websiteTitle: "Man Is a Machine",
    websiteUrl: "https://themayursinha.com/architecture/2023/07/09/Man-is-a-machine/",
  },
  {
    id: 212460995,
    title: "Taste Is the Last Human Bottleneck",
    subtitle: "When machines can generate the code, judgment becomes the scarce part of engineering.",
    slug: "taste-is-the-last-human-bottleneck",
    source: "/home/mayur/code/blog/_drafts/taste-human-bottleneck-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/152b4fcc-96d3-437f-8c22-8bbadee1fd7f_1614x975.png",
    substackState: "draft",
    substackDate: null,
    websiteTitle: "Vibe Engineering",
    websiteUrl: "https://themayursinha.com/architecture/2025/10/10/vibe-engineering/",
  },
  {
    id: 212460987,
    title: "The Moral Failure of Perfect Arithmetic",
    subtitle: "Thanos did not fail because he took scarcity seriously. He failed because he treated living beings as variables in a clean equation.",
    slug: "the-moral-failure-of-perfect-arithmetic",
    source: "/home/mayur/code/blog/_drafts/moral-failure-perfect-arithmetic-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/e43fef8b-2a28-4b05-9d79-1de1070f34d6_1607x979.png",
    substackState: "draft",
    substackDate: null,
    websiteTitle: "Was Thanos Right?",
    websiteUrl: "https://themayursinha.com/architecture/2023/07/07/Was-Thanos-Right/",
  },
  {
    id: 212460980,
    title: "The Engineers Didn't Finish the Job",
    subtitle: "A creator's intention is not a control. We inherit systems through their behavior, not their promises.",
    slug: "the-engineers-didnt-finish-the-job",
    source: "/home/mayur/code/blog/_drafts/engineers-didnt-finish-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/cde15912-a6d7-4ef5-a7f8-84ddc3905a33_1612x976.png",
    substackState: "draft",
    substackDate: null,
    websiteTitle: "The Engineers Didn't Finish the Job",
    websiteUrl: "https://themayursinha.com/architecture/2026/08/02/the-engineers-didnt-finish-the-job/",
  },
  {
    id: 212460977,
    title: "Why Grinding Is a Self-Inflicted DDoS",
    subtitle: "Hard work inside the wrong system does not create leverage. It only increases someone else's throughput.",
    slug: "why-grinding-is-a-self-inflicted-ddos",
    source: "/home/mayur/code/blog/_drafts/grinding-ddos-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/490ce972-2c9f-41e7-a03d-f3c3b7835683_1615x974.png",
    substackState: "draft",
    substackDate: null,
    websiteTitle: "Why Grinding Is a Self-Inflicted DDoS",
    websiteUrl: "https://themayursinha.com/architecture/2026/05/09/privilege-escalation-in-the-payoff-matrix/",
  },
  {
    id: 212460970,
    title: "Can a Group Think Without Turning It Into a Debate?",
    subtitle: "The Socratic dialogue is slow, demanding, and built around a radical rule: nobody gets left unconvinced.",
    slug: "can-a-group-think-without-turning-it-into-a-debate",
    source: "/home/mayur/code/blog/_drafts/socratic-dialogue-substack.md",
    cover: "https://substack-post-media.s3.amazonaws.com/public/images/0bfb45c8-8339-4865-8bc7-0e79dbbcaeac_1607x979.png",
    substackState: "draft",
    substackDate: null,
    websiteTitle: "The Socratic Dialogue",
    websiteUrl: "https://themayursinha.com/architecture/2021/07/12/Socratic-dialogue/",
  },
];

function stripFrontMatter(text) {
  return text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
}

function stripHero(text) {
  return text.replace(/^\s*!\[[^\]]*\]\(https?:\/\/[^)]+\)\s*\n+/, "");
}

function stripOldFooter(text) {
  let furtherReading = "";
  const further = text.match(/\nFurther reading:\s*[\s\S]*$/);
  if (further) furtherReading = further[0].trim();
  text = text.replace(/\n---\s*\n\s*(?:Originally|First) published[\s\S]*$/i, "");
  text = text.replace(/\n(?:Originally|First) published[^\n]*(?:\n|$)[\s\S]*$/i, "");
  return { body: text.trim(), furtherReading };
}

function quote(value) {
  return JSON.stringify(value);
}

function atomicWrite(path, value) {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, value, { mode: 0o600 });
  renameSync(temporary, path);
}

const manifest = {
  publication: "Seeking Singularity",
  x_account: "@themayursinha",
  prepared_at: new Date().toISOString(),
  items: [],
};

for (const item of items) {
  const substackUrl = item.substackSlug
    ? `https://mayursinha.substack.com/p/${item.substackSlug}`
    : null;
  const manuscriptPath = join(outputDir, `${item.slug}.md`);
  const coverPath = join(assetDir, `${item.slug}-cover.png`);

  if (!item.xDraftId) {
    const source = readFileSync(item.source, "utf8");
    const cleaned = stripOldFooter(stripHero(stripFrontMatter(source)));
    const footer = substackUrl
      ? `First published in [Seeking Singularity](${substackUrl}). An earlier version appeared as [${item.websiteTitle}](${item.websiteUrl}) on themayursinha.com.`
      : `An earlier version appeared as [${item.websiteTitle}](${item.websiteUrl}) on themayursinha.com.`;
    const extra = cleaned.furtherReading ? `\n\n${cleaned.furtherReading}` : "";
    const frontMatter = [
      "---",
      `title: ${quote(item.title)}`,
      `subtitle: ${quote(item.subtitle)}`,
      "platform: x-article",
      "status: draft",
      `source_substack_id: ${item.id}`,
      `source_substack_url: ${quote(substackUrl || "")}`,
      `canonical_link_status: ${substackUrl ? "confirmed" : "pending-until-substack-scheduling"}`,
      `cover_image: ${quote(item.cover)}`,
      "---",
      "",
    ].join("\n");
    atomicWrite(manuscriptPath, `${frontMatter}${cleaned.body}${extra}\n\n---\n\n${footer}\n`);
  }

  if (basename(manuscriptPath) !== "the-ai-agent-dilemma.md") {
    const response = await fetch(item.cover, { redirect: "follow" });
    if (!response.ok) throw new Error(`Cover download failed for ${item.title}: ${response.status}`);
    atomicWrite(coverPath, Buffer.from(await response.arrayBuffer()));
  }

  manifest.items.push({
    title: item.title,
    source_path: manuscriptPath,
    cover_path: coverPath,
    cover_url: item.cover,
    substack_id: item.id,
    substack_editor_url: `https://mayursinha.substack.com/publish/post/${item.id}`,
    substack_url: substackUrl,
    canonical_link_status: substackUrl ? "confirmed" : "pending-until-substack-scheduling",
    substack_state: item.substackState,
    substack_date: item.substackDate,
    x_draft_id: item.xDraftId || null,
    x_editor_url: item.xDraftId
      ? `https://x.com/compose/articles/edit/${item.xDraftId}`
      : null,
    x_state: item.xDraftId ? "draft" : "pending-creation",
    verified_at: item.xDraftId ? "2026-08-24T00:00:00.000Z" : null,
  });
}

atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ manifest: manifestPath, items: manifest.items.length, existing_x_drafts: manifest.items.filter((item) => item.x_draft_id).length, pending_x_drafts: manifest.items.filter((item) => !item.x_draft_id).length }, null, 2));
