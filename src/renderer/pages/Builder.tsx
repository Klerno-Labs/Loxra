import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import JSZip from "jszip";
import GlassCard from "../components/GlassCard";
import {
  IsoMessageType,
  MessagePayload,
  Pain001Payload,
  Pacs008Payload,
  Pacs009Payload,
  Pacs002Payload,
  Camt053Payload,
  ValidationResult,
  RailAdapter
} from "@shared/types";
import { ValidationPill } from "../components/ValidationPill";
import { InfoStrip } from "../components/InfoStrip";
import { useUiStore } from "../state/uiStore";
import { useDraftStore } from "../stores/draftStore";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

function defaultPain(): Pain001Payload {
  return {
    messageId: `PAIN-${Date.now()}`,
    creationDateTime: new Date().toISOString(),
    initiatingParty: "Your Organisation",
    batchBooking: true,
    requestedExecutionDate: new Date().toISOString().slice(0, 10),
    serviceLevel: "SEPA",
    debtor: { name: "Debtor Corp", bic: "DEUTDEFFXXX", iban: "DE75512108001245126199" },
    debtorAccount: "DE75512108001245126199",
    debtorAgentBic: "DEUTDEFFXXX",
    transactions: [
      {
        endToEndId: "E2E-1",
        amount: 1000,
        currency: "EUR",
        debtor: { name: "Debtor Corp", bic: "DEUTDEFFXXX", iban: "DE75512108001245126199" },
        creditor: { name: "Creditor Name", bic: "COBADEFFXXX", iban: "DE44500105175407324931" },
        creditorAccount: "DE44500105175407324931",
        remittanceInformation: "Invoice reference",
        chargesBearer: "SLEV",
      },
    ],
  };
}

function defaultPacs(): Pacs008Payload {
  return {
    messageId: `PACS-${Date.now()}`,
    creationDateTime: new Date().toISOString(),
    settlementMethod: "COVE",
    instructingAgentBic: "CHASUS33",
    instructedAgentBic: "BOFAUS3N",
    transactions: [
      {
        endToEndId: "E2E-1",
        amount: 5000,
        currency: "USD",
        debtor: { name: "Originator Bank", bic: "CHASUS33", iban: "GB33BUKB20201555555555" },
        debtorAccount: "GB33BUKB20201555555555",
        creditor: { name: "Receiving Bank", bic: "BOFAUS3N", iban: "GB29NWBK60161331926819" },
        creditorAccount: "GB29NWBK60161331926819",
        remittanceInformation: "Treasury settlement",
        requestedExecutionDate: new Date().toISOString().slice(0, 10),
        chargesBearer: "SHAR",
      },
    ],
  };
}

function defaultPacs009(): Pacs009Payload {
  return {
    messageId: `PACS009-${Date.now()}`,
    creationDateTime: new Date().toISOString(),
    settlementMethod: "COVE",
    instructingAgentBic: "CHASUS33",
    instructedAgentBic: "BOFAUS3N",
    transactions: [
      {
        endToEndId: "E2E-009-1",
        amount: 12000,
        currency: "USD",
        debtor: { name: "Originator FI", bic: "CHASUS33", iban: "GB33BUKB20201555555555" },
        debtorAccount: "GB33BUKB20201555555555",
        creditor: { name: "Receiver FI", bic: "BOFAUS3N", iban: "GB29NWBK60161331926819" },
        creditorAccount: "GB29NWBK60161331926819",
        remittanceInformation: "Interbank settlement",
        requestedExecutionDate: new Date().toISOString().slice(0, 10),
        chargesBearer: "SHAR",
      },
    ],
  };
}

function defaultPacs002(): Pacs002Payload {
  return {
    messageId: `PACS002-${Date.now()}`,
    creationDateTime: new Date().toISOString(),
    originalMessageId: "PAIN-REF-001",
    originalMessageNameId: "pain.001.001.11",
    groupStatus: "ACTC",
    statusReasonCode: "G000",
    transactions: [
      {
        originalEndToEndId: "E2E-1",
        originalTransactionId: "TXN-001",
        transactionStatus: "ACTC",
        statusReasonCode: "G000",
        statusReasonInformation: "Payment accepted",
      },
    ],
  };
}

