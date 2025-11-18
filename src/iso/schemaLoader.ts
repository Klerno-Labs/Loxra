import path from 'path';
import fs from 'fs';
import { IsoMessageType } from '@shared/types';

const schemaMap: Record<IsoMessageType, string> = {
  'pain.001': 'pain.001.001.11.xsd',
  'pacs.008': 'pacs.008.001.12.xsd',
  'pacs.009': 'pacs.009.001.11.xsd',
  'pacs.002': 'pacs.002.001.14.xsd',
  'camt.053': 'camt.053.001.12.xsd'
};

export function schemaFileFor(type: IsoMessageType): string {
  return schemaMap[type];
}

export function getSchemaPath(type: IsoMessageType): string {
  const fileName = schemaFileFor(type);
  const electronApp = (() => {
    try {
      const { app } = require('electron');
      return app;
    } catch {
      return undefined;
    }
  })();
  const isPackaged = Boolean(electronApp?.isPackaged);
  const resourceDir = isPackaged
    ? path.join(process.resourcesPath, 'iso20022', 'schemas')
    : path.resolve(process.cwd(), 'resources', 'iso20022', 'schemas');

  // Prefer official override file if present (e.g., pacs.002.001.13-official.xsd)
  const overridePath = path.join(resourceDir, fileName.replace('.xsd', '-official.xsd'));
  if (fs.existsSync(overridePath)) {
    return overridePath;
  }

  const fullPath = path.join(resourceDir, fileName);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Schema not found for ${type} at ${fullPath}`);
  }
  return fullPath;
}

export function availableSchemas(): IsoMessageType[] {
  return Object.keys(schemaMap) as IsoMessageType[];
}
