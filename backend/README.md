# ⚡ PROJECT ANTIGRAVITY
### *The Autonomous Fiscal Threat Defuser Engine*

> **"Governments change tax policy. Companies react too late. Antigravity defuses the threat before it fires."**

An end-to-end autonomous regulatory intelligence pipeline built on PHP/Laravel and Google Gemini AI. Antigravity ingests unstructured statutory text from Federal Board of Revenue (FBR) circulars, isolates every fiscal threat, calculates exact margin leakage per SKU category, formulates a cryptographically traceable database patch, and halts — awaiting a single human authorization decision. One upload. One command. Total fiscal situational awareness.

---

## ✦ Key Features

| Capability | Description |
|---|---|
| **Multi-Threat Extraction** | Detects and isolates all tariff adjustments in a document simultaneously. Never truncates to a single threat. |
| **System Instruction Grounding** | Offloads rules and schema to Gemini's `system_instruction` layer for faster, more deterministic inference. |
| **Zero-Trust Data Validation** | Drops any AI-generated category that does not exist in the live database. Hallucinations never reach storage. |
| **Atomic Patch Architecture** | All DB mutations are staged as a cryptographically signed JSON patch requiring explicit user authorization before execution. |
| **Executive Notification Dispatch** | Simulates dynamic Email and SMS payloads to the VP of Finance immediately upon patch approval or rejection, complete with affected SKU counts and reason codes. |
| **Dual-Layer Deduplication** | Merges duplicate tariff rows extracted by AI, selecting the maximum tax rate to represent worst-case fiscal exposure. |
| **Immutable Audit Log** | Every pipeline run writes a full reasoning chain to `/storage/app/agent_traces/{uuid}.json` — a court-admissible decision log. |
| **Dashboard Telemetry** | Real-time cache-backed counters for active alerts, total ingestions, approved regulatory changes, and SKU inventory depth. |
| **Approve / Reject Lifecycle** | Full Stage 6 decision loop: Approve executes the atomic patch; Reject clears the alert with zero DB writes. |

---

## ◈ System Architecture Overview

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     PROJECT ANTIGRAVITY — 7-STAGE PIPELINE                      │
└─────────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐
   │  PDF Upload  │  POST /api/v1/directive/ingest
   │  or Raw Text │
   └──────┬───────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 1 — Intake & Binary Processing                                           │
