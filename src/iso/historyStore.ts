import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import { HistoryEntry, ValidationResult, IsoMessageType } from '@shared/types';

const HISTORY_FILE = 'history.json';

async function historyPath(): Promise<string> {
  const dir = path.join(app.getPath('userData'), 'history');
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, HISTORY_FILE);
}

export async function appendHistory(entry: HistoryEntry): Promise<void> {
  const file = await historyPath();
  const current = await loadHistory();
  const next = [entry, ...current].slice(0, 50);
  await fs.writeFile(file, JSON.stringify(next, null, 2), 'utf8');
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const file = await historyPath();
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function buildHistoryEntry(
  id: string,
  type: IsoMessageType,
  validation: ValidationResult,
  path?: string
): HistoryEntry {
  return {
    id,
    type,
    createdAt: new Date().toISOString(),
    validation,
    path
  };
}
