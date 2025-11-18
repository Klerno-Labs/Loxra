# Loxra - ISO-20022 Desktop

Loxra is a premium, offline-first Electron + React desktop app for composing, validating, and managing ISO-20022 messages with confidence. It delivers a minimalist, high-trust fintech UI aligned to the Loxra Labs brand.

## Highlights

- **Legacy Format Support**: Modular adapter system automatically detects and converts SWIFT MT, Fedwire, ACH, and other legacy formats to ISO-20022 (see [ADAPTER_SYSTEM.md](./ADAPTER_SYSTEM.md)).
- **Real schemas**: Bundled `pain.001.001.11`, `pacs.008.001.10`, `pacs.009.001.10`, `pacs.002.001.13`, `camt.053.001.11` XSDs validated locally with `libxml2-wasm` (no native build tools or network needed).
- **Desktop shell**: Electron main/preload with isolated IPC for generation, validation, templates, history, and export.
- **Modern UI**: React + TypeScript + Tailwind, Loxra dark-first layout with theme toggle (Dashboard, Builder, Validator, Templates/History, Settings).
- **Keyboard shortcuts**: Global shortcuts for navigation and actions (Ctrl+N, Ctrl+S, Ctrl+Shift+V, Ctrl+/) for power users.
- **Auto-save drafts**: Automatic saving every 2 seconds with manual save support (Ctrl+S) - never lose your work.
- **Drag & drop**: Drop XML or legacy format files directly onto the Validator for instant validation and conversion.
- **Enhanced errors**: Validation errors with line numbers, XPath, severity levels, and actionable suggestions.
- **Templates & history**: Seed templates under `resources/iso20022/templates` plus user templates/history stored in Electron `userData`.
- **Offline-friendly**: Everything runs locally; schemas are packaged via `extraResources`.
- **Field-aware Builder**: Inline IBAN/BIC/currency checks plus Ultimate Debtor/Creditor and Purpose code fields for payments, with XSD-derived hints.
- **Rails & batch**: Rail adapter manifests for profile hints (SEPA, CBPR sample) and CSV + multi-message batch generation with ZIP export + validation report.

## Project structure

```text
resources/iso20022/schemas     # Bundled XSD schemas
resources/iso20022/templates   # Seed template JSON files
resources/iso20022/rails       # Rail adapter manifests (SEPA, CBPR samples)
src/main                       # Electron main + IPC + preload
src/renderer                   # React UI (Vite)
src/iso                        # XML builders, schema loader, validator, templates, history
src/core                       # Adapter system, canonical model, message ingestion
src/extensions                 # Adapter interface, extension manager, adapters
src/shared                     # Shared types/interfaces
assets/brand                   # Loxra logo/wordmark
```

## Tech stack

- **Desktop**: Electron + electron-builder (Windows, macOS, Linux targets).
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Query, React Router.
- **Validation**: `libxml2-wasm` for XSD validation, `xmlbuilder2` for XML generation, `fast-xml-parser` for imports.
- **Quality**: Vitest + simple integration tests per message type, eslint (flat config).

## Getting started (dev)

1. **Install** (Node 18+ recommended):

   ```bash
   npm install
   ```

2. **Run in dev** (starts Vite + Electron with preload IPC):

   ```bash
   npm run dev
   ```

3. **Lint / Typecheck / Test**:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

The dev window auto-loads the Vite dev server; the renderer lives at `http://localhost:5173` and uses the preload bridge (`window.isoApi`) for validation/generation.

## Landing page (static)

- A branded, dark-first landing page lives in `landing/` with a hero CTA and feature highlights. Host it as static HTML/CSS.
- Buttons point to `release/latest/Loxra-Setup.exe` and `release/latest/Loxra.dmg`; update the hrefs to match wherever you host the packaged installers after running `npm run build`.

## Building installers

Build both renderer + main + packaged binaries (configured for dmg/nsis/AppImage):

```bash
npm run build      # runs vite build, tsc+tsc-alias for main, then electron-builder
```

Artifacts land in `release/`. Bundled schemas/templates are copied via `extraResources` so validation works offline.

### Code signing / branding

