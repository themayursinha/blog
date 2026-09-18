---
title: "Building a Searchable Library of 668 Hindu Texts: An OCR + Obsidian Pipeline"
date: 2026-08-20
type: blog-post
status: draft
tags:
  - hinduism
  - ocr
  - obsidian
  - ai
  - knowledge-management
  - devtools
---

# Building a Searchable Library of 668 Hindu Texts

## The problem

India has one of the most extraordinary literary inheritances on Earth — the Vedic corpus, the Upanishads, the Puranas, the Ramayana and Mahabharata, the Geetas, thousands of years of Tantra and Mantra literature. But most of it lives in **scanned PDFs, scattered across archives, in multiple languages, with no search, no index, no way to actually read across the corpus.**

For a generation that grew up with instant access to everything, that's the real barrier. Not arrogance — **entry cost.** The texts are locked behind the plumbing.

So I built the plumbing.

## The project

I gathered **728 Hindu texts** — from the Vedas to the Mahabharata (including the full Bibek Debroy 10-volume translation), Upanishads, Puranas, Geetas, Tantra, Mantra, Sant Samaj, Tulsidas, and Geeta Press editions — and turned **668 of them** into a **fully searchable, cross-linked knowledge base.**

The pipeline:

1. **Collect** — 728 PDFs filed by category (Vedas, Upanishad, Puranas, Ramayana/Mahabharata, Geetas, Tantra, Mantra, Geeta Press, Adhyatma, Sant Samaj, Vyasa and more)
2. **Classify** — probe each PDF for a text layer; clean digital books skip OCR entirely, scanned books go to OCR
3. **OCR** — Tesseract with Hindi + English language packs, CPU-parallel, resumable across books
4. **Import** — convert each book to clean Markdown, split big books (>800KB) into indexed parts, wire everything into Obsidian with a Map of Content (MOC)
5. **Search** — every word of every text is now grep-able, linkable, and quotable

Scope note: **Jyotish (Vedic astrology) was deliberately excluded** — this is a library of scripture, philosophy, and commentary, not predictive material.

## The numbers

| Metric | Value |
|---|---|
| Texts tracked | 728 PDFs |
| Texts downloaded | 712 (13 unavailable at source, 3 duplicate copies skipped) |
| Books processed | 668 |
| Scanned books OCR'd with Tesseract (hin+eng) | 385 |
| Books that already had a digital text layer | 283 |
| Searchable text | ~847 MB |
| Obsidian notes | 1,244 (668 book notes + 575 part files + Map of Content) |
| Languages | Hindi + English (+ Sanskrit where OCR allows) |
| OCR engine | Tesseract (hin+eng) + pdf-inspector |
| Pipeline | Python, pymupdf, deterministic rebuild |

## What it unlocked

**Search across the entire corpus.** Instead of remembering which of 600+ volumes contains a verse, you search the whole library in milliseconds.

**Cross-linking.** The Upanishads, the Geetas, and the Mahabharata are now nodes in one graph — you can follow a concept across traditions.

**A Veda scholar bot.** Because the library is structured text, I could build an AI assistant that answers questions *from the corpus itself* — grounded in the actual texts, not from a model's vague memory of Hinduism.

**A repeatable pipeline.** Any new book dropped into the source folder flows through classify → OCR → import → searchable. The library grows.

## What I learned

- **Probe before you OCR.** Millions of chars of text layer = clean digital book, skip OCR entirely. Near-zero = scanned, send to Tesseract. This split saved enormous compute: 283 of 668 books never touched an OCR engine.
- **Batch and cool down.** The download stage ran as bounded batches with a cooldown, so a quota failure on one file could never starve the rest. Acquisition is the slow, failure-prone part — treat it like a network protocol, not a loop.
- **Hindi + English OCR is imperfect but usable.** Non-breaking spaces between words and the occasional broken word (svabhiiva instead of svabhava) are artifacts you learn to grep around.
- **Big books need splitting.** Books >800KB become index notes + part files, so no single note is unwieldy.
- **Deterministic rebuild > hand-editing.** The importer rebuilds the library from the OCR output tree. Never hand-edit imported notes — they're generated.
- **Duplicates are everywhere — and one trailing space can break idempotency.** The source corpus had `(1)` copies and stray files, so a manifest keeps the import honest. But my own importer had a subtler bug: eleven source directories had a **trailing space in the folder name**. The importer wrote that path into each note but read it back trimmed, so it never recognised its own output and re-imported those eleven books **on every run** — 4,395 duplicate notes over three weeks before I caught it. The library still worked; the search results just got noisier every half hour. Normalising both sides of the comparison fixed it, and the importer now reports `imported=0` on a complete library. Trust, but verify idempotency: run the thing twice and check the second run does nothing.
- **A monitor that only says "done" is not a monitor.** My completion check counted files on disk and happily printed `FULLY-DONE` while thousands of junk notes sat in the vault. Counting the output of a pipeline is not the same as validating its contents.

## Why this matters

There's a line from a recent discussion that stuck with me: *"More than four thousand years of continuous literary tradition... Even reading half of them will give you a distinct and divergent mind."* The question was whether this generation is aware of the privilege.

My answer is that the real problem isn't awareness — it's access. **The texts exist. The plumbing didn't.** A generation of Indians raised on search and autocomplete won't read what it can't search. The fix is tooling: OCR, structure, index, cross-link, and an AI that can navigate the corpus.

Build the access layer, and the readers follow.

---

*Technically: Python · pymupdf · Tesseract OCR (hin+eng) · pdf-inspector · Obsidian (Tasks, Kanban) · deterministic Markdown importer · AI scholar bot grounded in the corpus. All personal use, on my own hardware.*

*If you're building something similar — a personal library, an archive, a cultural corpus — the same pipeline works for any scanned collection. Happy to share the approach.*
