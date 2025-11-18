import { BaseAdapter, ParseResult, ConversionResult } from '../adapter';
import { createCanonicalMessage } from '@core/models/canonicalMessage';

// Minimal MT103-style parser for key tags used in the canonical mapping
// Supported tags: :20: (transaction id), :50K: (ordering customer name/account),
// :59: (beneficiary), :32A: (value date + currency + amount), :70: (remittance)
export class SwiftMt103Adapter extends BaseAdapter {
  metadata = {
    id: 'swift-mt103',
    name: 'SWIFT MT103',
    description: 'Parses core MT103 tags (20, 50K, 59, 32A, 70) into canonical credit transfer',
    version: '1.0.0',
    supportedMessageTypes: ['credit_transfer']
  };

  canParse(input: string): boolean {
    return /:20:/.test(input) && /:59:/.test(input) && /:32A:/.test(input);
  }

  async parseToCanonical(input: string): Promise<ParseResult> {
    const lines = this.cleanLines(input);
    const tagMap: Record<string, string[]> = {};
    let currentTag = '';
    for (const line of lines) {
      const tagMatch = line.match(/^:([0-9A-Z]{2,3}):/);
      if (tagMatch) {
        currentTag = tagMatch[1];
        const content = line.replace(/^:[0-9A-Z]{2,3}:/, '');
        tagMap[currentTag] = [content];
      } else if (currentTag) {
        tagMap[currentTag].push(line);
      }
    }

    const txnId = (tagMap['20'] || [''])[0].trim();
    const remittance = (tagMap['70'] || []).join(' ').trim();
    const debtorRaw = (tagMap['50K'] || []).join(' ').trim();
    const creditorRaw = (tagMap['59'] || []).join(' ').trim();
    const dateCcyAmt = (tagMap['32A'] || [''])[0];
    const date = dateCcyAmt.slice(0, 6); // YYMMDD
    const ccy = dateCcyAmt.slice(6, 9);
    const amtRaw = dateCcyAmt.slice(9).replace(',', '.');

    const debtorParts = debtorRaw.split(/\s+/);
    const creditorParts = creditorRaw.split(/\s+/);

    const canonical = createCanonicalMessage({
      messageType: 'credit_transfer',
      transactionId: txnId || 'MT-' + Date.now(),
      valueDate: date ? `20${date.slice(0, 2)}-${date.slice(2, 4)}-${date.slice(4, 6)}` : undefined,
      amount: { currency: ccy || 'USD', value: Number(amtRaw || 0) },
      debtor: {
        name: debtorParts.slice(1).join(' ') || debtorParts.join(' '),
        account: debtorParts[0]?.startsWith('/') ? debtorParts[0].slice(1) : debtorParts[0]
      },
      creditor: {
        name: creditorParts.slice(1).join(' ') || creditorParts.join(' '),
        account: creditorParts[0]?.startsWith('/') ? creditorParts[0].slice(1) : creditorParts[0]
      },
      remittanceInformation: remittance
    });

    return {
      adapterId: this.metadata.id,
      metadata: this.metadata,
      canonical,
      warnings: []
    };
  }

  async fromCanonical(msg: ReturnType<typeof createCanonicalMessage>): Promise<ConversionResult> {
    const date = msg.valueDate?.replace(/-/g, '').slice(2) || '';
    const lines = [
      ':20:' + msg.transactionId,
      ':32A:' + date + (msg.amount.currency || 'USD') + msg.amount.value,
      ':50K:/' + (msg.debtor.account || '') + '\n' + msg.debtor.name,
      ':59:/' + (msg.creditor.account || '') + '\n' + msg.creditor.name,
      msg.remittanceInformation ? ':70:' + msg.remittanceInformation : ''
    ].filter(Boolean);
    return {
      adapterId: this.metadata.id,
      legacy: lines.join('\n'),
      warnings: []
    };
  }
}
