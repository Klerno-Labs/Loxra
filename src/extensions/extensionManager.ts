import { LoxraAdapter, ParseResult, ConversionResult } from './adapter';
import { loadAllAdapters } from './adapterRegistry';
import { LoxraCanonicalMessage } from '@core/models/canonicalMessage';

type ParseHistory = Array<{
  adapterId: string;
  success: boolean;
  messageType?: string;
  timestamp: number;
  error?: string;
}>;

class ExtensionManager {
  private adapters: LoxraAdapter[] = [];
  private history: ParseHistory = [];

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    this.adapters = loadAllAdapters();
  }

  registerAdapter(adapter: LoxraAdapter) {
    this.adapters.push(adapter);
  }

  listAdapters() {
    return this.adapters.map((a) => a.metadata);
  }

  getMatchingAdapter(input: string): LoxraAdapter | null {
    return this.adapters.find((adapter) => adapter.canParse(input)) || null;
  }

  async parseMessage(input: string): Promise<ParseResult> {
    const adapter = this.getMatchingAdapter(input);
    if (!adapter) {
      throw new Error('No adapter matched the provided input');
    }
    try {
      const result = await adapter.parseToCanonical(input);
      this.history.push({
        adapterId: adapter.metadata.id,
        success: true,
        messageType: result.canonical.messageType,
        timestamp: Date.now()
      });
      return result;
    } catch (err: any) {
      this.history.push({
        adapterId: adapter.metadata.id,
        success: false,
        timestamp: Date.now(),
        error: err?.message
      });
      throw err;
    }
  }

  async convertToLegacy(msg: LoxraCanonicalMessage): Promise<ConversionResult> {
    const adapter = this.adapters.find((a) => a.metadata.supportedMessageTypes.includes(msg.messageType));
    if (!adapter) {
      throw new Error('No adapter registered for message type');
    }
    return adapter.fromCanonical(msg);
  }

  getHistory() {
    return [...this.history];
  }
}

let manager: ExtensionManager | null = null;

export function getExtensionManager() {
  if (!manager) manager = new ExtensionManager();
  return manager;
}
