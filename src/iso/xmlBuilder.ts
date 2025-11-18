import { create } from 'xmlbuilder2';
import {
  MessagePayload,
  IsoMessageType,
  Pain001Payload,
  Pacs008Payload,
  Pacs009Payload,
  Camt053Payload,
  Pacs002Payload
} from '@shared/types';

function amountString(value: number): string {
  return value.toFixed(2);
}

function addAddress(parent: any, addressLine?: string) {
  if (!addressLine) return;
  const adr = parent.ele('PstlAdr');
  adr.ele('AdrLine').txt(addressLine);
}

function addUltimate(parent: any, tag: string, party?: { name?: string; addressLine?: string }) {
  if (!party?.name) return;
  const ult = parent.ele(tag);
  ult.ele('Nm').txt(party.name);
  addAddress(ult, party.addressLine);
}

function addPurpose(parent: any, code?: string) {
  if (!code) return;
  const purp = parent.ele('Purp');
  purp.ele('Cd').txt(code);
}

function addStatusReason(parent: any, code?: string, info?: string) {
  if (!code && !info) return;
  const reason = parent.ele('StsRsnInf');
  if (code) {
    const rsn = reason.ele('Rsn');
    rsn.ele('Cd').txt(code);
  }
  if (info) {
    reason.ele('AddtlInf').txt(info);
  }
}

function buildPain001(payload: Pain001Payload): string {
  const txs = payload.transactions || [];
  const ctrlSum = txs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.11' })
    .ele('CstmrCdtTrfInitn');

  const grpHdr = doc.ele('GrpHdr');
  grpHdr.ele('MsgId').txt(payload.messageId);
  grpHdr.ele('CreDtTm').txt(payload.creationDateTime);
  grpHdr.ele('NbOfTxs').txt(String(txs.length || 0));
  grpHdr.ele('CtrlSum').txt(amountString(ctrlSum));
  const initg = grpHdr.ele('InitgPty');
  initg.ele('Nm').txt(payload.initiatingParty || payload.debtor.name);

  const pmtInf = doc.ele('PmtInf');
  pmtInf.ele('PmtInfId').txt(`${payload.messageId}-PI1`);
  pmtInf.ele('PmtMtd').txt('TRF');
  if (payload.batchBooking !== undefined) {
    pmtInf.ele('BtchBookg').txt(payload.batchBooking ? 'true' : 'false');
  }
  pmtInf.ele('NbOfTxs').txt(String(txs.length || 0));
  pmtInf.ele('CtrlSum').txt(amountString(ctrlSum));
  const pmtTpInf = pmtInf.ele('PmtTpInf');
  if (payload.serviceLevel) {
    const svc = pmtTpInf.ele('SvcLvl');
    svc.ele('Cd').txt(payload.serviceLevel);
  }
  pmtInf.ele('ReqdExctnDt').txt(payload.requestedExecutionDate);

  const dbtr = pmtInf.ele('Dbtr');
  dbtr.ele('Nm').txt(payload.debtor.name);
  addAddress(dbtr, payload.debtor.addressLine);

  const dbtrAcct = pmtInf.ele('DbtrAcct');
  dbtrAcct.ele('Id').ele('IBAN').txt(payload.debtorAccount);
  if (payload.debtor.accountCurrency) {
    dbtrAcct.ele('Ccy').txt(payload.debtor.accountCurrency);
  }

  if (payload.debtorAgentBic) {
    const dbtrAgt = pmtInf.ele('DbtrAgt');
    dbtrAgt.ele('FinInstnId').ele('BICFI').txt(payload.debtorAgentBic);
  }
  if (txs[0]?.chargesBearer) {
    pmtInf.ele('ChrgBr').txt(txs[0].chargesBearer);
  }

  txs.forEach((tx, idx) => {
    const cdt = pmtInf.ele('CdtTrfTxInf');
    const pmtId = cdt.ele('PmtId');
    pmtId.ele('EndToEndId').txt(tx.endToEndId || `E2E-${idx + 1}`);

    const amt = cdt.ele('Amt');
    amt.ele('InstdAmt', { Ccy: tx.currency }).txt(amountString(tx.amount));

    if (tx.chargesBearer) {
      cdt.ele('ChrgBr').txt(tx.chargesBearer);
    }

    if (tx.creditor?.bic) {
      const cdtrAgt = cdt.ele('CdtrAgt');
      cdtrAgt.ele('FinInstnId').ele('BICFI').txt(tx.creditor.bic);
    }

    const cdtr = cdt.ele('Cdtr');
    cdtr.ele('Nm').txt(tx.creditor.name);
    addAddress(cdtr, tx.creditor.addressLine);

    if (tx.creditorAccount || tx.creditor.iban) {
      const acct = cdt.ele('CdtrAcct');
      acct
        .ele('Id')
        .ele('IBAN')
        .txt(tx.creditorAccount || tx.creditor.iban || '');
    }

    addUltimate(cdt, 'UltmtCdtr', tx.ultimateCreditor);

    if (tx.debtor?.bic) {
      const dbtrAgtTx = cdt.ele('DbtrAgt');
      dbtrAgtTx.ele('FinInstnId').ele('BICFI').txt(tx.debtor.bic);
    }
    if (tx.debtor?.name) {
      const dbtrTx = cdt.ele('Dbtr');
      dbtrTx.ele('Nm').txt(tx.debtor.name);
      addAddress(dbtrTx, tx.debtor.addressLine);
    }
    addUltimate(cdt, 'UltmtDbtr', tx.ultimateDebtor);
    addPurpose(cdt, tx.purposeCode);

    if (tx.remittanceInformation) {
      const rmt = cdt.ele('RmtInf');
      rmt.ele('Ustrd').txt(tx.remittanceInformation);
    }
  });

  return doc.end({ prettyPrint: true });
}