│  PdfExtractorService → SHA-256 threat_reference fingerprint generated           │
│  Raw text extracted from binary stream; stored on local disk                    │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2 — AI Extraction (Primary Path: DocumentIngestAgent)                    │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  PromptService::run()                                                    │   │
│  │                                                                          │   │
│  │  [system_instruction]   ← Rules, grounding contract, JSON schema         │   │
│  │  [user prompt]          ← Raw statutory text only                        │   │
│  │                              │                                           │   │
│  │                              ▼                                           │   │
│  │               Google Gemini 2.5 Flash API                                │   │
│  │               (v1beta, temp=0.1, responseMimeType=application/json)      │   │
│  │                              │                                           │   │
│  │                    Structured JSON response                               │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  IF tariffTable is empty → STAGE 2B (Regex Fallback Engine)                     │
│  HS-XXXX pattern matching against live DB slug list                             │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3 — Schema Protection & Deduplication (FiscalThreatAnalyzer)             │
│                                                                                 │
│  Live DB slug list fetched → AI output validated against it                     │
│  Duplicate category_slugs merged → max(tax_rate) selected per slug              │
│  SINGLE bulk DB query: SELECT * FROM sku_inventories WHERE slug IN (...)        │
│  Results grouped in memory → N+1 query problem fully eliminated                 │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 4 — Fiscal Leakage Calculation                                           │
│                                                                                 │
│  Per-category loop (in-memory collection, zero additional DB hits):             │
│  daily_margin_leakage = Σ (base_price × tax_delta × daily_run_rate)            │
│  per_sku_leakage = base_price × (new_tax_rate - current_applied_tax_rate)       │
│  Reasoning chain logged per threat for audit traceability                       │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 5 — Deterministic JSON Patch Formulation (DatabasePatchAgent)            │
│                                                                                 │
│  patch_id = UUID v4 (Ramsey\Uuid)                                               │
│  Per-threat: 2 operations generated (applied_tax_rate + margin_status)          │
│  margin_status logic: leakage > 0 → SECURED | < 0 → OPTIMIZED | 0 → UNCHANGED  │
│  Full pipeline reasoning trace written → /storage/app/agent_traces/{uuid}.json  │
│                                                                                 │
│  ← DATABASE IS NEVER TOUCHED AT THIS STAGE →                                   │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 6 — Human Authorization Gate                                             │
│                                                                                 │
│  pipeline_status: HALTED_AWAITING_AUTHORIZATION                                 │
│  ui_directive:    TRANSITION_TO_ALERT_CRIMSON                                   │
│                                                                                 │
│  ┌─────────────────────────┐    ┌───────────────────────────────────────────┐   │
│  │  POST /simulation/      │    │  POST /simulation/reject-patch            │   │
│  │  patch-database         │    │                                           │   │
│  │                         │    │  • Zero DB writes                         │   │
│  │  • DB::transaction()    │    │  • Cache alert cleared                    │   │
│  │  • All operations       │    │  • patch_id logged as REJECTED            │   │
│  │    executed atomically  │    │  • regulatory_changes counter unchanged   │   │
│  │  • Cache: alerts--,     │    └───────────────────────────────────────────┘   │
│  │    changes++            │                                                    │
│  └─────────────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 7 — Dashboard Telemetry (GET /api/dashboard/data)                        │
│                                                                                 │
│  DashboardCacheService → Cache-backed atomic counters                           │
│  stats: { total_ingested, active_alerts, regulatory_changes, actively_monitored}│
│  logs: [ { file_name, status, time } ] — capped at 50 entries                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Dual-Layer Processing Framework

Antigravity separates frontend-facing intelligence from backend integrity in a clean dual-layer model:

| Layer | Outputs | Consumed By |
|---|---|---|
| **Frontend Directive Layer** | `action_summary`, `executive_summary`, `terminal_trace_log` | Dashboard UI, VP Finance alert panel |
| **Backend Rule Layer** | `tariffTable`, `legalProse`, `fiscal_metrics[]`, `json_patch_preview` | `FiscalThreatAnalyzer`, `DatabasePatchAgent`, audit logs |

Both layers are produced by the same Gemini inference call and separated post-parse. The frontend layer is designed for human cognition; the backend layer feeds machine logic exclusively.

---

## ◈ Technical Stack & API Configurations

### Backend Core

```
PHP 8.2+          Laravel 11          Eloquent ORM
─────────────────────────────────────────────────────
Architecture:     Service-Oriented with Agent pattern
DB Adapter:       MySQL / SQLite (configurable)
Cache Driver:     File / Redis (configurable via .env)
Storage:          Laravel Filesystem (local disk)
Request Layer:    Form Requests with strict validation rules
```

### AI Engine

```
Provider:         Google AI Studio
Model:            Gemini 2.5 Flash
Endpoint:         https://generativelanguage.googleapis.com/v1beta/models/
                  gemini-2.5-flash:generateContent

Generation Config:
  temperature:        0.1      ← Deterministic, low-variance structured output
  maxOutputTokens:    4096     ← Sufficient for complex multi-threat responses
  responseMimeType:   application/json  ← Forces strict JSON mode at API level

Request Architecture:
  system_instruction: [rules + grounding contract + JSON schema]
  contents[0]:        [raw statutory text only]

HTTP Client:      Laravel Http facade (Guzzle)
  timeout:        110 seconds  ← Below PHP set_time_limit(120) for clean error handling
```

### Logging & Tracing

