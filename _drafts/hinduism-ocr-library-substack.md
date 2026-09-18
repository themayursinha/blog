---
layout: post
title: "I Almost OCR'd 227 Hindu Texts. A Third Didn't Need It."
subtitle: "The ones that looked like they had a text layer were the dangerous ones. A two-gate classify step is the difference between a weekend and a month."
date: 2026-08-21
categories: [ai, engineering, hinduism]
tags: [ocr, obsidian, hinduism, knowledge-management, tesseract, pdf, ai, devanagari]
description: "I nearly ran Tesseract on 227 Hindu PDFs. About a third already had a clean text layer and skipped OCR entirely. The dangerous third looked like they had one, and extracted as garbage until a second check caught them. Here is the pipeline that classifies first and OCRs only what is actually a scan."
published: false
---

# I Almost OCR'd 227 Hindu Texts. A Third Didn't Need It.

I almost ran Tesseract on 227 Hindu PDFs. About a third already had a clean text layer and needed no OCR at all. The dangerous third looked like they had one too, and extracted as garbage until a second check caught them.

So I built a pipeline that classifies first, OCRs only what is actually a scan, and drops the lot into Obsidian as a searchable, cross-linked library. This is how it works, the mistake that nearly cost me a month, and the honest caveats of Devanagari OCR.

## The project

I gathered 237 source PDFs (Vedas, Upanishads, Puranas, Ramayana and Mahabharata including the full Bibek Debroy 10-volume translation, Geetas, Tantra, Mantra, and Geeta Press editions), processed 227 of them, and skipped 4 as duplicates or corrupt.

The pipeline:

1. **Collect**: PDFs filed by category (Vedas, Upanishad, Puranas, Ramayana/Mahabharata, Geetas, Tantra, Mantra, Geeta Press, Adhyatma)
2. **Classify**: probe each PDF for a text layer; clean digital books skip OCR entirely, everything else goes to OCR
3. **OCR**: Tesseract with Hindi + English language packs, 16 workers, 200 DPI, resumable across books
4. **Import**: convert each book to clean Markdown, split big books (over 800KB) into indexed parts, wire everything into Obsidian with a Map of Content
5. **Search**: every word of every text is now searchable, linkable, and quotable

## The mistake that taught me the real lesson

The first classify pass was naive: run `pdf-inspector --detect`, if it says "text_based", skip OCR. About 126 books were classified text_based. The problem: a broken Devanagari ToUnicode map in a PDF makes the extractor *think* there is a text layer, and what comes out is mangled Latin instead of Devanagari.

The pipeline note has the example: ईश्वरीय व्यवस्था ("divine order") extracted as `bZ'ojh; O;oLFkk`. My script's heuristic flagged that: a Devanagari ratio under 1% with more than 10 mangled-Latin hits (apostrophes and semicolons inside words) means the "text layer" is garbage, so route it to Tesseract anyway.

That second gate caught roughly 76 of the 126 "text_based" files and forced them through OCR. Final split: 77 clean skips, 146 Tesseract, 4 skipped, 227 processed. Without that audit, the worst files would have stayed mangled and unreadable.

## The numbers

| Metric | Value |
|---|---|
| Source PDFs | 237 |
| Books fully processed | 227 |
| Clean text layer, skipped OCR | 77 |
| OCR'd (scans + mangled text_based) | 146 |
| Skipped (duplicates/corrupt) | 4 |
| Library size | ~237 MB of searchable text |
| Obsidian notes | 416 (indexes + part files) |
| OCR engine | Tesseract (hin+eng), 16 workers, 200 DPI |

## What it unlocked

The library is now one vault with one search. Instead of remembering which of 227 volumes contains a verse, you search the whole thing in one local query. The Upanishads, the Geetas, and the Mahabharata are book-level links in the same graph, and the Map of Content gives each tradition a landing page.

Because the library is structured text, I could build an AI assistant that answers questions from the corpus itself, grounded in the actual texts rather than a model's vague memory of Hinduism. Any new book dropped into the source folder flows through the same pipeline. The library grows.

## What I learned

Probe before you OCR, but trust the probe less than you want to. A text layer is not the same as extractable Devanagari. The two-gate audit (Devanagari ratio plus mangled-Latin count) is what separates a working library from a pile of silently broken files.

Hindi and English OCR is imperfect but usable. You get non-breaking spaces between words and the occasional broken word, svabhiiva instead of svabhava, and you learn to grep around them. Big books need splitting, books over 800KB become index notes plus part files so no single note is unwieldy. Deterministic rebuild beats hand-editing: the importer rebuilds the whole library from the OCR output tree, so you never hand-edit generated notes. Duplicates are everywhere, a manifest keeps the import honest.

## Why this matters

There is a line from a recent discussion that stuck with me: more than four thousand years of continuous literary tradition, and even reading half of it gives you a distinct and divergent mind. The question was whether this generation is aware of the privilege.

My answer is that the real problem is not awareness, it is access. The texts exist. The plumbing did not. A generation of Indians raised on search and autocomplete will not read what it cannot search. The fix is tooling: OCR, structure, index, cross-link, and an AI that can navigate the corpus.

Build the access layer, and the readers follow.

---

*Technically: Python, pymupdf, pdf-inspector, Tesseract OCR (hin+eng), Obsidian, deterministic Markdown importer, AI scholar bot grounded in the corpus. All personal use, on my own hardware, not distributing the files.*

*If you are building something similar, a personal library, an archive, a cultural corpus, the same pipeline works for any scanned collection. Reply and I will send the classify heuristic.*
