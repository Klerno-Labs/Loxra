import { LoxraCanonicalMessage } from '@core/models/canonicalMessage';

export interface AdapterMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  supportedMessageTypes: string[];
}

export interface ParseResult {
  adapterId: string;
  metadata: AdapterMetadata;
  canonical: LoxraCanonicalMessage;
  warnings?: string[];
}

export interface ConversionResult {
  adapterId: string;
  legacy: string;
  warnings?: string[];
}

export interface LoxraAdapter {
  metadata: AdapterMetadata;
  canParse(input: string): boolean;
  parseToCanonical(input: string): Promise<ParseResult>;
  fromCanonical(msg: LoxraCanonicalMessage): Promise<ConversionResult>;
}

export abstract class BaseAdapter implements LoxraAdapter {
  abstract metadata: AdapterMetadata;
  abstract canParse(input: string): boolean;
  abstract parseToCanonical(input: string): Promise<ParseResult>;
  abstract fromCanonical(msg: LoxraCanonicalMessage): Promise<ConversionResult>;

  protected cleanLines(input: string) {
    return input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
}