```
Laravel Log (Monolog)
  Channel:    daily
  Events:     Gemini success/failure, extraction metrics, pipeline stage transitions

AgentTraceWriter
  Location:   /storage/app/agent_traces/{patch_uuid}.json
  Format:     JSON (pretty-printed, UTF-8 unescaped slashes)
  Contents:   Full reasoning chain per agent, all threat metrics, patch operations,
              confidence score, pipeline state at completion
  Access:     trace_log_path field in every ingest API response

DashboardCacheService
  Keys:       stats:total_ingested, stats:active_alerts, stats:regulatory_changes
  Logs Key:   agent_pdf_logs (capped at 50 entries via array_slice)
  Atomicity:  Cache::increment() — safe for concurrent requests
```

---

## ◈ Agent Decision Framework & Heuristics

### The Assumptions Engine — How Antigravity Thinks When Data is Ambiguous

Regulatory documents are written by lawyers, not engineers. They are ambiguous, inconsistently formatted, and frequently incomplete. Antigravity employs a defensive heuristics layer — a set of deterministic fallback rules that guarantee safe behavior when the AI encounters edge cases.

---

#### Rule 1 — Enforcement Date Assumption (Fiscal Quarter Fallback)

When an FBR circular is issued close to a budget announcement, enforcement dates are frequently omitted from the body text in favor of references like *"as per Finance Act provisions"* or *"with immediate regulatory effect."*

**Antigravity's Response:** The engine does **not** default to `today()` — which would be inaccurate and trigger false urgency. Instead, it defaults to the **start of the upcoming fiscal quarter**, calculated as:

```php
now()->addMonths(1)->startOfMonth()->toDateString()
```

This assumption is intentionally conservative. It ensures compliance teams have a non-zero runway to prepare, while still flagging the threat as imminent.

---

#### Rule 2 — Semantic Category Mapping

FBR documents use descriptive commercial language, not database slugs. A circular may describe *"premium UHT-processed dairy commodities imported from the EU"* — which must map to the database slug `packaged-dairy-products`.

**Antigravity's Response:** The `system_instruction` embeds **Semantic Rule 3**, which instructs the model to evaluate descriptive text against the live database slug list and select the best semantic match. Crucially, the rule prohibits the model from inventing extensions (e.g., it cannot generate `dairy-products-eu` or `uht-dairy-max`). If the semantic match is uncertain, Rule 4 takes over.

```
"premium UHT dairy commodities"  →  packaged-dairy-products  ✓ (semantic match)
"luxury handbag imports"         →  [no slug match] DROPPED   ✓ (Rule 4 applied)
"unfiltered berry extract drink" →  imported-beverages        ✓ (semantic match)
```

---

#### Rule 3 — Zero-Trust Data Corruption Prevention

The AI is a probabilistic system. It will confidently generate a `category_slug` that looks valid but does not exist in the database. Antigravity operates under a **Zero-Trust assumption**: every AI output is treated as potentially corrupt until verified.

**Antigravity's Two-Level Validation:**

**Level 1 — Prompt-Layer Enforcement (Soft Block):**
The system instruction explicitly states: *"category_slug MUST be an exact string match from this specific live database list."* The allowed list is dynamically injected from the database at request time:

```php
$allowedSlugsList = implode(', ', SkuInventory::distinct()->pluck('category_slug')->toArray());
```

**Level 2 — Code-Layer Enforcement (Hard Block):**
Even if the model disobeys the prompt, `FiscalThreatAnalyzer` performs a `whereIn()` query using only the verified slugs. Any slug not present in the live DB simply returns an empty collection and contributes zero leakage — the rogue row is silently quarantined, never reaching the patch formulation stage.

```
If slug ∉ live_db_slugs → SKU collection = [] → leakage = 0 → omitted from patch operations
```

---

#### Rule 4 — Deduplication Assumption (Worst-Case Tax Rate)

An FBR notification may impose both a **regulatory duty** (e.g., 5%) and an **additional sales tax** (e.g., 28%) on the same category — emitting two tariff rows for the same slug. Processing them independently would double-count affected SKUs and generate duplicate patch operations.