function defaultCamt(): Camt053Payload {
  const today = new Date().toISOString().slice(0, 10);
  return {
    messageId: `CAMT-${Date.now()}`,
    creationDateTime: new Date().toISOString(),
    account: { iban: "FR1420041010050500013M02606", currency: "EUR", name: "Corporate EUR" },
    balances: [
      { type: "OPBD", amount: 150000, currency: "EUR" },
      { type: "CLBD", amount: 150550.76, currency: "EUR" },
    ],
    entries: [
      {
        amount: 1200.5,
        currency: "EUR",
        creditDebit: "CRDT",
        bookingDate: today,
        valueDate: today,
        remittanceInformation: "Client receipt",
      },
    ],
  };
}

function useQueryType(): IsoMessageType {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const type = params.get("type") as IsoMessageType | null;
  return (type || "pain.001") as IsoMessageType;
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = cells[idx] || ""));
    return row;
  });
}

function mapRowToPayload(type: IsoMessageType, row: Record<string, string>, idx: number): MessagePayload {
  const baseId = row.messageId || `${type}-${idx + 1}`;
  switch (type) {
    case "pain.001":
      return {
        type,
        payload: {
          ...defaultPain(),
          messageId: baseId,
          transactions: [
            {
              ...defaultPain().transactions[0],
              endToEndId: row.endToEndId || `E2E-${idx + 1}`,
              amount: Number(row.amount || 0),
              currency: row.currency || "EUR",
              debtor: { name: row.debtorName || "Debtor", iban: row.debtorIban || "" },
              debtorAccount: row.debtorIban || "",
              creditor: { name: row.creditorName || "Creditor", iban: row.creditorIban || "" },
              creditorAccount: row.creditorIban || "",
              remittanceInformation: row.remittance || "",
            },
          ],
        },
      };
    case "pacs.008":
      return {
        type,
        payload: {
          ...defaultPacs(),
          messageId: baseId,
          transactions: [
            {
              ...defaultPacs().transactions[0],
              endToEndId: row.endToEndId || `E2E-${idx + 1}`,
              amount: Number(row.amount || 0),
              currency: row.currency || "USD",
              debtor: { name: row.debtorName || "Debtor FI", iban: row.debtorIban || "" },
              debtorAccount: row.debtorIban || "",
              creditor: { name: row.creditorName || "Creditor FI", iban: row.creditorIban || "" },
              creditorAccount: row.creditorIban || "",
              remittanceInformation: row.remittance || "",
            },
          ],
        },
      };
    case "pacs.009":
      return {
        type,
        payload: {
          ...defaultPacs009(),
          messageId: baseId,
          transactions: [
            {
              ...defaultPacs009().transactions[0],
              endToEndId: row.endToEndId || `E2E-${idx + 1}`,
              amount: Number(row.amount || 0),
              currency: row.currency || "USD",
              debtor: { name: row.debtorName || "Debtor FI", iban: row.debtorIban || "" },
              debtorAccount: row.debtorIban || "",
              creditor: { name: row.creditorName || "Creditor FI", iban: row.creditorIban || "" },
              creditorAccount: row.creditorIban || "",
              remittanceInformation: row.remittance || "",
            },
          ],
        },
      };
    case "camt.053":
      return {
        type,
        payload: {
          ...defaultCamt(),
          messageId: baseId,
        },
      };
    case "pacs.002":
      return {
        type,
        payload: {
          ...defaultPacs002(),
          messageId: baseId,
          transactions: [
            {
              ...(defaultPacs002().transactions?.[0] || {}),
              originalEndToEndId: row.endToEndId || `E2E-${idx + 1}`,
              originalTransactionId: row.originalTransactionId || `TXN-${idx + 1}`,
              transactionStatus: (row.transactionStatus as any) || "ACTC",
              statusReasonInformation: row.remittance || "Accepted",
            },
          ],
        },
      };
    default:
      return { type: "pain.001", payload: defaultPain() };
  }
}

