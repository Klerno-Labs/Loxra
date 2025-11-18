import { BaseAdapter, ParseResult, ConversionResult } from '../adapter';
import { createCanonicalMessage } from '@core/models/canonicalMessage';

/**
 * AdapterTemplate
 * Copy this file, rename the class and filename, and implement your parsing logic.
 */
export class AdapterTemplate extends BaseAdapter {
  metadata = {
    id: 'template-id',
    name: 'Template Adapter',
    description: 'Describe the legacy format this adapter supports',
    version: '1.0.0',
    supportedMessageTypes: ['credit_transfer']
  };

  canParse(_input: string): boolean {
    // TODO: Detect your legacy format
    return false;
  }

  async parseToCanonical(_input: string): Promise<ParseResult> {
    // TODO: Parse legacy input into canonical fields
    const canonical = createCanonicalMessage({
      messageType: 'credit_transfer',
      transactionId: 'REPLACE',
      debtor: { name: 'REPLACE' },
      creditor: { name: 'REPLACE' },
      amount: { currency: 'USD', value: 0 }
    });

    return {
      adapterId: this.metadata.id,
      metadata: this.metadata,
      canonical,
      warnings: []
    };
  }

  async fromCanonical(_msg: ReturnType<typeof createCanonicalMessage>): Promise<ConversionResult> {
    // TODO: Convert canonical back to legacy string
    return {
      adapterId: this.metadata.id,
      legacy: 'REPLACE',
      warnings: []
    };
  }
}
