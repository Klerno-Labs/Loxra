import { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { DragDropZone } from '../components/DragDropZone';
import { ValidationErrorDisplay, ValidationErrorSummary } from '../components/ValidationErrorDisplay';
import { IsoMessageType, ImportResult, ValidationResult } from '@shared/types';
import { ValidationPill } from '../components/ValidationPill';
import { InfoStrip } from '../components/InfoStrip';
import { AdapterInfo } from '../components/AdapterInfo';
import { useUiStore } from '../state/uiStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getIngestionService, type IngestionResult } from '@core/messageIngestion';

export default function Validator() {
  const [xml, setXml] = useState('');
  const sampleMt103 = `:20:12345
:32A:241116EUR1000,50
:50K:/DE12345
SENDER CO
:59:/DE54321
RECEIVER CO
:70:Invoice 123`;
  const sampleIso = `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.11"><CstmrCdtTrfInitn><GrpHdr><MsgId>PAIN-SAMPLE</MsgId><CreDtTm>2024-11-16T10:00:00Z</CreDtTm><NbOfTxs>1</NbOfTxs></GrpHdr></CstmrCdtTrfInitn></Document>`;
  const [type, setType] = useState<IsoMessageType>('pain.001');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const showValidatorHint = useUiStore((s) => s.showValidatorHint);
  const toggleValidatorHint = useUiStore((s) => s.toggleValidatorHint);

  async function runValidation() {
    if (!window.isoApi || !xml.trim()) return;
    setBusy(true);
    setIngestionResult(null);

    try {
      const ingested = await getIngestionService().ingest(xml);
      setIngestionResult(ingested);

      if (!ingested.success && ingested.detectedFormat === 'legacy') {
        return;
      }

      if (ingested.detectedFormat === 'legacy' && ingested.isoPayload) {
        const gen = await window.isoApi.generate(ingested.isoPayload);
        setValidation(gen.validation);
        const parsed = await window.isoApi.parse(gen.xml);
        setResult(parsed);
        setXml(gen.xml);
        setType(ingested.isoPayload.type);
        return;
      }

      const val = await window.isoApi.validate(xml, type);
      setValidation(val);
      const parsed = await window.isoApi.parse(xml);
      setResult(parsed);
    } catch (error: any) {
      setIngestionResult({
        success: false,
        detectedFormat: 'unknown',
        errors: [error?.message || 'Validation failed']
      });
    } finally {
      setBusy(false);
    }
  }

  // Keyboard shortcut support
  useKeyboardShortcuts({
    onValidate: () => {
      if (xml && !busy) runValidation();
    },
  });

  function handleFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setXml(String(reader.result));
    reader.readAsText(file);
  }

  function handleFileDrop(content: string) {
    setXml(content);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <GlassCard title="Validate existing XML" actions={<ValidationPill validation={validation || { valid: false, errors: [] }} />}>
        <div className="space-y-4 relative z-10">
          {showValidatorHint && (
            <InfoStrip
              title="Supports legacy formats & ISO-20022 XML"
              body="Drop any payment message format (SWIFT MT, Fedwire, ACH, or ISO-20022 XML). Loxra automatically detects and converts legacy formats. Data stays local!"
              onDismiss={toggleValidatorHint}
            />
          )}
          
          <AdapterInfo ingestionResult={ingestionResult} />
          
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Message type</label>
              <select value={type} onChange={(e) => setType(e.target.value as IsoMessageType)} className="mt-1 w-full">
                <option value="pain.001">pain.001 - Customer Credit Transfer</option>
                <option value="pacs.008">pacs.008 - FI to FI Customer Credit Transfer</option>
                <option value="pacs.009">pacs.009 - Financial Institution Credit Transfer</option>
                <option value="pacs.002">pacs.002 - Payment Status Report</option>
                <option value="camt.053">camt.053 - Bank to Customer Statement</option>
              </select>
            </div>
            <label className="btn btn-ghost btn-md cursor-pointer" title="Supports XML and legacy formats. File stays on your device.">
              Import File
              <input type="file" accept=".xml,.txt,*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setXml(sampleMt103)}>
              Load MT103 sample
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setXml(sampleIso)}>
              Load ISO XML sample
            </button>
          </div>
          <DragDropZone onFileDrop={handleFileDrop} className="p-4">
            <textarea
              className="code-block w-full h-72 p-3 bg-transparent"
              value={xml}
              onChange={(e) => setXml(e.target.value)}
              placeholder="Paste any message format to validate or drag & drop a file here...
Supports: ISO-20022 XML, SWIFT MT, Fedwire, ACH, and other legacy formats"
            />
          </DragDropZone>
          <div className="flex gap-3">
            <button onClick={runValidation} disabled={!xml || busy} className="btn btn-primary btn-md">
              {busy ? 'Validating...' : 'Validate (Ctrl+Shift+V)'}
            </button>
            {xml && (
              <button onClick={() => { setXml(''); setValidation(null); setResult(null); setIngestionResult(null); }} className="btn btn-ghost btn-md">
                Clear
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard title="Result">
        <div className="space-y-4 relative z-10">
          {validation && (
            <>
              <div className={`p-3 rounded-xl border ${validation.valid ? 'border-mint/60 bg-mint/10' : 'border-danger/50 bg-danger/10'}`}>
                <p className="font-semibold flex items-center gap-2">
                  <span className={`status-dot ${validation.valid ? 'success' : 'danger'}`} />
                  {validation.valid ? 'Valid message' : 'Validation failed'}
                </p>
              </div>
              
              {!validation.valid && validation.errors.length > 0 && (
                <>
                  <ValidationErrorSummary errors={validation.errors} />
                  <ValidationErrorDisplay errors={validation.errors} />
                </>
              )}
            </>
          )}
          {result && (
            <>
              <div>
                <label className="text-xs text-muted">Pretty printed</label>
                <textarea className="code-block w-full h-48 p-3" value={result.prettyPrinted} readOnly />
              </div>
              <div>
                <label className="text-xs text-muted">Parsed structure</label>
                <pre className="code-block w-full h-48 overflow-auto p-3">{JSON.stringify(result.parsed, null, 2)}</pre>
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