**Antigravity's Response:** Before dispatching to the leakage calculator, a deduplication sweep runs across the raw `tariffTable`, grouping rows by `category_slug` and retaining only the **maximum tax rate**:

```php
if ($rate > $deduplicatedTariff[$slug]['tax_rate']) {
    $deduplicatedTariff[$slug] = ['category_slug' => $slug, 'tax_rate' => $rate];
}
```

This represents the **worst-case fiscal exposure** — the most conservative, defensible number to present to a VP of Finance.

---

## ◈ Database Schema

### `sku_inventories` Table

```sql
CREATE TABLE sku_inventories (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku_code         VARCHAR(50)    NOT NULL UNIQUE,
    product_name     VARCHAR(255)   NOT NULL,
    category_slug    VARCHAR(100)   NOT NULL,   -- Grounding anchor for AI pipeline
    base_price       DECIMAL(10,2)  NOT NULL,   -- Used in leakage calculation
    applied_tax_rate DECIMAL(5,4)   NOT NULL DEFAULT 0.0000,  -- Updated by patch
    margin_status    ENUM('SECURED','OPTIMIZED','UNCHANGED') DEFAULT 'UNCHANGED',
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP
);
```

### JSON Patch Contract Preview

Every pipeline run produces a deterministic JSON patch before any database mutation occurs:

```json
{
  "patch_id": "d01f2e8b-1d47-40c6-9226-9784b12be3c7",
  "threat_reference": "e429529fe9cbe1fbcca392490dfac2d9...",
  "status": "PENDING_AUTHORIZATION",
  "operations": [
    {
      "op": "replace",
      "target_column": "applied_tax_rate",
      "target_category": "packaged-dairy-products",
      "new_value": 0.35,
      "affected_skus": 3,
      "sku_target": "ALL:category_slug=packaged-dairy-products"
    },
    {
      "op": "replace",
      "target_column": "margin_status",
      "target_category": "packaged-dairy-products",
      "new_value": "SECURED",
      "affected_skus": 3,
      "sku_target": "ALL:category_slug=packaged-dairy-products"
    }
  ],
  "metadata": {
    "effective_date": "2026-06-01",
    "total_daily_leakage": 79820.00,
    "total_affected_skus": 12,
    "threat_count": 4,
    "formulated_at": "2026-05-18T14:30:08.774Z"
  }
}
```

### API Response Contract

```json
{
  "pipeline_status":    "HALTED_AWAITING_AUTHORIZATION",
  "ui_directive":       "TRANSITION_TO_ALERT_CRIMSON",
  "threat_reference":   "sha256-fingerprint-of-source-document",
  "patch_id":           "uuid-v4",
  "effective_date":     "YYYY-MM-DD",
  "action_summary":     "1-2 sentence compliance action.",
  "executive_summary":  "2-3 sentence high-level regulatory overview.",
  "terminal_trace_log": "[1/4] Step... [2/4] Step...",
  "fiscal_metrics": [
    {
      "category_slug":        "imported-food-beverage-customs-duty-max",
      "tax_tier":             0.35,
      "daily_margin_leakage": 1400.00,
      "affected_sku_count":   2
    }
  ],
  "totals": {
    "total_daily_leakage": 79820.00,
    "total_affected_skus": 12,
    "threat_count":        4
  },
  "json_patch_preview":     { "...full patch object..." },
  "trace_log_path":         "/storage/app/agent_traces/{uuid}.json",
  "authorization_required": true
}
```

### Stage 6: Approval / Rejection Contract

When an authorized user hits `POST /api/v1/simulation/patch-database` or `POST /api/v1/simulation/reject-patch`, the system returns the execution results alongside dynamic notification payloads:

```json
{
  "status": "SUCCESS",
  "patch_id": "d01f2e8b-1d47-40c6-9226-9784b12be3c7",
  "message": "Database mutation patch deployed successfully.",
  "simulation_logs": {
    "dispatch_target": "vp.finance@corporate-enterprise.com",
    "sms_dispatched": "Defuser Alert: Patch d01f2e8b... executed for 'packaged-dairy-products'. 3 SKUs secured at 35% tax tier.",
    "email_dispatched": "URGENT FISCAL UPDATE:\nCategory 'packaged-dairy-products' has been officially patched due to an FBR regulatory threat.\n...",
    "terminal_print": "> SECURED: Regulatory compliance enforced for packaged-dairy-products. Executed 3 row updates."
  },
  "ui_directive": "MAINTAIN_CORPORATE_GREEN",
  "executed_at": "2026-05-18T14:30:08.774Z"
}
```

---

## ◈ API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/directive/ingest` | Trigger the full 5-stage analysis pipeline |
| `POST` | `/api/v1/simulation/patch-database` | Execute an authorized patch (Stage 6 Approve) |
| `POST` | `/api/v1/simulation/reject-patch` | Reject a staged patch (Stage 6 Reject) |
| `GET` | `/api/dashboard/data` | Retrieve aggregated telemetry and ingestion logs |

---

## ◈ Installation & Setup

### Requirements

- PHP `>= 8.2`
- Composer `>= 2.x`
- MySQL or SQLite
- A valid **Google AI Studio API Key** with Gemini 2.5 Flash access

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/autonomous_regulatory_defuse.git
cd autonomous_regulatory_defuse

# 2. Install dependencies
composer install

# 3. Configure environment
cp .env.example .env
php artisan key:generate

# 4. Set your Gemini credentials in .env
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent

# 5. Configure SKU run rate (default: 100 units/day per SKU)
SKU_DAILY_RUN_RATE=100

# 6. Run database migrations and seed SKU inventory
php artisan migrate
php artisan db:seed

# 7. Cache configuration for production performance
php artisan optimize

# 8. Launch development server
php artisan serve
```

### Artisan Commands

```bash
# Rebuild all caches after config changes
php artisan optimize

# Clear all caches (development reset)
php artisan optimize:clear

# Inspect an agent trace log directly from the CLI
cat storage/app/agent_traces/{uuid}.json | python -m json.tool

# Tail live pipeline logs
php artisan pail
# or
tail -f storage/logs/laravel.log
```

---

## ◈ Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | **Required.** Google AI Studio API key |
| `GEMINI_BASE_URL` | — | **Required.** Full Gemini generateContent endpoint URL |
| `SKU_DAILY_RUN_RATE` | `100` | Assumed units sold per SKU per day for leakage projection |
| `AGENT_TRACE_DISK` | `local` | Laravel filesystem disk for trace log storage |
| `CACHE_STORE` | `file` | Cache driver (`file`, `redis`, `memcached`) |
| `DB_CONNECTION` | `mysql` | Database driver |

---

## ◈ Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── DirectiveController.php     # POST /ingest — orchestrates stages 1-5
│   │   ├── SimulationController.php    # POST /patch-database, /reject-patch
│   │   ├── DashboardController.php     # GET /dashboard/data
│   │   └── NotificationController.php # VP Finance alert dispatch
│   └── Requests/
│       ├── IngestRequest.php           # PDF/raw_text validation
│       ├── PatchDatabaseRequest.php    # Approve patch validation
│       └── RejectPatchRequest.php      # Reject patch validation
├── Services/
│   ├── GeminiService.php               # Gemini API client (system_instruction aware)
│   ├── PromptService.php               # Prompt architect + result normalizer
│   ├── PipelineService.php             # Stage coordinator (1 → 5)
│   ├── DashboardCacheService.php       # Telemetry + audit log cache manager
│   └── Agents/
│       ├── DocumentIngestAgent.php     # Stage 1-2: Extract + AI parse
│       ├── FiscalThreatAnalyzer.php    # Stage 3-4: Validate + leakage calc
│       └── DatabasePatchAgent.php      # Stage 5: JSON patch formulation
└── Support/
    └── AgentTraceWriter.php            # Immutable JSON trace log writer
```

---

<div align="center">

**Project Antigravity** — Built for the AI Seekho 2026 Hackathon.

*"The database doesn't change until a human says so. The AI only advises."*

</div>
