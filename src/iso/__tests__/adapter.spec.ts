import { describe, it, expect } from 'vitest';
import { validateCanonicalMessage } from '@core/models/canonicalMessage';
import { SwiftMt103Adapter } from '@extensions/adapters/SwiftMt103Adapter';
import { FedwireAdapter } from '@extensions/adapters/FedwireAdapter';
import { AchNachAdapter } from '@extensions/adapters/AchNachAdapter';
import { getExtensionManager } from '@extensions/extensionManager';
import { canonicalToISO20022 } from '@core/canonicalBridge';

describe('Adapter system', () => {
  const mt103Sample = `:20:12345
:32A:241116EUR1000,50
:50K:/DE12345
SENDER CO
:59:/DE54321
RECEIVER CO
:70:Invoice 123`;

  const fedwireSample = `{1500}2024-11-16
{1510}123456789 SENDER CO
{1520}987654321 RECEIVER CO
{2000}USD1000.50
{3630}Invoice 123`;

  const achSample = 'ACH|TXN_ID=ACH1|DEBTOR=Sender Co|DEBTOR_ACC=111|CREDITOR=Receiver Co|CREDITOR_ACC=222|AMOUNT=150.75|CCY=USD|REMIT=Payroll';

  it('parses MT103 to canonical and converts to ISO payload', async () => {
    const adapter = new SwiftMt103Adapter();
    expect(adapter.canParse(mt103Sample)).toBe(true);
    const parse = await adapter.parseToCanonical(mt103Sample);
    const validation = validateCanonicalMessage(parse.canonical);
    expect(validation.valid).toBe(true);
    const payload = canonicalToISO20022(parse.canonical);
    expect(payload.type).toBe('pacs.008');
    expect(payload.payload.messageId).toBe('12345');
  });

  it('parses Fedwire to canonical and converts to ISO payload', async () => {
    const adapter = new FedwireAdapter();
    expect(adapter.canParse(fedwireSample)).toBe(true);
    const parse = await adapter.parseToCanonical(fedwireSample);
    const validation = validateCanonicalMessage(parse.canonical);
    expect(validation.valid).toBe(true);
    const payload = canonicalToISO20022(parse.canonical);
    expect(payload.type).toBe('pacs.008');
    expect(payload.payload.messageId).toBeTruthy();
  });

  it('parses ACH to canonical and converts to ISO payload', async () => {
    const adapter = new AchNachAdapter();
    expect(adapter.canParse(achSample)).toBe(true);
    const parse = await adapter.parseToCanonical(achSample);
    const validation = validateCanonicalMessage(parse.canonical);
    expect(validation.valid).toBe(true);
    const payload = canonicalToISO20022(parse.canonical);
    expect(payload.type).toBe('pacs.008');
    expect(payload.payload.messageId).toBeTruthy();
  });

  it('extension manager detects and parses MT103', async () => {
    const manager = getExtensionManager();
    const result = await manager.parseMessage(mt103Sample);
    expect(result.adapterId).toBe('swift-mt103');
    expect(result.canonical.transactionId).toBe('12345');
  });
});