function buildPacs008(payload: Pacs008Payload): string {
  const txs = payload.transactions || [];
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:pacs.008.001.12' })
    .ele('FIToFICstmrCdtTrf');

  const grpHdr = doc.ele('GrpHdr');
  grpHdr.ele('MsgId').txt(payload.messageId);
  grpHdr.ele('CreDtTm').txt(payload.creationDateTime);
  grpHdr.ele('NbOfTxs').txt(String(txs.length || 0));
  const ctrlSum = txs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  grpHdr.ele('CtrlSum').txt(amountString(ctrlSum));
  const sttlm = grpHdr.ele('SttlmInf');
  sttlm.ele('SttlmMtd').txt(payload.settlementMethod || 'COVE');

  if (payload.instructingAgentBic) {
    grpHdr
      .ele('InstgAgt')
      .ele('FinInstnId')
      .ele('BICFI')
      .txt(payload.instructingAgentBic);
  }
  if (payload.instructedAgentBic) {
    grpHdr
      .ele('InstdAgt')
      .ele('FinInstnId')
      .ele('BICFI')
      .txt(payload.instructedAgentBic);
  }

  txs.forEach((tx, idx) => {
    const cdt = doc.ele('CdtTrfTxInf');
    const pmtId = cdt.ele('PmtId');
    pmtId.ele('InstrId').txt(`INST-${idx + 1}`);
    pmtId.ele('EndToEndId').txt(tx.endToEndId || `E2E-${idx + 1}`);
    pmtId.ele('TxId').txt(`${payload.messageId}-${idx + 1}`);

    cdt.ele('IntrBkSttlmAmt', { Ccy: tx.currency }).txt(amountString(tx.amount));
    const sttlmDate = tx.requestedExecutionDate || payload.creationDateTime.slice(0, 10);
    cdt.ele('IntrBkSttlmDt').txt(sttlmDate);
    cdt.ele('ChrgBr').txt(tx.chargesBearer || 'SHAR');

    const dbtr = cdt.ele('Dbtr');
    dbtr.ele('Nm').txt(tx.debtor.name);
    const dbtrAcct = cdt.ele('DbtrAcct');
    dbtrAcct.ele('Id').ele('IBAN').txt(tx.debtorAccount || tx.debtor.iban || '');
    const dbtrAgt = cdt.ele('DbtrAgt');
    dbtrAgt.ele('FinInstnId').ele('BICFI').txt(tx.debtor.bic || payload.instructingAgentBic || '');

    const cdtrAgt = cdt.ele('CdtrAgt');
    cdtrAgt.ele('FinInstnId').ele('BICFI').txt(tx.creditor.bic || payload.instructedAgentBic || '');

    const cdtr = cdt.ele('Cdtr');
    cdtr.ele('Nm').txt(tx.creditor.name);
    const cdtrAcct = cdt.ele('CdtrAcct');
    cdtrAcct.ele('Id').ele('IBAN').txt(tx.creditorAccount || tx.creditor.iban || '');

    addUltimate(cdt, 'UltmtDbtr', tx.ultimateDebtor);
    addUltimate(cdt, 'UltmtCdtr', tx.ultimateCreditor);
    addPurpose(cdt, tx.purposeCode);

    if (tx.remittanceInformation) {
      const rmtInf = cdt.ele('RmtInf');
      rmtInf.ele('Ustrd').txt(tx.remittanceInformation);
    }
  });

  return doc.end({ prettyPrint: true });
}

