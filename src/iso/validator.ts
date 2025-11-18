import fs from 'fs/promises';
import { IsoMessageType, ValidationIssue, ValidationResult } from '@shared/types';
import { getSchemaPath } from './schemaLoader';
import { create } from 'xmlbuilder2';

const schemaCache = new Map<IsoMessageType, string>();
type LibXmlModule = {
  XmlDocument: typeof import('libxml2-wasm').XmlDocument;
  XsdValidator: typeof import('libxml2-wasm').XsdValidator;
  XmlValidateError: typeof import('libxml2-wasm').XmlValidateError;
};
let libxmlPromise: Promise<LibXmlModule> | null = null;

async function loadLibxml(): Promise<LibXmlModule> {
  if (!libxmlPromise) {
    libxmlPromise = import('libxml2-wasm').then((mod: any) => {
      const m = mod as LibXmlModule;
      return {
        XmlDocument: m.XmlDocument,
        XsdValidator: m.XsdValidator,
        XmlValidateError: m.XmlValidateError
      };
    });
  }
  return libxmlPromise!;
}

async function loadSchemaContent(type: IsoMessageType): Promise<string> {
  if (schemaCache.has(type)) {
    return schemaCache.get(type)!;
  }
  const schemaPath = getSchemaPath(type);
  const content = await fs.readFile(schemaPath, 'utf8');
  schemaCache.set(type, content);
  return content;
}

export async function validateXml(xml: string, type: IsoMessageType): Promise<ValidationResult> {
  const { XmlDocument, XsdValidator, XmlValidateError } = await loadLibxml();
  const XmlValidateErrorCtor = XmlValidateError;
  try {
    const schemaText = await loadSchemaContent(type);
    const xmlDoc = XmlDocument.fromString(xml);
    const xsdDoc = XmlDocument.fromString(schemaText);
    const validator = XsdValidator.fromDoc(xsdDoc);
    validator.validate(xmlDoc);
    return { valid: true, errors: [] };
  } catch (error: any) {
    const issues: ValidationIssue[] = [];
    if (error instanceof XmlValidateErrorCtor && Array.isArray((error as any).details)) {
      for (const detail of (error as any).details) {
        issues.push({
          message: detail.message || 'XSD validation error',
          line: detail.line,
          column: detail.col,
          path: detail.file
        });
      }
    } else if (error instanceof Error) {
      issues.push({ message: error.message });
    } else {
      issues.push({ message: 'Unknown validation error' });
    }
    return { valid: false, errors: issues };
  }
}

export async function prettyPrintXml(xml: string): Promise<string> {
  try {
    const doc = create(xml);
    return doc.end({ prettyPrint: true, indent: '  ' });
  } catch {
    return xml;
  }
}
