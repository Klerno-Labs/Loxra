# Loxra Adapter System (Legacy -> ISO-20022)

This describes the modular adapter system enabling Loxra to ingest legacy payment formats (SWIFT MT, Fedwire, ACH, CHIPS, etc.) and convert them into ISO-20022 messages without touching core logic.

Flow: `raw message -> adapter detection -> canonical model -> ISO-20022 bridge -> XML builder/validation`

## Key modules

- `src/core/models/canonicalMessage.ts` - canonical message model + validation
- `src/extensions/adapter.ts` - adapter contract + base class
- `src/extensions/extensionManager.ts` - registry/detection/orchestration
- `src/extensions/adapterRegistry.ts` - list + loader
- `src/extensions/adapters/SwiftMt103Adapter.ts` - MT103 core tags adapter
- `src/extensions/adapters/FedwireAdapter.ts` - Fedwire core field adapter
- `src/extensions/adapters/AchNachAdapter.ts` - simple ACH/NACHA key/value adapter
- `src/core/canonicalBridge.ts` - canonical -> ISO-20022 payload mapping
- `src/core/messageIngestion.ts` - high-level ingestion service
- `src/renderer/components/AdapterInfo.tsx` - UI badge/info component
- `src/iso/__tests__/adapter.spec.ts` - vitest coverage for the adapter system

## Creating a new adapter

1) Add a class in `src/extensions/adapters/` implementing `LoxraAdapter`.
2) Register it in `src/extensions/adapterRegistry.ts` (`AVAILABLE_ADAPTERS`).
3) Implement:
   - `canParse(input: string)` - detection heuristic
   - `parseToCanonical(input: string)` - return `ParseResult` with `LoxraCanonicalMessage`
   - `fromCanonical(msg)` - return legacy string from canonical
4) Run tests: `npm test` (see `adapter.spec.ts`).

### Fast start template

Copy `AdapterTemplate.ts` from `src/extensions/adapters/` and replace:

- `metadata` values (id/name/description/version/supportedMessageTypes)
- `canParse` detection logic
- Field mapping inside `parseToCanonical` and `fromCanonical`

Add a sample message to `examples/` and a test case in `src/iso/__tests__/adapter.spec.ts`.

## Ingestion service

- `MessageIngestionService.ingest(input)`:
  - If XML, returns `{ detectedFormat: 'xml' }` (existing flow can handle).
  - Otherwise, uses `ExtensionManager` to find an adapter, parse to canonical, validate, then map to ISO payload via `canonicalToISO20022`.
  - Returns `{ adapterId, canonical, isoPayload, warnings }` or `{ errors }`.

## UI

- `AdapterInfo` / `AdapterBadge` components display which adapter processed a message and any warnings.
  - Use in renderer flows as needed (e.g., Validator result area).

## Samples

- Demo legacy format (handled by `LegacyDemoAdapter`):

  ```text
  LEGACY:DEMO:v1
  TYPE:CREDIT
  TXN_ID:12345
  E2E_ID:E2E-1
  DEBTOR_NAME:Sender Co
  DEBTOR_BIC:DEUTDEFF
  DEBTOR_ACC:DE12345
  CREDITOR_NAME:Receiver Co
  CREDITOR_BIC:COBADEFF
  CREDITOR_ACC:DE54321
  AMOUNT:100.5
  CCY:EUR
  VALUE_DATE:2024-11-16
  REMIT:Invoice 123
  ```

## Testing

- `npm test` runs `src/iso/__tests__/adapter.spec.ts`, covering:
  - Adapter detection and parsing
  - Canonical validation
  - Canonical -> ISO payload conversion
  - Extension manager detection flow

## Notes

- Canonical -> ISO mapping currently targets `pacs.008`/`pain.001`/`pacs.009`/`pacs.002` depending on message type or `isoTarget`.
- No changes were made to existing validation or XML generation logic; this system sits alongside and feeds into it.
