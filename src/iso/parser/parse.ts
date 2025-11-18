import { XMLParser } from 'fast-xml-parser';
import { IsoMessageType, ImportResult } from '@shared/types';
import { prettyPrintXml, validateXml } from '../validator';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: true
});

export function detectMessageType(xml: string): IsoMessageType | null {
  const lower = xml.toLowerCase();
  if (lower.includes('camt.053')) return 'camt.053';
  if (lower.includes('pacs.002')) return 'pacs.002';
  if (lower.includes('pacs.008')) return 'pacs.008';
  if (lower.includes('pacs.009')) return 'pacs.009';
  if (lower.includes('pain.001')) return 'pain.001';
  return null;
}

export async function importAndValidateXml(xml: string): Promise<ImportResult> {
  const messageType = detectMessageType(xml) || 'pain.001';
  const parsed = parser.parse(xml);
  const prettyPrinted = await prettyPrintXml(xml);
  const validation = await validateXml(xml, messageType);
  return { parsed, prettyPrinted, validation };
}