function mapValidationToFields(validation?: ValidationResult | null): Set<string> {
  const fields = new Set<string>();
  if (!validation || validation.valid) return fields;
  validation.errors.forEach((err) => {
    const msg = err.message.toLowerCase();
    if (msg.includes("iban")) fields.add("iban");
    if (msg.includes("bic")) fields.add("bic");
    if (msg.includes("currency") || msg.includes("ccy")) fields.add("currency");
    if (msg.includes("amount")) fields.add("amount");
    if (msg.includes("ustrd") || msg.includes("remittance")) fields.add("remittance");
    if (msg.includes("purp")) fields.add("purpose");
  });
  return fields;
}
export default function Builder() {
  const typeFromQuery = useQueryType();
  const [messageType, setMessageType] = useState<IsoMessageType>(typeFromQuery);
  const [pain, setPain] = useState<Pain001Payload>(defaultPain);
  const [pacs, setPacs] = useState<Pacs008Payload>(defaultPacs);
  const [pacs009, setPacs009] = useState<Pacs009Payload>(defaultPacs009);
  const [pacs002, _setPacs002] = useState<Pacs002Payload>(defaultPacs002);
  const [camt, setCamt] = useState<Camt053Payload>(defaultCamt);
  const [xml, setXml] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [hints, setHints] = useState<Record<string, string>>({});
  const [rails, setRails] = useState<RailAdapter[]>([]);
  const [selectedRail, setSelectedRail] = useState<string>('');
  const [batchCsv, setBatchCsv] = useState('messageId,amount,currency,debtorName,debtorIban,creditorName,creditorIban,remittance\n');
  const [batchStatus, setBatchStatus] = useState<string>('');
  const showBuilderHint = useUiStore((s) => s.showBuilderHint);
  const toggleBuilderHint = useUiStore((s) => s.toggleBuilderHint);

  const fieldErrors = useMemo(() => mapValidationToFields(validation), [validation]);

  useEffect(() => {
    setMessageType(typeFromQuery);
  }, [typeFromQuery]);

  useEffect(() => {
    window.isoApi?.getHints(messageType).then(setHints).catch(() => setHints({}));
  }, [messageType]);

  useEffect(() => {
    window.isoApi?.listRails().then((all) => {
      setRails(all || []);
      if (all && all[0]?.id) setSelectedRail(all[0].id);
    });
  }, []);

  const payload: MessagePayload = useMemo(() => {
    switch (messageType) {
      case 'pain.001':
        return { type: 'pain.001', payload: pain };
      case 'pacs.008':
        return { type: 'pacs.008', payload: pacs };
      case 'pacs.009':
        return { type: 'pacs.009', payload: pacs009 };
      case 'pacs.002':
        return { type: 'pacs.002', payload: pacs002 };
      case 'camt.053':
        return { type: 'camt.053', payload: camt };
    }
  }, [messageType, pain, pacs, pacs009, pacs002, camt]);

  // Auto-save functionality - debounced
  const { autoSave, saveDraft } = useDraftStore();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave(messageType, payload);
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [payload, messageType, autoSave]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => {
      saveDraft(messageType, payload, `${messageType} - ${new Date().toLocaleString()}`);
    },
    onExport: () => {
      if (xml) {
        copyToClipboard(xml);
      }
    },
  });

  const ibanRegex = useMemo(() => /^[A-Z0-9]{15,34}$/i, []);
  const bicRegex = useMemo(() => /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i, []);
  const currencyRegex = useMemo(() => /^[A-Z]{3}$/, []);

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    const checkIban = (value: string, label: string) => {
      if (!value || !ibanRegex.test(value)) errs.push(`${label} should be a 15-34 char IBAN-like string.`);
    };
    const checkBic = (value: string | undefined, label: string) => {
      if (value && !bicRegex.test(value)) errs.push(`${label} must follow BIC format.`);
    };
    const checkCurrency = (value: string | undefined) => {
      if (value && !currencyRegex.test(value)) errs.push('Currency must be a 3-letter code.');
    };

    if (messageType === 'pain.001') {
      checkIban(pain.debtorAccount, 'Debtor account');
      checkCurrency(pain.transactions[0].currency);
      if (pain.transactions[0].amount <= 0) errs.push('Amount must be greater than zero.');
    }
    if (messageType === 'pacs.008' || messageType === 'pacs.009') {
      const tx = messageType === 'pacs.008' ? pacs.transactions[0] : pacs009.transactions[0];
      checkIban(tx.debtorAccount || tx.debtor.iban || '', 'Debtor account');
      checkIban(tx.creditorAccount || tx.creditor.iban || '', 'Creditor account');
      checkBic(tx.debtor.bic, 'Debtor BIC');
      checkBic(tx.creditor.bic, 'Creditor BIC');
      checkCurrency(tx.currency);
      if (tx.amount <= 0) errs.push('Amount must be greater than zero.');
    }
    if (messageType === 'camt.053') {
      checkIban(camt.account.iban, 'Account IBAN');
    }
    return errs;
  }, [messageType, pain, pacs, pacs009, camt, ibanRegex, bicRegex, currencyRegex]);

  const hint = (key: string, fallback?: string) => hints[key] || fallback;

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(console.error);
  }

  function loadSample() {
    setPain(defaultPain());
    setPacs(defaultPacs());
    setPacs009(defaultPacs009());
    setCamt(defaultCamt());
    setMessageType('pain.001');
    setValidation(null);
    setXml('');
  }

  async function generate() {
    if (!window.isoApi) return;
    if (validationErrors.length > 0) return;
    setBusy(true);
    try {
      const result = await window.isoApi.generate(payload);
      setXml(result.xml);
      setValidation(result.validation);
    } finally {
      setBusy(false);
    }
  }

  async function saveTemplate() {
    if (!window.isoApi) return;
    const metaId = `${payload.type}-${Date.now()}`;
    await window.isoApi.saveTemplate({
      meta: {
        id: metaId,
        name: `${payload.type} template from builder`,
        description: 'Saved from desktop builder',
        type: payload.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      payload,
    });
  }

  async function runBatch() {
    if (!window.isoApi) return;
    const rows = parseCsv(batchCsv);
    if (!rows.length) {
      setBatchStatus('No rows parsed');
      return;
    }
    const payloads = rows.map((row, idx) => mapRowToPayload(messageType, row, idx));
    const results = await window.isoApi.generateBatch(payloads);
    const zip = new JSZip();
    results.forEach((r, idx) => {
      const name = `${r.id || messageType}-${idx + 1}.xml`;
      zip.file(name, r.xml);
    });
    zip.file('validation-report.json', JSON.stringify(results, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${messageType}-batch.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setBatchStatus(`Exported ${results.length} messages`);
  }

  const railInfo = useMemo(() => rails.find((r) => r.id === selectedRail), [rails, selectedRail]);
  const errorClass = (key: string) => (fieldErrors.has(key) ? 'border-danger/70' : '');
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <GlassCard
        title="Build a payment message"
        actions={
          <div className="flex gap-2 items-center">
            <ValidationPill validation={validation || { valid: validationErrors.length === 0, errors: [] }} />
            <button onClick={loadSample} className="btn btn-ghost btn-sm">
              Load sample
            </button>
            <button onClick={saveTemplate} className="btn btn-ghost btn-sm">
              Save template
            </button>
            <button
              onClick={generate}
              disabled={busy || validationErrors.length > 0}
              className="btn btn-primary btn-sm disabled:opacity-60"
            >
              {busy ? 'Generating…' : 'Generate & validate'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-sm relative z-10">
          {showBuilderHint && (
            <InfoStrip
              title="Fill, preview, validate"
              body="Complete required fields, generate to see XML, then export or save as a template. Live validation flags issues inline."
              onDismiss={toggleBuilderHint}
        />
      )}

      {(messageType === 'pacs.008' || messageType === 'pacs.009') && (
        <InfoStrip
          title="Settlement essentials"
          body="Set settlement method (COVE/INDA/etc.), instructing/instructed agent BICs, and an interbank settlement date per transaction. Charges bearer defaults to SHAR."
        />
      )}

      {messageType === 'pacs.002' && (
        <InfoStrip
          title="Status report tips"
          body="Provide original message IDs, group status, and per-transaction status codes/reasons (Cd/Prtry). pacs.002.001.14 expects reasons under Rsn -> Cd."
        />
      )}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted">Rail</label>
              <select value={selectedRail} onChange={(e) => setSelectedRail(e.target.value)} className="mt-1 w-full">
                {rails.map((rail) => (
                  <option key={rail.id} value={rail.id}>
                    {rail.name}
                  </option>
                ))}
              </select>
              {railInfo?.description && <span className="hint">{railInfo.description}</span>}
            </div>
            <div>
              <label className="text-xs text-muted">Message type</label>
              <select value={messageType} onChange={(e) => setMessageType(e.target.value as IsoMessageType)} className="mt-1 w-full">
                <option value="pain.001">pain.001 — Customer Credit Transfer</option>
                <option value="pacs.008">pacs.008 — FI to FI Credit Transfer</option>
                <option value="pacs.009">pacs.009 — Financial Institution Credit Transfer</option>
                <option value="camt.053">camt.053 — Account Statement</option>
              </select>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="p-3 rounded-lg border border-danger/40 bg-danger/10 text-xs text-danger flex flex-col gap-1">
              <span className="font-semibold">Fix before generating:</span>
              {validationErrors.map((err) => (
                <span key={err} className="flex items-center gap-2 text-slate-100">
                  <span className="status-dot danger" />
                  {err}
                </span>
              ))}
            </div>
          )}

          {messageType === 'pain.001' && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted">Message ID</label>
                <input value={pain.messageId} onChange={(e) => setPain({ ...pain, messageId: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted">Creation time</label>
                <input value={pain.creationDateTime} onChange={(e) => setPain({ ...pain, creationDateTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted">Debtor name</label>
                <input value={pain.debtor.name} onChange={(e) => setPain({ ...pain, debtor: { ...pain.debtor, name: e.target.value } })} />
              </div>
              <div>
                <label className="text-xs text-muted">Debtor account (IBAN)</label>
                <input className={errorClass('iban')} value={pain.debtorAccount} onChange={(e) => setPain({ ...pain, debtorAccount: e.target.value })} />
                <span className="hint">{hint('IBAN2007Identifier', 'IBAN 15-34 alphanumeric')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Debtor agent BIC</label>
                <input className={errorClass('bic')} value={pain.debtorAgentBic || ''} onChange={(e) => setPain({ ...pain, debtorAgentBic: e.target.value })} />
                <span className="hint">{hint('BICFIIdentifier', 'BIC 8 or 11 characters')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Execution date</label>
                <input value={pain.requestedExecutionDate} onChange={(e) => setPain({ ...pain, requestedExecutionDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted">Credit amount</label>
                <input
                  className={errorClass('amount')}
                  type="number"
                  value={pain.transactions[0].amount}
                  onChange={(e) => setPain({ ...pain, transactions: [{ ...pain.transactions[0], amount: Number(e.target.value) }] })}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Currency</label>
                <input
                  className={errorClass('currency')}
                  value={pain.transactions[0].currency}
                  onChange={(e) => setPain({ ...pain, transactions: [{ ...pain.transactions[0], currency: e.target.value }] })}
                />
                <span className="hint">{hint('ActiveOrHistoricCurrencyCode', 'Three-letter currency (ISO 4217)')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Creditor name</label>
                <input
                  value={pain.transactions[0].creditor.name}
                  onChange={(e) =>
                    setPain({ ...pain, transactions: [{ ...pain.transactions[0], creditor: { ...pain.transactions[0].creditor, name: e.target.value } }] })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted">Creditor IBAN</label>
                <input
                  className={errorClass('iban')}
                  value={pain.transactions[0].creditorAccount || ''}
                  onChange={(e) => setPain({ ...pain, transactions: [{ ...pain.transactions[0], creditorAccount: e.target.value }] })}
                />
                <span className="hint">{hint('IBAN2007Identifier', 'IBAN 15-34 alphanumeric')}</span>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted">Remittance information</label>
                <input
                  className={errorClass('remittance')}
                  value={pain.transactions[0].remittanceInformation || ''}
                  onChange={(e) => setPain({ ...pain, transactions: [{ ...pain.transactions[0], remittanceInformation: e.target.value }] })}
                />
                <span className="hint">{hint('Max140Text', 'Unstructured note up to 140 chars')}</span>
              </div>
            </div>
          )}

          {messageType === 'pacs.008' && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted">Message ID</label>
                <input value={pacs.messageId} onChange={(e) => setPacs({ ...pacs, messageId: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted">Creation time</label>
                <input value={pacs.creationDateTime} onChange={(e) => setPacs({ ...pacs, creationDateTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted">Settlement method</label>
                <input value={pacs.settlementMethod || ''} onChange={(e) => setPacs({ ...pacs, settlementMethod: e.target.value as Pacs008Payload['settlementMethod'] })} />
              </div>
              <div>
                <label className="text-xs text-muted">Instructing agent BIC</label>
                <input className={errorClass('bic')} value={pacs.instructingAgentBic || ''} onChange={(e) => setPacs({ ...pacs, instructingAgentBic: e.target.value })} />
                <span className="hint">{hint('BICFIIdentifier')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Instructed agent BIC</label>
                <input className={errorClass('bic')} value={pacs.instructedAgentBic || ''} onChange={(e) => setPacs({ ...pacs, instructedAgentBic: e.target.value })} />
                <span className="hint">{hint('BICFIIdentifier')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Amount</label>
                <input
                  className={errorClass('amount')}
                  type="number"
                  value={pacs.transactions[0].amount}
                  onChange={(e) => setPacs({ ...pacs, transactions: [{ ...pacs.transactions[0], amount: Number(e.target.value) }] })}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Currency</label>
                <input className={errorClass('currency')} value={pacs.transactions[0].currency} onChange={(e) => setPacs({ ...pacs, transactions: [{ ...pacs.transactions[0], currency: e.target.value }] })} />
                <span className="hint">{hint('ActiveOrHistoricCurrencyCode')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Debtor name</label>
                <input
                  value={pacs.transactions[0].debtor.name}
                  onChange={(e) => setPacs({ ...pacs, transactions: [{ ...pacs.transactions[0], debtor: { ...pacs.transactions[0].debtor, name: e.target.value } }] })}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Debtor account</label>
                <input
                  className={errorClass('iban')}
                  value={pacs.transactions[0].debtorAccount || ''}
                  onChange={(e) => setPacs({ ...pacs, transactions: [{ ...pacs.transactions[0], debtorAccount: e.target.value }] })}
                />
                <span className="hint">{hint('IBAN2007Identifier')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Creditor name</label>
                <input
                  value={pacs.transactions[0].creditor.name}
                  onChange={(e) => setPacs({ ...pacs, transactions: [{ ...pacs.transactions[0], creditor: { ...pacs.transactions[0].creditor, name: e.target.value } }] })}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Creditor account</label>
                <input
                  className={errorClass('iban')}
                  value={pacs.transactions[0].creditorAccount || ''}
                  onChange={(e) => setPacs({ ...pacs, transactions: [{ ...pacs.transactions[0], creditorAccount: e.target.value }] })}
                />
                <span className="hint">{hint('IBAN2007Identifier')}</span>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted">Remittance</label>
                <input
                  className={errorClass('remittance')}
                  value={pacs.transactions[0].remittanceInformation || ''}
                  onChange={(e) => setPacs({ ...pacs, transactions: [{ ...pacs.transactions[0], remittanceInformation: e.target.value }] })}
                />
                <span className="hint">{hint('Max140Text')}</span>
              </div>
            </div>
          )}

          {messageType === 'pacs.009' && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted">Message ID</label>
                <input value={pacs009.messageId} onChange={(e) => setPacs009({ ...pacs009, messageId: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted">Creation time</label>
                <input value={pacs009.creationDateTime} onChange={(e) => setPacs009({ ...pacs009, creationDateTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted">Instructing agent BIC</label>
                <input className={errorClass('bic')} value={pacs009.instructingAgentBic || ''} onChange={(e) => setPacs009({ ...pacs009, instructingAgentBic: e.target.value })} />
                <span className="hint">{hint('BICFIIdentifier')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Instructed agent BIC</label>
                <input className={errorClass('bic')} value={pacs009.instructedAgentBic || ''} onChange={(e) => setPacs009({ ...pacs009, instructedAgentBic: e.target.value })} />
                <span className="hint">{hint('BICFIIdentifier')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Amount</label>
                <input
                  className={errorClass('amount')}
                  type="number"
                  value={pacs009.transactions[0].amount}
                  onChange={(e) => setPacs009({ ...pacs009, transactions: [{ ...pacs009.transactions[0], amount: Number(e.target.value) }] })}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Currency</label>
                <input className={errorClass('currency')} value={pacs009.transactions[0].currency} onChange={(e) => setPacs009({ ...pacs009, transactions: [{ ...pacs009.transactions[0], currency: e.target.value }] })} />
                <span className="hint">{hint('ActiveOrHistoricCurrencyCode')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Debtor name</label>
                <input
                  value={pacs009.transactions[0].debtor.name}
                  onChange={(e) => setPacs009({ ...pacs009, transactions: [{ ...pacs009.transactions[0], debtor: { ...pacs009.transactions[0].debtor, name: e.target.value } }] })}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Debtor BIC</label>
                <input
                  className={errorClass('bic')}
                  value={pacs009.transactions[0].debtor.bic || ''}
                  onChange={(e) => setPacs009({ ...pacs009, transactions: [{ ...pacs009.transactions[0], debtor: { ...pacs009.transactions[0].debtor, bic: e.target.value } }] })}
                />
                <span className="hint">{hint('BICFIIdentifier')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Debtor account</label>
                <input
                  className={errorClass('iban')}
                  value={pacs009.transactions[0].debtorAccount || ''}
                  onChange={(e) => setPacs009({ ...pacs009, transactions: [{ ...pacs009.transactions[0], debtorAccount: e.target.value }] })}
                />
                <span className="hint">{hint('IBAN2007Identifier')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Creditor name</label>
                <input
                  value={pacs009.transactions[0].creditor.name}
                  onChange={(e) => setPacs009({ ...pacs009, transactions: [{ ...pacs009.transactions[0], creditor: { ...pacs009.transactions[0].creditor, name: e.target.value } }] })}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Creditor BIC</label>
                <input
                  className={errorClass('bic')}
                  value={pacs009.transactions[0].creditor.bic || ''}
                  onChange={(e) => setPacs009({ ...pacs009, transactions: [{ ...pacs009.transactions[0], creditor: { ...pacs009.transactions[0].creditor, bic: e.target.value } }] })}
                />
                <span className="hint">{hint('BICFIIdentifier')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Creditor account</label>
                <input
                  className={errorClass('iban')}
                  value={pacs009.transactions[0].creditorAccount || ''}
                  onChange={(e) => setPacs009({ ...pacs009, transactions: [{ ...pacs009.transactions[0], creditorAccount: e.target.value }] })}
                />
                <span className="hint">{hint('IBAN2007Identifier')}</span>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted">Remittance</label>
                <input
                  className={errorClass('remittance')}
                  value={pacs009.transactions[0].remittanceInformation || ''}
                  onChange={(e) => setPacs009({ ...pacs009, transactions: [{ ...pacs009.transactions[0], remittanceInformation: e.target.value }] })}
                />
                <span className="hint">{hint('Max140Text')}</span>
              </div>
            </div>
          )}

          {messageType === 'camt.053' && (
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted">Message ID</label>
            <input value={camt.messageId} onChange={(e) => setCamt({ ...camt, messageId: e.target.value })} />
          </div>
              <div>
                <label className="text-xs text-muted">Creation time</label>
                <input value={camt.creationDateTime} onChange={(e) => setCamt({ ...camt, creationDateTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted">Account IBAN</label>
                <input className={errorClass('iban')} value={camt.account.iban} onChange={(e) => setCamt({ ...camt, account: { ...camt.account, iban: e.target.value } })} />
                <span className="hint">{hint('IBAN2007Identifier')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Account currency</label>
                <input className={errorClass('currency')} value={camt.account.currency || ''} onChange={(e) => setCamt({ ...camt, account: { ...camt.account, currency: e.target.value } })} />
                <span className="hint">{hint('ActiveOrHistoricCurrencyCode')}</span>
              </div>
              <div>
                <label className="text-xs text-muted">Opening balance</label>
                <input
                  type="number"
                  value={camt.balances?.[0]?.amount || 0}
                  onChange={(e) => setCamt({ ...camt, balances: [{ type: 'OPBD', amount: Number(e.target.value), currency: camt.account.currency || 'EUR' }] })}
                />
              </div>
              <div>
            <label className="text-xs text-muted">Entry amount</label>
            <input
              type="number"
              value={camt.entries?.[0]?.amount || 0}
              onChange={(e) => {
                const baseEntry = camt.entries?.[0] || {
                  amount: 0,
                  currency: camt.account.currency || 'EUR',
                  creditDebit: 'CRDT' as const,
                  bookingDate: new Date().toISOString().slice(0, 10),
                  valueDate: new Date().toISOString().slice(0, 10)
                };
                setCamt({
                  ...camt,
                  entries: [{ ...baseEntry, amount: Number(e.target.value) }]
                });
              }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted">Entry narrative</label>
            <input
              className={errorClass('remittance')}
              value={camt.entries?.[0]?.remittanceInformation || ''}
              onChange={(e) => {
                const baseEntry = camt.entries?.[0] || {
                  amount: 0,
                  currency: camt.account.currency || 'EUR',
                  creditDebit: 'CRDT' as const,
                  bookingDate: new Date().toISOString().slice(0, 10),
                  valueDate: new Date().toISOString().slice(0, 10)
                };
                setCamt({
                  ...camt,
                  entries: [{ ...baseEntry, remittanceInformation: e.target.value }]
                });
              }}
            />
            <span className="hint">{hint('Max140Text')}</span>
          </div>
        </div>
      )}
        </div>
      </GlassCard>

      <GlassCard title="Live XML preview" actions={<ValidationPill validation={validation || { valid: false, errors: [] }} />}>
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Auto-generated as you fill the form.</span>
            {validation && <span>{validation.valid ? 'Valid' : 'Needs fixes'} • {validation.errors.length} issues</span>}
          </div>
          <textarea className="code-block w-full h-96 p-3" value={xml} readOnly placeholder="Generate to see XML" />
          {validation && !validation.valid && (
            <div className="p-3 rounded-lg border border-danger/40 bg-danger/10 text-sm">
              <p className="font-semibold mb-2">Validation issues</p>
              <ul className="space-y-1">
                {validation.errors.map((err, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="status-dot danger" />
                    {err.message} {err.line ? `(line ${err.line})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => xml && navigator.clipboard.writeText(xml)} disabled={!xml}>
              Copy XML
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => xml && window.isoApi?.exportXml(xml, payload.payload.messageId)}
              disabled={!xml}
            >
              Export XML
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard title="Batch generate (CSV)" actions={<span className="text-sm text-muted">messageId,amount,currency,debtorName,debtorIban,creditorName,creditorIban,remittance</span>}>
        <div className="space-y-3 relative z-10">
          <textarea
            className="code-block w-full h-40 p-3"
            value={batchCsv}
            onChange={(e) => setBatchCsv(e.target.value)}
            placeholder="Paste CSV rows here"
          />
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-2">
              <span className="status-dot success" />
              {rails.find((r) => r.id === selectedRail)?.name || 'Profile'} / {messageType}
            </span>
            {railInfo?.profiles?.[0]?.rules?.allowedCurrencies && (
              <span>Allowed currencies: {railInfo.profiles[0].rules.allowedCurrencies.join(', ')}</span>
            )}
          </div>
          <button className="btn btn-primary btn-md" onClick={runBatch}>
            Generate & export zip
          </button>
          {batchStatus && <p className="text-xs text-muted">{batchStatus}</p>}
        </div>
      </GlassCard>
    </div>
  );
}
