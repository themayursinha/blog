---
layout: post
title: "Grok Build's Repository Snapshot Pipeline: What I Verified"
subtitle: "An independent Linux, local-evidence, and control-plane analysis of Grok Build's repository snapshot upload path."
slug: grok-build-repository-snapshot-pipeline
date: 2026-07-22 09:00:00 +0200
categories: [ai, security, architecture]
tags: [ai, security, coding-agents, grok-build, data-egress, privacy, incident-response]
description: "An independent technical review of Grok Build's repository snapshot pipeline, including Linux binary provenance, local event evidence, snapshot semantics, data controls, and the claims the evidence does not support."
share-img: /img/grok-build-egress-evidence.svg
related_posts:
  - MCP Security Is a Supply Chain Risk
  - Spec Engineering: The Missing Layer in AI Agent Security
  - Threat Modeling Autonomous AI Agents in Production
---

GitHub records [Cereblab's wire-level analysis](https://gist.github.com/cereblab/dc9a40bc26120f4540e4e09b75ffb547) as created on 10 July 2026 and updated on 14 July. The report showed two separate data paths: files read for a model turn, and a repository snapshot sent through a storage API. Its strongest artifact was a captured Git bundle that reconstructed a tracked file the agent had been told not to read.

I paid attention for a personal reason. I had used Grok Build 0.2.93 on a Linux workstation with real repositories. Instead of rerunning the client against those repositories, I logged it out, contained the local configuration, preserved the evidence, and investigated the installed binary and historical logs offline.

This article is the result. It is not a claim of discovering the issue first. Cereblab deserves that credit. My contribution is an independent review of the Linux artifacts, the local impact, the repository serializer, the available controls, and the boundary between what the evidence proves and what it does not.

A technical appendix with package hashes, source links, and a claim matrix is available [here](/research/grok-build-repository-snapshot-analysis-2026-07/).

## The short version

I ended up with four conclusions.

1. Grok Build 0.2.93 contained a first-party repository snapshot and upload pipeline. The official Linux binary on my machine matched the decompressed npm artifact exactly.
2. My local logs recorded repository snapshot construction and 84 enqueue events in total across four Git repositories. Enqueue proves local staging and queue acceptance. It does not prove that every transfer completed remotely.
3. The follow-up 0.2.99 Linux binary still contained the archive and upload implementation when inspected. Post-disclosure server flags disabled it for tested accounts, but the code had not been removed.
4. A training opt-out, a file-read deny, and a repository-egress control solve different problems. None should be treated as a substitute for the others.

The incident is serious. Overclaiming would only weaken the parts that are already well supported.

{% include figure.html src="/img/grok-build-egress-evidence.svg" label="Fig. 1 · Two data paths, five post-capability evidence levels" caption="Files explicitly read by the agent can enter the model/session channel. A separate Git-aware snapshot path can package repository state. Collection, enqueue, successful transmission, retention, and training are distinct claims." alt="Diagram of Grok Build model context and repository snapshot data paths with evidence levels" %}

## Two data paths, not one

Most cloud coding agents must send some code to a remote model. That alone is not surprising. The Grok Build evidence points to a second path: repository-state packaging and upload, separate from files the model reads.

### Path 1: model and session context

When the agent reads a file, its contents can enter the model request and session-state machinery. Cereblab's controlled test used synthetic canary values and captured them in the model request and a session-state archive.

My historical transcript showed the same class of exposure on a real workstation. One session explicitly read a local environment file and a configuration file. A historical secret value appeared unredacted in the transcript. That value was no longer accepted, and no current credential matched the preserved transcript.

This evidence proves a file was read into the agent's context. It does not, by itself, prove every server-side retention or downstream-use claim.

### Path 2: repository-state snapshots

The repository path is not limited to files the model opens. The client contains a Git-aware serializer and upload coordinator. Embedded source paths and command strings show logic for:

- commits and history;
- staged and unstaged changes;
- untracked, non-ignored files;
- supplemental and content-addressed blobs;
- before and after codebase phases;
- queueing and storage under `grok-code-session-traces`.

The phrase "it uploads `.git/`" is too imprecise. The evidence supports a Git bundle or structured repository-state representation containing Git objects and history. It does not establish a byte-for-byte copy of the `.git` directory inside a generic tarball.

The distinction matters in practice. A Git bundle can reconstruct tracked files and history without copying the `.git` directory as a filesystem tree.

## What the local evidence showed

The installed client was Grok Build 0.2.93. The resolved Linux x64 executable had this SHA-256 hash:

```text
4e0738d3b5550f3c842bc0ae69f468815c6329c008a110d0c27a694dc3401135
```

It matched the decompressed executable from xAI's official npm package for 0.2.93.

The sanitized historical event counts were:

| Event | Count | What it proves |
|---|---:|---|
| `trace.upload.decision` | 79 | The client evaluated whether to upload trace data |
| Decisions enabling upload | 76 | Upload was enabled for most recorded decisions |
| `repo_state.upload.start` | 130 | Repository collection started |
| `repo_state.upload.enqueued` | 84 | A snapshot entered the local upload queue |
| Git repositories with enqueued snapshots | 4 | The behavior affected multiple real repositories |

The enablement source was usually recorded as `remote`.

There were also 46 unmatched `upload.start` events. They corresponded to non-Git roots and produced no matching enqueue. This matters because one of the early public claims treated a start event against a home directory as proof that the entire home directory had uploaded. My local evidence does not support that conclusion.

A start is not an enqueue. An enqueue is not an HTTP 200. An HTTP 200 is not proof of a particular retention period. Storage is not proof of training.

## What the public wire evidence adds

Cereblab's public work bridges evidence levels that my local logs cannot.

The published reproduction contains Git bundles claimed to be exact `/v1/storage` request bodies. I verified that the bundles are structurally valid, contain complete Git history, and include a tracked canary file that the transcript says the agent was denied permission to read. Another bundle excluded a never-tracked, ignored `.env` file.

That verifies the bundle contents and the difference between model-read permission and Git tracking. The public repository does not include a matching raw mitm flow that cryptographically binds those exact bundle bytes to the HTTP request. The HTTP provenance therefore still depends on the researcher's capture account.

The accompanying wire report adds transmission-level proof. It records successful storage requests, including a captured Git bundle accepted with HTTP 200. In a larger run, at least 5.10 GiB of `/v1/storage` request traffic was captured before the researcher stopped the test mid-stream. This does not prove that the full 12 GB test repository completed. The 12 GB figure was the repository's size, not a verified aggregate upload limit.

The combined evidence is serious, but each artifact should carry only the claim it can support.

## The capability remained in 0.2.99

I also inspected the official Linux x64 artifact for Grok Build 0.2.99. Its decompressed SHA-256 was:

```text
9fccba400d3808ec34a991892096b34c6f5846b2b118d355001601fd5428445c
```

The binary retained the first-party archive, queue, GCS, and repository-change implementation. This does not mean every account was still uploading. It means the capability remained in the shipped client.

After public disclosure, the same 0.2.93 client received different remote settings in Cereblab's testing: `trace_upload_enabled` became false and `disable_codebase_upload` became true. Six same-client retests produced no observed `POST /v1/storage` Git-bundle upload. That is evidence of a remote or fleet-level pause for those tests. It is not proof that the feature was removed or permanently disabled for every account.

xAI later [stated publicly](https://x.com/SpaceXAI/status/2076692402442846289) that Grok Build users could change data-retention settings through `/privacy`, and [said that previously synced data would be deleted](https://x.com/SpaceXAI/status/2076696092037833091). I have requested account-specific access, restriction, deletion, and training opt-out through xAI's privacy portal. At the time of writing, server-side deletion and its exact scope have not been independently confirmed for my account.

## The controls were fragmented

Three local controls were visible in the client:

```toml
[features]
telemetry = false

[telemetry]
trace_upload = false

[harness]
disable_codebase_upload = true
```

The strongest codebase-specific control is `harness.disable_codebase_upload = true`. [Harbor PR 2309](https://github.com/harbor-framework/harbor/pull/2309), authored with an xAI-associated identity, documents that the local disable is OR-combined with the remote disable. Under Harbor's interpretation, local `true` cannot be remotely re-enabled for that path. Treat this as third-party implementation guidance unless xAI confirms it in official documentation.

I would still set all three values. They govern different parts of the pipeline, and the public evidence does not establish that `trace_upload = false` alone blocks every repository archive path.

When I checked xAI's public settings reference, these controls were absent. The reference documented `GROK_RESPECT_GITIGNORE`, but that setting applied to search and read tools. It was not documented as a repository-upload control.

This is where model-read permissions and repository upload behavior diverged. A permission that stops the model from reading a file does not necessarily stop a system-level serializer from packaging tracked history. A training preference does not necessarily stop operational transmission or storage. An account-side or remote setting is not the same as a locally enforced veto.

## What I am not claiming

This investigation does not prove that:

- xAI trained a model on my repositories or credentials;
- every one of the 84 local enqueue events completed remotely;
- an entire home directory was uploaded as one snapshot;
- a literal `.git` directory was copied into every archive;
- every ignored `.env` or secret file was included;
- current credentials were exposed or abused;
- the post-disclosure server-side disable is global or permanent;
- deleting a visible conversation removes every repository blob, replica, backup, or derived dataset.

These are not rhetorical disclaimers. They are the boundary that keeps the report useful.

## The security control that was missing

Coding-agent permissions are usually presented as model permissions: may the agent read this file, call this tool, or execute this command?

The Grok Build incident shows a wider control problem. A trustworthy coding agent needs separate authority for at least four actions:

1. Read a file into model context.
2. Package repository state or history.
3. Send that package to a named destination for a declared purpose.
4. Retain, reuse, or delete the resulting server-side data.

Those decisions should not collapse into one account setting. They need local enforcement, visible scope, destination binding, byte and file-class limits, and an audit record that says what left the machine.

A remote feature flag should never be able to widen local data authority without an explicit local approval. The model may need context to help, but the client still needs a deterministic egress boundary.

Agent security cannot stop at tool-call authorization. It must govern data movement by source, destination, purpose, sensitivity, and history. That gap is what I have been targeting with [MCP Visor](https://github.com/themayursinha/mcp-visor) on MCP tool calls; Grok Build shows the same class of problem on repository egress.

## What users should do now

If Grok Build has touched sensitive repositories, do not infer safety from a training opt-out alone.

- Preserve logs and configuration before changing them.
- Do not publish raw transcripts or credentials while reporting the issue.
- Apply a local codebase-upload veto and disable telemetry and trace upload.
- Use the vendor's privacy process to request access, deletion, restriction, and confirmation of scope.
- Rotate a credential only when evidence shows exposure or when its risk justifies the operational cost.
- Test coding agents against synthetic repositories before allowing them onto trusted workstations.

I have kept the local client logged out. Any future testing will use a disposable environment with synthetic canaries and no real repository or credential mounts.

## Credit and disclosure

Cereblab performed the original wire-level investigation and published the reproduction artifacts. This article independently reviewed those artifacts, inspected the official Linux packages, and investigated local historical evidence from my own machine.

Before publication, this draft will be provided to xAI for factual correction through its published security contact. The publication version will record the date of that notice and any response that changes the technical record.

Package provenance, the claim matrix, and source links are in the appendix linked near the beginning of this article.
