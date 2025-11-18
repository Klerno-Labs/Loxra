import { AdapterMetadata } from '@extensions/adapter';
import type { IngestionResult } from '../../core/messageIngestion';

export function AdapterInfo({
  adapter,
  warnings,
  ingestionResult
}: {
  adapter?: AdapterMetadata;
  warnings?: string[];
  ingestionResult?: IngestionResult | null;
}) {
  const resolvedAdapter =
    adapter ||
    (ingestionResult?.adapterId
      ? {
          id: ingestionResult.adapterId,
          name: ingestionResult.adapterId,
          description: 'Detected legacy adapter',
          version: '1.0.0',
          supportedMessageTypes: []
        }
      : undefined);

  const hasWarnings = (warnings && warnings.length > 0) || (ingestionResult?.warnings && ingestionResult.warnings.length > 0);
  const errors = ingestionResult?.errors || [];

  if (!resolvedAdapter && !hasWarnings && errors.length === 0) return null;
  return (
    <div className="glass-panel p-3 space-y-2 border border-outline/60">
      <div className="flex items-center gap-2">
        <span className={`status-dot ${errors.length > 0 ? 'danger' : 'success'}`} />
        <p className="text-sm font-semibold">{resolvedAdapter ? resolvedAdapter.name : 'Adapter'}</p>
        {resolvedAdapter && <span className="chip text-xs">{resolvedAdapter.id}</span>}
      </div>
      {resolvedAdapter && <p className="text-xs text-muted">Detected legacy format, converted to ISO-20022 for validation.</p>}
      {warnings && warnings.length > 0 && (
        <ul className="text-xs text-muted list-disc list-inside">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      {ingestionResult?.errors && ingestionResult.errors.length > 0 && (
        <ul className="text-xs text-danger list-disc list-inside">
          {ingestionResult.errors.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdapterBadge({ adapterId }: { adapterId?: string }) {
  if (!adapterId) return null;
  return <span className="chip chip-strong text-xs">Adapter: {adapterId}</span>;
}
