import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import { TemplateFile, TemplateMeta } from '@shared/types';

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function loadBundledTemplates(): Promise<TemplateFile[]> {
  const base = app.isPackaged
    ? path.join(process.resourcesPath, 'iso20022', 'templates')
    : path.resolve(process.cwd(), 'resources', 'iso20022', 'templates');
  await ensureDir(base);
  const files = await fs.readdir(base);
  const templates: TemplateFile[] = [];
  for (const file of files.filter((f) => f.endsWith('.json'))) {
    const raw = await fs.readFile(path.join(base, file), 'utf8');
    templates.push(JSON.parse(raw));
  }
  return templates;
}

export async function listUserTemplates(): Promise<TemplateMeta[]> {
  const dir = path.join(app.getPath('userData'), 'templates');
  try {
    const files = await fs.readdir(dir);
    const metas: TemplateMeta[] = [];
    for (const file of files.filter((f) => f.endsWith('.json'))) {
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      const parsed: TemplateFile = JSON.parse(raw);
      metas.push(parsed.meta);
    }
    return metas;
  } catch {
    return [];
  }
}

export async function saveUserTemplate(template: TemplateFile): Promise<void> {
  const dir = path.join(app.getPath('userData'), 'templates');
  await ensureDir(dir);
  const filePath = path.join(dir, `${template.meta.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');
}

export async function loadTemplateById(id: string): Promise<TemplateFile | null> {
  const bundled = await loadBundledTemplates();
  const fromBundle = bundled.find((t) => t.meta.id === id);
  if (fromBundle) return fromBundle;
  const dir = path.join(app.getPath('userData'), 'templates');
  try {
    const raw = await fs.readFile(path.join(dir, `${id}.json`), 'utf8');
    return JSON.parse(raw) as TemplateFile;
  } catch {
    return null;
  }
}

export async function listAllTemplates(): Promise<TemplateMeta[]> {
  const bundled = await loadBundledTemplates();
  const user = await listUserTemplates();
  return [...bundled.map((t) => t.meta), ...user];
}
