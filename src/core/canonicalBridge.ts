import { LoxraCanonicalMessage } from './models/canonicalMessage';
import {
  MessagePayload,
  Pain001Payload,
  Pacs008Payload,
  Pacs009Payload,
  Pacs002Payload
} from '@shared/types';

function toPain001(msg: LoxraCanonicalMessage): Pain001Payload {
  return {
    messageId: msg.transactionId,
    creationDateTime: new Date().toISOString(),
    debtor: { name: msg.debtor.name, bic: msg.debtor.bic, iban: msg.debtor.account },
    debtorAccount: msg.debtor.account || '',
    requestedExecutionDate: msg.valueDate || new Date().toISOString().slice(0, 10),
    transactions: [
      {
        endToEndId: msg.endToEndId || msg.transactionId,
        amount: msg.amount.value,
        currency: msg.amount.currency,
        debtor: { name: msg.debtor.name, bic: msg.debtor.bic, iban: msg.debtor.account },
        debtorAccount: msg.debtor.account || '',
        creditor: { name: msg.creditor.name, bic: msg.creditor.bic, iban: msg.creditor.account },
        creditorAccount: msg.creditor.account || '',
        remittanceInformation: msg.remittanceInformation
      }
    ]
  };
}

function toPacs008(msg: LoxraCanonicalMessage): Pacs008Payload {
  const txn = {
    endToEndId: msg.endToEndId || msg.transactionId,
    amount: msg.amount.value,
    currency: msg.amount.currency,
    debtor: { name: msg.debtor.name, bic: msg.debtor.bic, iban: msg.debtor.account },
    debtorAccount: msg.debtor.account || '',
    creditor: { name: msg.creditor.name, bic: msg.creditor.bic, iban: msg.creditor.account },
    creditorAccount: msg.creditor.account || '',
    remittanceInformation: msg.remittanceInformation
  };
  return {
    messageId: msg.transactionId,
    creationDateTime: new Date().toISOString(),
    transactions: [txn],
    settlementMethod: 'COVE'
  };
}

function toPacs009(msg: LoxraCanonicalMessage): Pacs009Payload {
  const txn = {
    endToEndId: msg.endToEndId || msg.transactionId,
    amount: msg.amount.value,
    currency: msg.amount.currency,
    debtor: { name: msg.debtor.name, bic: msg.debtor.bic, iban: msg.debtor.account },
    debtorAccount: msg.debtor.account || '',
    creditor: { name: msg.creditor.name, bic: msg.creditor.bic, iban: msg.creditor.account },
    creditorAccount: msg.creditor.account || '',
    remittanceInformation: msg.remittanceInformation
  };
  return {
    messageId: msg.transactionId,
    creationDateTime: new Date().toISOString(),
    transactions: [txn],
    settlementMethod: 'COVE'
  };
}

function toPacs002(msg: LoxraCanonicalMessage): Pacs002Payload {
  return {
    messageId: msg.transactionId,
    creationDateTime: new Date().toISOString(),
    originalMessageId: msg.metadata?.originalMessageId?.toString() || msg.transactionId,
    originalMessageNameId: msg.metadata?.originalMessageNameId?.toString() || 'pacs.008',
    groupStatus: (msg.status?.code as Pacs002Payload['groupStatus']) || 'ACTC',
    statusReasonCode: msg.status?.reason,
    statusReasonInformation: msg.status?.info
  };
}

export function canonicalToISO20022(msg: LoxraCanonicalMessage): MessagePayload {
  const target = msg.isoTarget || (msg.messageType === 'status' ? 'pacs.002' : 'pacs.008');
  switch (target) {
    case 'pain.001':
      return { type: 'pain.001', payload: toPain001(msg) };
    case 'pacs.009':
      return { type: 'pacs.009', payload: toPacs009(msg) };
    case 'pacs.002':
      return { type: 'pacs.002', payload: toPacs002(msg) };
    case 'pacs.008':
    default:
      return { type: 'pacs.008', payload: toPacs008(msg) };
  }
}
