---
layout: page
title: "Grok Build Repository Snapshot Analysis, July 2026"
subtitle: "Sanitized evidence appendix"
permalink: /research/grok-build-repository-snapshot-analysis-2026-07/
---

This appendix supports the article [Grok Build's Repository Snapshot Pipeline: What I Verified](/architecture/2026/07/22/grok-build-repository-snapshot-pipeline/). It contains only sanitized evidence and public references. It does not include credentials, repository names, account identifiers, raw transcripts, session IDs, private storage paths, or proprietary binaries.

## Scope

- Incident client: Grok Build 0.2.93 on Linux x64.
- Follow-up artifact: Grok Build 0.2.99 on Linux x64.
- Local review: historical logs and transcript metadata from the author's own workstation.
- Static review: official npm package artifacts, inspected without executing the client against real data.
- Public corroboration: Cereblab's wire analysis and reproduction repository.
- No production endpoint testing was performed as part of the independent Linux review.

## Package provenance

| Version | Official package | Decompressed Linux x64 SHA-256 |
|---|---|---|
| 0.2.93 | [`@xai-official/grok-linux-x64` 0.2.93](https://registry.npmjs.org/@xai-official/grok-linux-x64/-/grok-linux-x64-0.2.93.tgz) | `4e0738d3b5550f3c842bc0ae69f468815c6329c008a110d0c27a694dc3401135` |
| 0.2.99 | [`@xai-official/grok-linux-x64` 0.2.99](https://registry.npmjs.org/@xai-official/grok-linux-x64/-/grok-linux-x64-0.2.99.tgz) | `9fccba400d3808ec34a991892096b34c6f5846b2b118d355001601fd5428445c` |

The installed 0.2.93 executable matched the decompressed official artifact exactly.

The 0.2.99 binary retained strings and source paths associated with the repository serializer, upload queue, storage client, GCS path handling, and before/after codebase snapshots. This establishes retained capability, not current activation for every account.

## Local event evidence

| Event | Sanitized count | Evidence level |
|---|---:|---|
| `trace.upload.decision` | 79 | Decision evaluated |
| Decisions with upload enabled | 76 | Upload allowed by effective settings |
| `repo_state.upload.start` | 130 | Collection started |
| `repo_state.upload.enqueued` | 84 | Local artifact accepted by upload queue |
| Git repositories with matching enqueue events | 4 | Multiple repositories affected |
| Non-Git starts with no enqueue | 46 | Start did not progress to queue acceptance |

The effective source for upload enablement was usually recorded as `remote`.

These records do not include a local packet capture or storage response. They therefore do not prove that every enqueued local object completed transmission.

## Snapshot structure

Static strings and public artifacts support a Git-aware repository-state serializer with the following inputs:

| Path class | Evidence-supported behavior |
|---|---|
| Tracked files and history | Can be represented through Git bundle, commit, and base-tree data |
| Staged changes | Patch and binary-blob paths are present |
| Unstaged changes | Patch and binary-blob paths are present |
| Untracked, non-ignored files | `git ls-files --others --exclude-standard` behavior is present |
| Ignored files | Not universally included; some agent-written paths can be force-included |
| Explicitly read files | Can enter the separate model/session channel |
| Non-Git workspaces | A separate walker exists with exclusion patterns; local start events did not prove enqueue |

The defensible wording is "Git objects and history were bundled" or "a structured repository-state archive was created." The evidence does not establish that every archive was a byte-for-byte copy of the `.git` directory.

## Two data channels

### Model and session channel

Files explicitly read by the agent can enter a model request and session-state artifacts. The public reproduction used synthetic canaries. The local historical transcript showed that a sensitive configuration file was read, but this appendix intentionally omits its path and contents.

### Repository snapshot channel

The client separately constructs before/after repository state and queues it for storage. A file-read deny does not remove tracked data from Git history and does not necessarily control this serializer.

## Claim matrix

| Claim | Verdict | Confidence and boundary |
|---|---|---|
| 0.2.93 contained repository snapshot and upload code | Verified | High, official binary and embedded first-party paths |
| Local snapshots were constructed and enqueued | Verified | High, local correlated events |
| Every local enqueue completed remotely | Not established | No local wire or storage-response evidence |
| Public reproduced bundles are valid complete-history Git bundles | Verified | High, deterministic bundle checks |
| A public bundle contains a tracked file the agent was denied permission to read | Verified | High for bundle content |
| The published bundle bytes came from the claimed HTTP request | Researcher-attributed | Public repo does not include a matching raw flow cryptographically binding body and request |
| Public wire testing observed accepted storage uploads | Reported with captured evidence | Strong public evidence from Cereblab's report |
| 12 GB is an aggregate upload maximum | Unsupported | It was the test repository size; the retained capture stopped after at least 5.10 GiB |
| Per-file limits of 1 GiB were present | Verified from public evidence | Cereblab-captured settings and the public `unified.jsonl` fixture; not independently recaptured from the author's workstation logs |
| GCS path `grok-code-session-traces` existed in the client | Verified | High, official binary strings and public metadata |
| 0.2.99 removed the uploader | False | Archive and upload implementation remained in the binary |
| Uploads were later remotely disabled for tested accounts | Corroborated | Same-client tests; not proof of universal or permanent disablement |
| xAI trained on repository contents | Not established | Transmission or storage does not prove training |
| The entire home directory uploaded | Not established locally | Non-Git start events had no matching enqueue |
| Every ignored `.env` uploaded | Unsupported | Path behavior depends on tracking, reads, ignore state, and force-inclusion |

## Controls and precedence

The best-supported defensive configuration is:

```toml
[features]
telemetry = false

[telemetry]
trace_upload = false

[harness]
disable_codebase_upload = true
```

`trace_upload = false` is a real session and trace setting. Public evidence does not establish that it alone blocks every repository archive path.

`harness.disable_codebase_upload = true` is the strongest codebase-specific control. [Harbor PR 2309](https://github.com/harbor-framework/harbor/pull/2309), authored with an xAI identity, states that the local and remote disable values are ORed. The PR includes tests and a live 0.2.99 smoke report with no GCS queue activity.

At the time of review, xAI's [public settings reference](https://docs.x.ai/build/settings/reference) documented `GROK_RESPECT_GITIGNORE` as a search/read-tool filter but did not list the three controls above.

## Evidence ladder

0. **Capability:** the mechanism exists in a shipped binary.
1. **Collection:** archive construction started locally.
2. **Enqueue:** an artifact entered a local upload queue.
3. **Transmission:** bytes were observed leaving and received a successful response.
4. **Retention:** server-side persistence was independently established.
5. **Training or reuse:** downstream use, disclosure, or deletion was independently established.

Capability is the prerequisite. The five runtime and outcome levels match the article figure. No level should inherit the certainty of the level below it.

## Public source map

### Original research and reproduction

- [Cereblab: What xAI's Grok Build CLI actually sends to xAI](https://gist.github.com/cereblab/dc9a40bc26120f4540e4e09b75ffb547)
- [Cereblab reproduction repository](https://github.com/cereblab/grok-build-exfil-repro)
- [Public Grok event fixture](https://github.com/DavidIlie/tokmon/blob/master/src/providers/grok/__fixtures__/home/.grok/logs/unified.jsonl)

### xAI sources

- [Grok Build documentation](https://docs.x.ai/build/overview)
- [Grok Build settings reference](https://docs.x.ai/build/settings/reference)
- [xAI privacy policy](https://x.ai/legal/privacy-policy)
- [xAI Europe privacy addendum](https://x.ai/legal/europe-privacy-policy-addendum)
- [Official xAI post on Grok Build privacy controls](https://x.com/SpaceXAI/status/2076692402442846289)
- [Official xAI follow-up stating previously synced data is deleted](https://x.com/SpaceXAI/status/2076696092037833091)
- [xAI security contact](https://x.ai/.well-known/security.txt)

### Control corroboration

- [Harbor PR 2309: Grok Build privacy hardening](https://github.com/harbor-framework/harbor/pull/2309)

## Redaction boundary

The public report deliberately excludes:

- email addresses and account identifiers;
- private repository names or file trees;
- employer or client information;
- local session and storage identifiers;
- raw logs and transcripts;
- credentials, even expired values;
- private legal-request correspondence;
- local filesystem paths that reveal personal infrastructure.

Requests for additional evidence will be evaluated against this boundary. Raw sensitive artifacts will not be published merely to make the report more dramatic.

## Change log

- **2026-07-14:** Initial sanitized appendix prepared for prepublication review.
