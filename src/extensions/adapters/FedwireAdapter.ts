import { BaseAdapter, ParseResult, ConversionResult } from '../adapter';
import { createCanonicalMessage } from '@core/models/canonicalMessage';

// Minimal Fedwire-like line parser (for demonstration of production adapter)
// Supports lines like:
// {1500}2024-11-16
// {1510}123456789 DEBTOR NAME
// {1520}987654321 CREDITOR NAME
// {2000}USD1000.50
// {3630}Invoice 123
export class FedwireAdapter extends BaseAdapter {
  metadata = {
    id: 'fedwire-basic',
    name: 'Fedwire',
    description: 'Parses core Fedwire fields (1500 date, 1510 sender, 1520 receiver, 2000 amount, 3630 remittance)',
    version: '1.0.0',
    supportedMessageTypes: ['credit_transfer']
  };

  canParse(input: string): boolean {
    return input.includes('{1500}') && input.includes('{2000}');
  }

  async parseToCanonical(input: string): Promise<ParseResult> {
    const map: Record<string, string> = {};
    const lines = this.cleanLines(input);
    for (const line of lines) {
      const m = line.match(/^\\{(\\d{4})\\}(.*)$/);
      if (m) {
        map[m[1]] = m[2].trim();
      }
    }

    const amountRaw = map['2000'] || '';
    const ccyMatch = amountRaw.match(/^([A-Z]{3})([0-9.]+)/);
    const ccy = ccyMatch?.[1] || 'USD';
    const val = Number((ccyMatch?.[2] || '0').replace(',', '.'));
    const senderParts = (map['1510'] || '').trim().split(/\s+/).filter(Boolean);
    const receiverParts = (map['1520'] || '').trim().split(/\s+/).filter(Boolean);

    const canonical = createCanonicalMessage({
      messageType: 'credit_transfer',
      transactionId: map['3320'] || map['1500'] || 'FW-' + Date.now(),
      valueDate: map['1500'],
      amount: { currency: ccy, value: val },
      debtor: {
        account: senderParts.shift(),
        name: senderParts.join(' ') || 'Sender'
      },
      creditor: {
        account: receiverParts.shift(),
        name: receiverParts.join(' ') || 'Receiver'
      },
      remittanceInformation: map['3630'] || map['6000']
    });

    return {
      adapterId: this.metadata.id,
      metadata: this.metadata,
      canonical,
      warnings: []
    };
  }

  async fromCanonical(msg: ReturnType<typeof createCanonicalMessage>): Promise<ConversionResult> {
    const lines = [
      `{1500}${msg.valueDate || ''}`,
      `{1510}${msg.debtor.account || ''} ${msg.debtor.name}`,
      `{1520}${msg.creditor.account || ''} ${msg.creditor.name}`,
      `{2000}${msg.amount.currency || 'USD'}${msg.amount.value}`,
      msg.remittanceInformation ? `{3630}${msg.remittanceInformation}` : ''
    ].filter(Boolean);
    return {
      adapterId: this.metadata.id,
      legacy: lines.join('\n'),
      warnings: []
    };
  }
}
