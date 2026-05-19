<div align="center">

<br/>

```
██████╗ ███████╗███████╗██╗   ██╗███████╗███████╗██████╗      ██████╗ ███╗   ██╗███████╗
██╔══██╗██╔════╝██╔════╝██║   ██║██╔════╝██╔════╝██╔══██╗    ██╔═══██╗████╗  ██║██╔════╝
██║  ██║█████╗  █████╗  ██║   ██║███████╗█████╗  ██████╔╝    ██║   ██║██╔██╗ ██║█████╗
██║  ██║██╔══╝  ██╔══╝  ██║   ██║╚════██║██╔══╝  ██╔══██╗    ██║   ██║██║╚██╗██║██╔══╝
██████╔╝███████╗██║     ╚██████╔╝███████║███████╗██║  ██║    ╚██████╔╝██║ ╚████║███████╗
╚═════╝ ╚══════╝╚═╝      ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚═╝  ╚═══╝╚══════╝
```

### _The Autonomous Fiscal Threat Defuser Engine_

**Powered by Project Antigravity**

<br/>

> _"Governments change tax policy. Companies react too late. Defuser One neutralizes the threat before it fires."_

<br/>

![React Native](https://img.shields.io/badge/React_Native-Expo-0ea5e9?style=for-the-badge&logo=expo&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Built For](https://img.shields.io/badge/AI_Seekho-2026_Hackathon-a855f7?style=for-the-badge)

</div>

---

## What Is Defuser One?

Defuser One is a production-grade, end-to-end **autonomous regulatory intelligence pipeline** and mobile application engineered to protect businesses from fiscal blind spots. When a new tax circular drops — like an FBR directive — most organizations scramble to understand the implications days or weeks after the fact. Defuser One collapses that reaction window to **seconds**.

The system ingests unstructured statutory text, isolates every fiscal threat embedded within it, calculates exact margin leakage projections, and assembles a cryptographically traceable database patch — then halts completely, awaiting a single human authorization swipe before touching production data.

One upload. One command. **Total fiscal situational awareness.**

---

## Architecture Overview

![Full-Stack Architecture Overview](./Full-Stack%20Architecture%20Overview.png)

The system is split across two rigorously decoupled layers: a **React Native (Expo)** mobile frontend engineered for high-stakes, real-time data presentation, and a **Laravel 11 backend** powered by the Project Antigravity AI engine. The frontend and backend communicate asynchronously, ensuring the intelligence pipeline never blocks the user experience — and the user experience never bypasses the intelligence pipeline.

---

## 📱 Mobile Frontend — React Native (Expo)

Designed with a **mobile-first, dark-mode terminal aesthetic**, every screen is engineered around the principle that fiscal threat data must be communicated with zero ambiguity and zero latency tolerance. The interface feels less like a mobile app and more like a mission control console.

<br/>

| Screen                         | Core Functionality                                                                                                                                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home Dashboard**             | Real-time monitoring of ingested circulars, detected threats, and live system alerts. Features a dynamic _Recent Ingestions_ log and dual-input ingestion — PDF upload or raw text paste.                                                                   |
| **Parsing Screen**             | A synchronized visual terminal step-through driven by the **Dual-Gate Synchronization Hook**, ensuring the UI never flashes ahead on fast networks or hangs on slow ones. The animation breathes with the actual pipeline.                                  |
| **Critical Threat Assessment** | Strict data-bound UI rendering projected financial leakage, effective enforcement dates, and a high-level action summary. An interactive **Inspect Agent Trace** terminal rotates technical pipeline logs to expose the AI's full internal reasoning chain. |
| **Execution State**            | A frictionless **Swipe-to-Deploy** UX. Leverages concurrent `Promise.all` timers to render a live, line-by-line execution terminal — masking network latency while accurately representing the system's autonomous patch staging process.                   |
| **Complete Screen**            | A final, immutable receipt view: confirmed execution logs, patch IDs, and database write confirmations. The paper trail starts here.                                                                                                                        |

### Key Frontend Engineering Decisions

#### Dual-Gate Transition Synchronization

The parsing screen solves a non-trivial race condition: what happens when the backend responds faster than the frontend animation completes — or vice versa? A naive implementation either freezes (waiting on slow networks) or flashes through too quickly (on fast ones), destroying the UX in both cases.

Defuser One implements a **double-gate `useEffect` hook** that holds the transition to the results screen until _both_ gates are cleared simultaneously:

1. The visual checklist animation has completed its minimum confidence-building cycle.
2. The full backend JSON payload has been received and validated.

The result is a transition that always _feels_ correct, regardless of network conditions.

#### Strict Data Binding & Graceful Degradation

Every data access throughout the React Native layer uses strict optional chaining (e.g., `payload?.totals?.total_daily_leakage`) to guarantee the application never crashes on partial or unexpected backend payloads. If a field is absent, the UI falls back to clean defaults silently — layout integrity is never compromised.

---

## 🧠 Backend — Laravel 11 & Project Antigravity

Project Antigravity is not a wrapper around a language model. It is a **multi-stage, defense-in-depth intelligence pipeline** — a suite of interconnected engines that work in concert to transform ambiguous legal prose into auditable, actionable fiscal data. Each stage has a defined contract with the next. No stage trusts the output of the previous one without verification.

The architecture is intentionally decoupled: the frontend-facing intelligence layer (responsible for AI orchestration, threat detection, and patch assembly) runs entirely independently from the backend integrity layer (responsible for database validation, deduplication, and cryptographic signing). They communicate only through a strict, versioned internal interface.

### The Five-Stage Intelligence Pipeline

**Stage 1 — Ingestion**
The pipeline accepts statutory documents via `multipart/form-data` (PDF upload) or raw JSON text payload. Documents are normalized and tokenized before any AI processing begins.

**Stage 2 — Multi-Threat Extraction via Gemini 2.5 Flash**
Antigravity dispatches the normalized document to Google Gemini 2.5 Flash with a precision-engineered extraction prompt. The model is instructed to identify and isolate _all_ tariff adjustments, rate changes, and fiscal directives simultaneously — not sequentially. Every detected threat is returned as a structured candidate object.

**Stage 3 — Zero-Trust Data Validation**
Every AI-generated category slug is cross-referenced against the live production database. Any candidate that references a category which does not exist in the database is **silently dropped** before it can proceed further. Hallucinations are structurally impossible beyond this gate. The AI advises; the database decides what's real.

**Stage 4 — Dual-Layer Deduplication**
Large statutory documents often encode the same rate change multiple times across different sections. Antigravity applies a two-pass deduplication strategy: first a strict identifier match, then a semantic merge pass. Where duplicate rows are found, the **maximum tax rate is selected** — representing worst-case fiscal exposure, the only number that matters for defensive planning.

**Stage 5 — Atomic Patch Assembly & Cryptographic Signing**
All proposed database mutations are assembled into a single atomic patch object. The patch is cryptographically signed with a content hash before it is surfaced to the user. If the patch is tampered with between assembly and execution, the signature check fails and the execution is blocked. The database does not change until a human swipes to authorize — and what they authorize is exactly what was analyzed.

**Stage 6 — Approve / Reject Lifecycle**
The full decision loop: _Approve_ executes the signed atomic patch and updates telemetry counters. _Reject_ clears the active alert with zero database writes. Every outcome is logged.

### The Assumptions Engine

Antigravity employs a set of defensive heuristics for handling the ambiguity endemic to legal text:

- **Enforcement Date Fallback:** When effective dates are absent or ambiguous, the system defaults conservatively to the start of the upcoming fiscal quarter — the safer assumption for compliance planning.
- **Semantic Category Mapping:** When descriptive category text does not map to a known slug exactly, Antigravity evaluates the text against the full live slug list and selects the best semantic match. Invented slugs are never permitted through the zero-trust validation gate.

### Immutable Audit Trail

Every pipeline execution writes a complete reasoning chain to `/storage/app/agent_traces/{uuid}.json`. This includes the raw extracted candidates, the validation results, the deduplication decisions, and the final patch manifest. The log is append-only and is never modified post-write. It is designed to be court-admissible — a full, time-stamped record of exactly what the AI saw, what it concluded, and what a human authorized.

---

## 🔌 API Reference

| Method | Endpoint                            | Description                                                                                                                                         |
| ------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/directive/ingest`          | Triggers the full 5-stage Antigravity analysis pipeline. Accepts `multipart/form-data` (PDF) or `application/json` (raw text).                      |
| `POST` | `/api/v1/simulation/patch-database` | Executes an authorized, cryptographically signed patch against the database. Requires the structured patch payload returned by the ingest endpoint. |
| `POST` | `/api/v1/simulation/reject-patch`   | Rejects a staged patch, clears the active alert, and writes a rejection record to the audit log. Zero database writes.                              |
| `GET`  | `/api/dashboard/data`               | Retrieves aggregated telemetry statistics and the recent ingestion log for the home dashboard.                                                      |

---

## Tech Stack

| Layer             | Technology                                       |
| ----------------- | ------------------------------------------------ |
| Mobile Frontend   | React Native, Expo                               |
| Backend Framework | Laravel 11                                       |
| AI Engine         | Google Gemini 2.5 Flash                          |
| Database          | MySQL                                            |
| Audit Storage     | Laravel filesystem (`/storage/app/agent_traces`) |
| Patch Integrity   | HMAC-SHA256 cryptographic signing                |

---

<div align="center">

**Built for the AI Seekho 2026 Hackathon.**

<br/>

_"The database doesn't change until a human says so._
_The AI only advises."_

<br/>

**Defuser One** · Powered by **Vision Edge**

</div>