function buildPacs009(payload: Pacs009Payload): string {
  const txs = payload.transactions || [];
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:pacs.009.001.11' })
    .ele('FICdtTrf');

  const grpHdr = doc.ele('GrpHdr');
  grpHdr.ele('MsgId').txt(payload.messageId);
  grpHdr.ele('CreDtTm').txt(payload.creationDateTime);
  grpHdr.ele('NbOfTxs').txt(String(txs.length || 0));
  const sttlmInfo = grpHdr.ele('SttlmInf');
  sttlmInfo.ele('SttlmMtd').txt(payload.settlementMethod || 'COVE');
  const sttlmDate = payload.creationDateTime.slice(0, 10);

  txs.forEach((tx, idx) => {
    const cdt = doc.ele('CdtTrfTxInf');
    const pmtId = cdt.ele('PmtId');
    pmtId.ele('InstrId').txt(`P009-${idx + 1}`);
    pmtId.ele('EndToEndId').txt(tx.endToEndId || `E2E-${idx + 1}`);
    pmtId.ele('TxId').txt(`${payload.messageId}-${idx + 1}`);

    cdt.ele('IntrBkSttlmAmt', { Ccy: tx.currency }).txt(amountString(tx.amount));
    cdt.ele('IntrBkSttlmDt').txt(tx.requestedExecutionDate || sttlmDate);
    // Charges bearer not required in pacs.009.001.11; omit to satisfy minimal schema

    const dbtr = cdt.ele('Dbtr');
    const dbtrFin = dbtr.ele('FinInstnId');
    if (tx.debtor.bic || payload.instructingAgentBic) {
      dbtrFin.ele('BICFI').txt(tx.debtor.bic || payload.instructingAgentBic || '');
    }
    if (tx.debtor.name) {
      dbtrFin.ele('Nm').txt(tx.debtor.name);
    }

    const cdtrAgt = cdt.ele('CdtrAgt');
    cdtrAgt.ele('FinInstnId').ele('BICFI').txt(tx.creditor.bic || payload.instructedAgentBic || '');

    const cdtr = cdt.ele('Cdtr');
    const cdtrFin = cdtr.ele('FinInstnId');
    if (tx.creditor.bic || payload.instructedAgentBic) {
      cdtrFin.ele('BICFI').txt(tx.creditor.bic || payload.instructedAgentBic || '');
    }
    if (tx.creditor.name) {
      cdtrFin.ele('Nm').txt(tx.creditor.name);
    }

    addUltimate(cdt, 'UltmtDbtr', tx.ultimateDebtor);
    addUltimate(cdt, 'UltmtCdtr', tx.ultimateCreditor);
    addPurpose(cdt, tx.purposeCode);

    if (tx.remittanceInformation) {
      const rmtInf = cdt.ele('RmtInf');
      rmtInf.ele('Ustrd').txt(tx.remittanceInformation);
    }
  });

  return doc.end({ prettyPrint: true });
}