- macOS: configure Apple Developer ID certificates, set `CSC_LINK`/`CSC_KEY_PASSWORD`, and add entitlements if required.
- Windows: provide a `.pfx` and set `CSC_LINK`/`CSC_KEY_PASSWORD` or `WIN_CSC_LINK`.
- Icons/branding: replace `build/icon.png` with final artwork; logo/wordmark live in `assets/brand`.

## Core flows

- **Dashboard**: Loxra hero + CTA, quick cards for `pain.001`, `pacs.008`, `pacs.009`, `camt.053`, recent validation history, and guidance.
- **Message Builder**: guided form per message type, inline IBAN/BIC/currency validation + XSD hints, live XML preview, inline validation status, copy/export, save as template, CSV batch generation with ZIP export + validation report.
- **Validator**: paste or import XML, choose schema, run XSD validation, see pretty-printed XML + structured parsing.
- **Templates & History**: load seed or user templates, preview/export, view recent validation results.
- **Settings**: default type, strict validation toggle placeholder, local-only telemetry toggle placeholder.

## ISO-20022 engine

- Schemas live in `resources/iso20022/schemas` and are loaded via `schemaLoader.ts`, resolved to packaged resources when built.
- XML generation lives in `src/iso/xmlBuilder.ts` with type-safe payloads in `src/shared/types.ts`.
- Validation uses `libxml2-wasm` in `src/iso/validator.ts` (no native toolchain required).
- Import/pretty print uses `src/iso/parser/parse.ts` with `fast-xml-parser` and XML pretty printing.

## Adding a new message type

1. **Add the schema**: drop the XSD into `resources/iso20022/schemas` and map it in `schemaLoader.ts` (`schemaMap`). Prefer official ISO-20022 XSDs.
2. **Model it**: extend `src/shared/types.ts` with a new payload shape and add the discriminated union entry to `MessagePayload`.
3. **Build XML**: implement a generator in `src/iso/xmlBuilder.ts` that emits the correct namespace + structure for the schema.
4. **Template & UI**: seed a template JSON under `resources/iso20022/templates`, and update the Builder form/UI to capture key fields.
5. **Tests**: add a vitest case in `src/iso/__tests__` that builds + validates the XML against the new schema.

## Security & trust

- 100% local: no credentials, no remote calls; validation runs on embedded schemas.
- File exports prompt for a location; templates/history stored under Electron `userData`.
- This tool builds and validates ISO-20022 messages; it is **not** a payment processor.

## Folder bridge automation

Loxra includes a folder-based automation system that watches for incoming files, validates/converts them, and optionally pushes to HTTP/SFTP/AMQP endpoints.

### Setup

1. **Configure environment**: Copy `.env.example` to `.env` and set your targets:

   ```bash
   cp .env.example .env
   ```

   Available options:
   - `OUT_HTTP_URL` - Optional HTTP POST endpoint for validated XML
   - `OUT_SFTP_URL` - Optional SFTP URL (e.g., `sftp://user:pass@host:22/path`)
   - `OUT_AMQP_URL` - Optional AMQP broker URL (e.g., `amqp://user:pass@host:5672`)
   - `OUT_AMQP_QUEUE` - AMQP queue name (default: `iso20022`)
   - `RETRIES` - Number of retry attempts before moving to error folder (default: `3`)
   - `POLL_MS` - Polling interval in milliseconds (default: `1500`)

2. **Install dependencies**: Already done with `npm install`

3. **Create folders** (auto-created on first run):
   - `inbound/` - Drop files here for processing
   - `outbound/` - Validated ISO-20022 XML output
   - `error/` - Failed files after max retries

### Running the bridge

```bash
npm run folder:bridge
```

The bridge will:

1. Monitor `inbound/` directory every `POLL_MS` milliseconds
2. Detect file format (XML, SWIFT MT, Fedwire, ACH, etc.)
3. Convert legacy formats to canonical model via adapters
4. Generate ISO-20022 compliant XML
5. Validate against XSD schemas
6. Write validated XML to `outbound/`
7. Optionally push to configured endpoints (HTTP/SFTP/AMQP)
8. Move failed files to `error/` after max retries
9. Log all events as JSON

