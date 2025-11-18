import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import { RailAdapter, IsoMessageType } from '@shared/types';

async function loadFromDir(dir: string): Promise<RailAdapter[]> {
  try {
    const files = await fs.readdir(dir);
    const adapters: RailAdapter[] = [];
    for (const file of files.filter((f) => f.endsWith('.json'))) {
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      adapters.push(JSON.parse(raw));
    }
    return adapters;
  } catch {
    return [];
  }
}

export async function loadRailAdapters(): Promise<RailAdapter[]> {
  const base = app.isPackaged
    ? path.join(process.resourcesPath, 'iso20022', 'rails')
    : path.resolve(process.cwd(), 'resources', 'iso20022', 'rails');
  return loadFromDir(base);
}

export async function listRailProfiles(): Promise<{ adapter: RailAdapter; profileId: string }[]> {
  const adapters = await loadRailAdapters();
  return adapters.flatMap((a) => a.profiles.map((p) => ({ adapter: a, profileId: p.id })));
}

export async function findDefaultProfile(type: IsoMessageType) {
  const adapters = await loadRailAdapters();
  for (const adapter of adapters) {
    const profile = adapter.profiles.find((p) => p.defaultMessageType === type);
    if (profile) return { adapter, profile };
  }
  return null;
}