function buildCamt053(payload: Camt053Payload): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.12' })
    .ele('BkToCstmrStmt');

  const grpHdr = doc.ele('GrpHdr');
  grpHdr.ele('MsgId').txt(payload.messageId);
  grpHdr.ele('CreDtTm').txt(payload.creationDateTime);

  const stmt = doc.ele('Stmt');
  stmt.ele('Id').txt(`${payload.messageId}-STMT`);
  stmt.ele('CreDtTm').txt(payload.creationDateTime);

  const acct = stmt.ele('Acct');
  const acctId = acct.ele('Id');
  acctId.ele('IBAN').txt(payload.account.iban);
  if (payload.account.currency) {
    acct.ele('Ccy').txt(payload.account.currency);
  }
  if (payload.account.name) {
    acct.ele('Nm').txt(payload.account.name);
  }

  (payload.balances || []).forEach((bal) => {
    const balEle = stmt.ele('Bal');
    const tp = balEle.ele('Tp');
    const cdOr = tp.ele('CdOrPrtry');
    cdOr.ele('Cd').txt(bal.type);
    balEle.ele('Amt', { Ccy: bal.currency }).txt(amountString(bal.amount));
    balEle.ele('CdtDbtInd').txt('CRDT');
    const dt = balEle.ele('Dt');
    dt.ele('Dt').txt(payload.creationDateTime.slice(0, 10));
  });

  (payload.entries || []).forEach((entry, idx) => {
    const ntry = stmt.ele('Ntry');
    ntry.ele('Amt', { Ccy: entry.currency }).txt(amountString(entry.amount));
    ntry.ele('CdtDbtInd').txt(entry.creditDebit);
    ntry.ele('Sts').ele('Cd').txt('BOOK');
    const book = ntry.ele('BookgDt');
    book.ele('Dt').txt(entry.bookingDate);
    const val = ntry.ele('ValDt');
    val.ele('Dt').txt(entry.valueDate || entry.bookingDate);
    ntry.ele('AcctSvcrRef').txt(`REF-${idx + 1}`);
    const bkTxCd = ntry.ele('BkTxCd');
    const domn = bkTxCd.ele('Domn');
    domn.ele('Cd').txt('PMNT');
    const fmly = domn.ele('Fmly');
    fmly.ele('Cd').txt('RCDT');
    fmly.ele('SubFmlyCd').txt('ESCT');
    const details = ntry.ele('NtryDtls');
    const txDtls = details.ele('TxDtls');
    const refs = txDtls.ele('Refs');
    refs.ele('EndToEndId').txt(`NTRY-${idx + 1}`);
    const amtDtls = txDtls.ele('AmtDtls');
    const txAmt = amtDtls.ele('TxAmt');
    txAmt.ele('Amt', { Ccy: entry.currency }).txt(amountString(entry.amount));
    if (entry.remittanceInformation) {
      const rmt = txDtls.ele('RmtInf');
      rmt.ele('Ustrd').txt(entry.remittanceInformation);
    }
    if (entry.purposeCode) {
      const purp = txDtls.ele('Purp');
      purp.ele('Cd').txt(entry.purposeCode);
    }
  });

  return doc.end({ prettyPrint: true });
}

function buildPacs002(payload: Pacs002Payload): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:pacs.002.001.14' })
    .ele('FIToFIPmtStsRpt');

  const grpHdr = doc.ele('GrpHdr');
  grpHdr.ele('MsgId').txt(payload.messageId);
  grpHdr.ele('CreDtTm').txt(payload.creationDateTime);

  const org = doc.ele('OrgnlGrpInfAndSts');
  org.ele('OrgnlMsgId').txt(payload.originalMessageId);
  org.ele('OrgnlMsgNmId').txt(payload.originalMessageNameId);
  if (payload.groupStatus) {
    org.ele('GrpSts').txt(payload.groupStatus);
  }
  addStatusReason(org, payload.statusReasonCode, payload.statusReasonInformation);

  (payload.transactions || []).forEach((tx) => {
    const txInf = doc.ele('TxInfAndSts');
    if (tx.originalEndToEndId) txInf.ele('OrgnlEndToEndId').txt(tx.originalEndToEndId);
    if (tx.originalTransactionId) txInf.ele('OrgnlTxId').txt(tx.originalTransactionId);
    if (tx.transactionStatus) txInf.ele('TxSts').txt(tx.transactionStatus);
    addStatusReason(txInf, tx.statusReasonCode, tx.statusReasonInformation);
    if (tx.chargeBearer) {
      txInf.ele('AddtlTxInf').txt(`Charge bearer: ${tx.chargeBearer}`);
    }
  });

  return doc.end({ prettyPrint: true });
}

export function buildIso20022Xml(message: MessagePayload): string {
  switch (message.type) {
    case 'pain.001':
      return buildPain001(message.payload as Pain001Payload);
    case 'pacs.008':
      return buildPacs008(message.payload as Pacs008Payload);
    case 'pacs.009':
      return buildPacs009(message.payload as Pacs009Payload);
    case 'pacs.002':
      return buildPacs002(message.payload as Pacs002Payload);
    case 'camt.053':
      return buildCamt053(message.payload as Camt053Payload);
    default:
      const exhaustive: never = message as never;
      throw new Error(`Unsupported type ${(exhaustive as any)?.type ?? 'unknown'}`);
  }
}

export function namespaceFor(type: IsoMessageType): string {
  const map: Record<IsoMessageType, string> = {
    'pain.001': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.11',
    'pacs.008': 'urn:iso:std:iso:20022:tech:xsd:pacs.008.001.12',
    'pacs.009': 'urn:iso:std:iso:20022:tech:xsd:pacs.009.001.11',
    'pacs.002': 'urn:iso:std:iso:20022:tech:xsd:pacs.002.001.14',
    'camt.053': 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.12'
  };
  return map[type];
}