### Example workflow

```bash
# 1. Start the bridge
npm run folder:bridge

# 2. In another terminal, drop a file
echo "LEGACY:DEMO:v1
TYPE:CREDIT
TXN_ID:12345
DEBTOR_NAME:John Doe
CREDITOR_NAME:Jane Smith
AMOUNT:1000.50
CURRENCY:USD
END" > inbound/payment.txt

# 3. Check output
cat outbound/payment.xml  # ISO-20022 pacs.008 XML
```

### CLI ingestion

For one-off conversions:

```bash
# Convert legacy to ISO XML
npm run ingest -- -i examples/demo-credit-transfer.txt -o output.xml

# Validate existing XML
npm run ingest -- -i message.xml --skip-validate

# Specify message type
npm run ingest -- -i payment.txt -o out.xml -t pacs.008
```

### HTTP API server

Run a REST API for message conversion:

```bash
npm run api
```

**Endpoints:**

- `POST /ingest` - Convert and validate any format to ISO-20022

  ```json
  {
    "xml": "<legacy or ISO XML>",
    "type": "pacs.008"  // optional
  }
  ```

- `POST /generate` - Generate ISO-20022 from payload

  ```json
  {
    "payload": {
      "type": "pacs.008",
      "FIToFICstmrCdtTrf": { ... }
    }
  }
  ```

## Testing automation

```bash
# Run all tests
npm test

# Test folder bridge with sample files
npm run folder:bridge &
cp examples/demo-credit-transfer.txt inbound/
# Check outbound/ for result
```

## Scripts

- `npm run dev` - Vite dev server + Electron (ts-node for main)
- `npm run build` - renderer build + main build + electron-builder packaging
- `npm run build:renderer` / `npm run build:main` - individual builds
- `npm test` - vitest suite (generation + schema validation)
- `npm run lint` - eslint (flat config)
- `npm run typecheck` - strict TypeScript check
- `npm run ingest` - CLI to ingest legacy/XML input and emit validated ISO-20022 XML (`--input <file> --output <file>`; defaults to stdin/stdout)
- `npm run api` - REST bridge (`POST /ingest`, `POST /generate`) for headless use
- `npm run folder:bridge` - poll `inbound/` -> validate/convert -> `outbound/` (retries, `error/`, optional HTTP push via `OUT_HTTP_URL`, SFTP via `OUT_SFTP_URL`, AMQP via `OUT_AMQP_URL`/`OUT_AMQP_QUEUE`)

## Automation env (folder bridge)

Copy `.env.example` to `.env` and set:

- `OUT_HTTP_URL` - optional HTTP endpoint to POST validated XML
- `OUT_SFTP_URL` - optional SFTP target, e.g. `sftp://user:pass@host:22/path`
- `OUT_AMQP_URL` / `OUT_AMQP_QUEUE` - optional AMQP target and queue
- `RETRIES` / `POLL_MS` - optional retry count and poll interval

Run `npm run folder:bridge` to watch `inbound/` and push to your targets.

## Quick smoke test

1) `npm install`  
2) `npm test` (should pass)  
3) `npm run build` (renderer + main + electron-builder)  
4) Launch the packaged app and verify: Builder (pacs.008/009/002/camt.053), Validator (legacy + ISO), export  
5) (Optional) Run `npm run folder:bridge` with a sample file in `inbound/` and confirm converted XML in `outbound/` or at your configured HTTP/SFTP/AMQP target.

## Current schemas and templates

- `pain.001.001.11` - Customer Credit Transfer Initiation
- `pacs.008.001.12` - FI to FI Customer Credit Transfer
- `pacs.009.001.11` - Financial Institution Credit Transfer
- `pacs.002.001.14` - Payment Status Report
- `camt.053.001.12` - Bank to Customer Statement

Seed templates: see `resources/iso20022/templates/*.json` for examples you can load from the Templates view or extend in the Builder.

> Need to override pacs.002 validation? Drop an official XSD named `pacs.002.001.14-official.xsd` into `resources/iso20022/schemas/` (or the packaged resources path) and it will be preferred over the bundled one.
