import fs from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';
import { IsoMessageType } from '@shared/types';
import { getSchemaPath } from './schemaLoader';

const hintCache = new Map<IsoMessageType, Record<string, string>>();

function toConstraint(restriction: any): string | null {
  const maxLength = restriction.maxLength?.['@_value'];
  const minLength = restriction.minLength?.['@_value'];
  const pattern = restriction.pattern?.['@_value'];
  const constraints: string[] = [];
  if (minLength) constraints.push(`min ${minLength} chars`);
  if (maxLength) constraints.push(`max ${maxLength} chars`);
  if (pattern) constraints.push(`pattern ${pattern}`);
  if (constraints.length === 0) return null;
  return constraints.join(', ');
}

export async function loadHints(type: IsoMessageType): Promise<Record<string, string>> {
  if (hintCache.has(type)) return hintCache.get(type)!;
  const schemaPath = getSchemaPath(type);
  const xml = await fs.readFile(schemaPath, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', removeNSPrefix: true });
  const parsed = parser.parse(xml);
  const simpleTypes = parsed.schema?.simpleType || [];
  const elements = parsed.schema?.element || [];
  const hints: Record<string, string> = {};
  const elementTypeMap: Record<string, string> = {};

  const simpleList = Array.isArray(simpleTypes) ? simpleTypes : [simpleTypes];
  for (const entry of simpleList) {
    if (!entry?.restriction) continue;
    const name = entry['@_name'];
    const constraint = toConstraint(entry.restriction);
    if (name && constraint) {
      hints[name] = constraint;
    }
  }

  const addElementMap = (el: any) => {
    if (!el?.['@_name']) return;
    const typeName = el['@_type'];
    if (typeName) elementTypeMap[el['@_name']] = typeName.replace('tns:', '');
  };

  const walkElements = (el: any) => {
    if (Array.isArray(el)) {
      el.forEach(addElementMap);
    } else {
      addElementMap(el);
    }
  };

  walkElements(elements);
  if (parsed.schema?.complexType) {
    const ct = parsed.schema.complexType;
    const list = Array.isArray(ct) ? ct : [ct];
    for (const c of list) {
      if (!c?.sequence?.element) continue;
      walkElements(c.sequence.element);
    }
  }

  Object.entries(elementTypeMap).forEach(([element, typeName]) => {
    if (hints[typeName]) {
      hints[element] = hints[typeName];
    }
  });

  hintCache.set(type, hints);
  return hints;
}
