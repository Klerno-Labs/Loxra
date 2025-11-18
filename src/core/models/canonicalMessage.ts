import { IsoMessageType } from '@shared/types';

export type CanonicalParty = {
  name: string;
  bic?: string;
  account?: string;
  addressLine?: string;
  country?: string;
};

export type CanonicalAmount = {
  currency: string;
  value: number;
};

export type CanonicalMetadata = Record<string, string | number | boolean>;

export interface LoxraCanonicalMessage {
  messageType: 'credit_transfer' | 'status' | 'statement';
  transactionId: string;
  endToEndId?: string;
  debtor: CanonicalParty;
  creditor: CanonicalParty;
  amount: CanonicalAmount;
  valueDate?: string;
  remittanceInformation?: string;
  status?: {
    code: string;
    reason?: string;
    info?: string;
  };
  isoTarget?: IsoMessageType;
  metadata?: CanonicalMetadata;
}

export function createCanonicalMessage(partial: Partial<LoxraCanonicalMessage>): LoxraCanonicalMessage {
  const base: LoxraCanonicalMessage = {
    messageType: 'credit_transfer',
    transactionId: partial.transactionId || '',
    debtor: partial.debtor || { name: '' },
    creditor: partial.creditor || { name: '' },
    amount: partial.amount || { currency: 'USD', value: 0 },
    valueDate: partial.valueDate,
    remittanceInformation: partial.remittanceInformation,
    endToEndId: partial.endToEndId,
    status: partial.status,
    isoTarget: partial.isoTarget,
    metadata: partial.metadata
  };
  return base;
}

export function validateCanonicalMessage(msg: LoxraCanonicalMessage): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const bicPattern = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  const currencyPattern = /^[A-Z]{3}$/;

  if (!msg.transactionId) errors.push('transactionId is required');
  if (!msg.debtor?.name) errors.push('debtor.name is required');
  if (!msg.creditor?.name) errors.push('creditor.name is required');
  if (!msg.amount || Number.isNaN(msg.amount.value)) errors.push('amount.value is required');
  if (!msg.amount?.currency) errors.push('amount.currency is required');
  if (msg.amount?.currency && !currencyPattern.test(msg.amount.currency)) {
    errors.push('amount.currency must be a 3-letter code');
  }
  if (msg.debtor?.bic && !bicPattern.test(msg.debtor.bic)) errors.push('debtor.bic must be a valid BIC');
  if (msg.creditor?.bic && !bicPattern.test(msg.creditor.bic)) errors.push('creditor.bic must be a valid BIC');
  return { valid: errors.length === 0, errors };
}
