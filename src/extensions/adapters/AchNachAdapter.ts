import { BaseAdapter, ParseResult, ConversionResult } from '../adapter';
import { createCanonicalMessage } from '@core/models/canonicalMessage';

// Minimal ACH/NACHA-style key/value parser:
// ACH|TXN_ID=ACH1|DEBTOR=Sender Co|DEBTOR_ACC=111|CREDITOR=Receiver Co|CREDITOR_ACC=222|AMOUNT=150.75|CCY=USD|REMIT=Payroll
export class AchNachAdapter extends BaseAdapter {
  metadata = {
    id: 'ach-nacha',
    name: 'ACH / NACHA Basic',
    description: 'Parses simple ACH-style key/value strings into canonical credit transfer',
    version: '1.0.0',
    supportedMessageTypes: ['credit_transfer']
  };

  canParse(input: string): boolean {
    return input.startsWith('ACH|');
  }

  async parseToCanonical(input: string): Promise<ParseResult> {
    const parts = input.replace(/^ACH\|/, '').split('|');
    const map: Record<string, string> = {};
    for (const p of parts) {
      const [k, ...rest] = p.split('=');
      if (k && rest.length) map[k.trim().toUpperCase()] = rest.join('=').trim();
    }

    const canonical = createCanonicalMessage({
      messageType: 'credit_transfer',
      transactionId: map['TXN_ID'] || 'ACH-' + Date.now(),
      debtor: { name: map['DEBTOR'] || '', account: map['DEBTOR_ACC'] },
      creditor: { name: map['CREDITOR'] || '', account: map['CREDITOR_ACC'] },
      amount: { currency: map['CCY'] || 'USD', value: Number(map['AMOUNT'] || 0) },
      remittanceInformation: map['REMIT']
    });

    return {
      adapterId: this.metadata.id,
      metadata: this.metadata,
      canonical,
      warnings: []
    };
  }

  async fromCanonical(msg: ReturnType<typeof createCanonicalMessage>): Promise<ConversionResult> {
    const legacy = [
      'ACH',
      `TXN_ID=${msg.transactionId}`,
      `DEBTOR=${msg.debtor.name}`,
      `DEBTOR_ACC=${msg.debtor.account || ''}`,
      `CREDITOR=${msg.creditor.name}`,
      `CREDITOR_ACC=${msg.creditor.account || ''}`,
      `AMOUNT=${msg.amount.value}`,
      `CCY=${msg.amount.currency}`,
      msg.remittanceInformation ? `REMIT=${msg.remittanceInformation}` : ''
    ]
      .filter(Boolean)
      .join('|');
    return { adapterId: this.metadata.id, legacy, warnings: [] };
  }
}
