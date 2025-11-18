export type IsoMessageType = 'pain.001' | 'pacs.008' | 'pacs.009' | 'pacs.002' | 'camt.053';

export interface BaseMessageMeta {
  messageId: string;
  creationDateTime: string;
  initiatingParty?: string;
  batchBooking?: boolean;
}

export interface Party {
  name: string;
  bic?: string;
  iban?: string;
  accountCurrency?: string;
  addressLine?: string;
}

export interface TransactionLine {
  endToEndId: string;
  amount: number;
  currency: string;
  debtor: Party;
  debtorAccount?: string;
  creditor: Party;
  creditorAccount?: string;
  remittanceInformation?: string;
  requestedExecutionDate?: string;
  chargesBearer?: 'DEBT' | 'CRED' | 'SHAR' | 'SLEV';
  ultimateDebtor?: Party;
  ultimateCreditor?: Party;
  purposeCode?: string;
}

export interface Pain001Payload extends BaseMessageMeta {
  serviceLevel?: string;
  requestedExecutionDate: string;
  debtor: Party;
  debtorAccount: string;
  debtorAgentBic?: string;
  transactions: TransactionLine[];
}

export interface Pacs008Payload extends BaseMessageMeta {
  settlementMethod?: 'CLRG' | 'INDA' | 'INGS' | 'COVE' | 'INDA';
  instructedAgentBic?: string;
  instructingAgentBic?: string;
  transactions: TransactionLine[];
}

export interface Pacs009Payload extends BaseMessageMeta {
  settlementMethod?: 'CLRG' | 'INDA' | 'INGS' | 'COVE' | 'INDA';
  instructedAgentBic?: string;
  instructingAgentBic?: string;
  transactions: TransactionLine[];
}

export interface Pacs002Payload extends BaseMessageMeta {
  originalMessageId: string;
  originalMessageNameId: string;
  groupStatus?: 'ACTC' | 'ACCP' | 'ACSC' | 'ACSP' | 'RJCT' | 'PDNG';
  statusReasonCode?: string;
  statusReasonInformation?: string;
  transactions?: {
    originalEndToEndId: string;
    originalTransactionId?: string;
    transactionStatus: 'ACTC' | 'ACCP' | 'ACSC' | 'ACSP' | 'RJCT' | 'PDNG';
    statusReasonCode?: string;
    statusReasonInformation?: string;
    chargeBearer?: 'DEBT' | 'CRED' | 'SHAR' | 'SLEV';
  }[];
}

export interface Camt053Payload extends BaseMessageMeta {
  account: {
    iban: string;
    currency?: string;
    name?: string;
  };
  institutionBic?: string;
  balances?: { type: 'OPBD' | 'CLBD' | 'ITBD'; amount: number; currency: string }[];
  entries?: {
    amount: number;
    currency: string;
    creditDebit: 'CRDT' | 'DBIT';
    bookingDate: string;
    valueDate: string;
    remittanceInformation?: string;
    purposeCode?: string;
  }[];
}

export type MessagePayload =
  | { type: 'pain.001'; payload: Pain001Payload }
  | { type: 'pacs.008'; payload: Pacs008Payload }
  | { type: 'pacs.009'; payload: Pacs009Payload }
  | { type: 'pacs.002'; payload: Pacs002Payload }
  | { type: 'camt.053'; payload: Camt053Payload };

export interface ValidationIssue {
  message: string;
  path?: string;
  line?: number;
  column?: number;
  xpath?: string;
  severity?: 'error' | 'warning';
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
}

export interface TemplateMeta {
  id: string;
  name: string;
  description?: string;
  type: IsoMessageType;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFile {
  meta: TemplateMeta;
  payload: MessagePayload;
}

export interface HistoryEntry {
  id: string;
  type: IsoMessageType;
  createdAt: string;
  validation: ValidationResult;
  path?: string;
}

export interface ImportResult {
  parsed: Record<string, unknown>;
  prettyPrinted: string;
  validation: ValidationResult;
}

export interface IsoApi {
  generate(payload: MessagePayload): Promise<{ xml: string; validation: ValidationResult }>;
  generateBatch(payloads: MessagePayload[]): Promise<{ xml: string; validation: ValidationResult; id: string }[]>;
  validate(xml: string, type: IsoMessageType): Promise<ValidationResult>;
  parse(xml: string): Promise<ImportResult>;
  listTemplates(): Promise<TemplateMeta[]>;
  saveTemplate(template: TemplateFile): Promise<void>;
  loadTemplate(id: string): Promise<TemplateFile | null>;
  listSchemas(): Promise<IsoMessageType[]>;
  listHistory(): Promise<HistoryEntry[]>;
  exportXml(xml: string, suggestedName: string): Promise<string>;
  getHints(type: IsoMessageType): Promise<Record<string, string>>;
  listRails(): Promise<RailAdapter[]>;
}

declare global {
  interface Window {
    isoApi?: IsoApi;
  }
}
export interface RailProfile {
  id: string;
  name: string;
  description?: string;
  schemaVersion: string;
  defaultMessageType: IsoMessageType;
  rules?: {
    requiredFields?: string[];
    allowedCurrencies?: string[];
    country?: string;
  };
}

export interface RailAdapter {
  id: string;
  name: string;
  description?: string;
  profiles: RailProfile[];
}

