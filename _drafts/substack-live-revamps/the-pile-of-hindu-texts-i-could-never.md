![A reader among stacks of Hindu texts as scattered pages become a connected, searchable library.](https://substack-post-media.s3.amazonaws.com/public/images/41a36e2d-31d8-4112-b9e9-a925c1e73777_1536x1024.png)

I grew up with these texts around me and could never read them the way they deserved to be read.

The Vedas, Upanishads, Puranas, Ramayana, Mahabharata, Geetas, Tantra, and Mantra had accumulated as PDFs in Hindi, Sanskrit, and English. I had hundreds of books. But finding one idea across them meant remembering which volume might contain it, locating the file, opening it, and often reading scanned pages one by one.

The collection looked like a library from the outside, but in use it was still a pile.

I wanted to turn it into a searchable corpus that I could annotate, connect, compare, and explore inside my own knowledge system. OCR led to the more interesting discovery: a machine-readable document can still misrepresent what a human can plainly see.

## First principles: what is actually inside a PDF?

A PDF can represent a page in two ways. It may contain a scanned image, where the visible words are only pixels. Or it may contain a hidden text layer alongside the page image. That layer lets software search and copy the page without OCR.

But a text layer can exist and still be wrong. The visible page may show one set of glyphs while its internal Unicode mapping points to different characters. This is especially common in older Devanagari PDFs. The file looks searchable to a PDF tool; its extracted text is unusable.

For example, the Hindi phrase **ईश्वरीय व्यवस्था** means “divine order.” One extractor returned `bZ'ojh; O;oLFkk` instead. The PDF technically contained text. It did not contain usable text.

![A broken Devanagari text layer beside usable OCR Hindi.](https://substack-post-media.s3.amazonaws.com/public/images/39b006a6-bb98-4ffb-9665-ffd5e9208e3b_1200x560.png)

*A broken text layer can return characters while still making the page impossible to search.*

That changed the central question. I was not asking whether a PDF contained text. I was asking whether the extracted representation was usable.

## From PDF to searchable note

The pipeline answers a sequence of narrower questions:

1. Inventory the source collection and remove duplicates.
2. Inspect each PDF for embedded text or scanned imagery.
3. Extract embedded text when it exists.
4. Audit the output instead of trusting the PDF classification.
5. Render and OCR pages whose text is empty, corrupted, or linguistically implausible.
6. Reassemble the pages into deterministic Markdown while retaining source and page provenance.
7. Place the notes into Obsidian so they can be searched, linked, and studied beside my annotations.

In simplified form:

```
if the PDF has embedded text:
    extracted = extract_text(PDF)
    if the representation looks usable:
        keep extracted text
    else:
        render pages and run OCR
else:
    render pages and run OCR

rebuild pages into Markdown
preserve source and page provenance
```

OCR serves as a fallback when the cheaper representation fails an output-quality check.

## The second gate was a heuristic, not a verdict

For Devanagari-heavy books, the quality audit looked at broad language signals: how much Devanagari appeared, how many suspicious Latin-like fragments appeared inside words, and whether the output contained enough actual book content to be useful.

In one run, the audit routed 45 of 121 candidates to OCR. I initially read that as 45 broken text layers, which turned out to be wrong.

![A two-gate architecture: inspect the PDF, then audit the extracted representation.](https://substack-post-media.s3.amazonaws.com/public/images/023bc8a8-b19c-43eb-8618-da0be17bbda8_1200x620.png)

*The useful architecture is a cheap first probe followed by an audit of the representation readers will actually use.*

Almost all of those 45 were English-language books: Gita commentaries, English Puranas, Woodroffe’s Tantra material, and essays by Swami Krishnananda. English apostrophes inside words increased the suspicious-pattern count. The heuristic confused normal English with broken Hindi.

One book really was bad, but for another reason. A Ramakrishna Math Kenopanishad produced little more than metadata and almost no body text. That was an empty extraction, not a language mismatch.

The lesson was simple: **a filter is evidence, not a judgment handed down by the machine.**

## The gate could also miss bad books

The quality rule used an OR condition. A book could pass if either its Devanagari ratio was high enough or its suspicious-pattern count was low enough.

That created the opposite failure. *Bhagavad-gita As It Is* passed at roughly 3.3% Devanagari while containing more than ten thousand suspicious fragments. One acceptable ratio let it through even though the output still needed serious inspection.

The system could over-route good books and under-route bad ones. That did not make the pipeline useless. It meant the detector had to remain a corpus-dependent heuristic, with human review for important texts.

## Even the labels could mislead

The manifest recorded 77 books as clean according to the latest inspection. But 32 of those also had OCR page files.

The explanation was history. A book could first be classified as broken and sent through OCR. When the pipeline resumed later, the improved Markdown already existed. The resumed run inspected that new state and relabeled the book as clean.

The label described the latest observation. It did not necessarily describe the original source PDF.

This is a general systems lesson: a manifest often records what a system believed at a particular time, not ground truth about the thing being measured.

## What the numbers mean

There were 126 source candidates. Five were duplicates, leaving 121 audited books. Seventy-six were considered clean and 45 were routed to OCR. A separate Debroy record brought the clean import count to 77.

The final corpus contained 227 books: 77 clean imports, 146 OCR imports, and 4 manifest skips.

Those numbers describe what the pipeline processed. They do not describe the completeness of the Hindu tradition, or even the completeness of my collection.

The corpus spans the Vedas, Upanishads, Puranas, Ramayana, Mahabharata, Geetas, Tantra, Mantra, Geeta Press, astrology, Adhyatma, and other areas. But its coverage is uneven. One Geeta Press folder still contains 104 PDFs with zero manifest records. An astrology folder contains 27 PDFs but only three imported source files.

Calling those collections covered would hide the unprocessed piles inside them.

## Why I wanted this

The engineering was interesting, but it was never the real reason for the project.

I want to ask questions across texts. What do different Upanishads say about consciousness? How does one commentary interpret Atman compared with another? Where does the idea of Brahman change across schools? How does a concept appear in Vedanta compared with Tantra? Where do texts disagree, and where do they unexpectedly echo questions from philosophy, cognitive science, physics, or artificial intelligence?

I rarely want only one book. I want the connections between books.

A traditional library is organized around documents. My curiosity is organized around questions. Searchability does not replace reading, but it makes reading navigable.

## The human boundary

The pipeline can scale classification, extraction, OCR, reconstruction, and organization. It cannot guarantee that every OCR character is correct, that every language heuristic generalizes, or that the final corpus is intellectually representative.

For important books, I still want a human to compare the page and the output. That boundary makes the automation more trustworthy.

**Use machines for scale. Use humans for judgment.**

The rule I keep returning to is this: **trust the representation, not the metadata.** A PDF can claim it has text and still be unreadable. A detector can confidently classify a book while hiding assumptions you have not discovered. A corpus can contain hundreds of books while leaving entire areas untouched.

The check has to look at the thing you actually intend to use.

The pile is much closer to a library than it was. There are now 227 searchable books where there used to be hundreds of isolated files. But there are still broken texts to fix, heuristics to improve, folders to import, and parts of the tradition I have barely touched.

I do not mind that. There is always another text, another connection, and another question.
