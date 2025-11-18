import { canonicalToISO20022 } from './canonicalBridge';
import { LoxraCanonicalMessage, validateCanonicalMessage } from './models/canonicalMessage';
import { getExtensionManager } from '@extensions/extensionManager';
import { MessagePayload, IsoMessageType } from '@shared/types';

export type IngestionResult = {
  adapterId?: string;
  canonical?: LoxraCanonicalMessage;
  isoPayload?: MessagePayload;
  warnings?: string[];
  errors?: string[];
  detectedFormat: 'xml' | 'legacy' | 'unknown';
  success: boolean;
  xml?: string;
  isoMessageType?: IsoMessageType;
};

export class MessageIngestionService {
  async ingest(input: string): Promise<IngestionResult> {
    const trimmed = input.trim();
    if (!trimmed) return { detectedFormat: 'unknown', errors: ['Empty input'], success: false };

    // Shortcut for XML: allow existing flow to handle
    if (trimmed.startsWith('<')) {
      return { detectedFormat: 'xml', success: true, xml: input };
    }

    // Legacy detection via adapters
    const extensionManager = getExtensionManager();
    const adapter = extensionManager.getMatchingAdapter(trimmed);
    if (!adapter) {
      return { detectedFormat: 'unknown', errors: ['No adapter matched legacy format'], success: false };
    }

    try {
      const parseResult = await adapter.parseToCanonical(trimmed);
      const validation = validateCanonicalMessage(parseResult.canonical);
      if (!validation.valid) {
        return {
          detectedFormat: 'legacy',
          adapterId: adapter.metadata.id,
          canonical: parseResult.canonical,
          warnings: validation.errors,
          success: false
        };
      }
      const isoPayload = canonicalToISO20022(parseResult.canonical);
      return {
        detectedFormat: 'legacy',
        adapterId: adapter.metadata.id,
        canonical: parseResult.canonical,
        isoPayload,
        isoMessageType: isoPayload.type,
        warnings: parseResult.warnings,
        success: true
      };
    } catch (err: any) {
      return {
        detectedFormat: 'legacy',
        errors: [err?.message || 'Adapter parse failed'],
        success: false
      };
    }
  }
}

let ingestionService: MessageIngestionService | null = null;
export function getIngestionService() {
  if (!ingestionService) ingestionService = new MessageIngestionService();
  return ingestionService;
}
