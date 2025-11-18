import { dialog, type IpcMain } from 'electron';
import fs from 'fs/promises';
import { buildIso20022Xml } from '@iso/xmlBuilder';
import { availableSchemas } from '@iso/schemaLoader';
import { importAndValidateXml } from '@iso/parser/parse';
import { validateXml } from '@iso/validator';
import { appendHistory, buildHistoryEntry, loadHistory } from '@iso/historyStore';
import { listAllTemplates, loadTemplateById, saveUserTemplate } from '@iso/templateStore';
import { loadRailAdapters } from '@iso/railAdapters';
import { loadHints } from '@iso/hints';
import { IsoMessageType, MessagePayload, TemplateFile } from '@shared/types';

export function registerIsoHandlers(ipc: IpcMain) {
  ipc.handle('iso:generate', async (_event, payload: MessagePayload) => {
    const xml = buildIso20022Xml(payload);
    const validation = await validateXml(xml, payload.type);
    await appendHistory(buildHistoryEntry(payload.payload.messageId, payload.type, validation));
    return { xml, validation };
  });

  ipc.handle('iso:validate', async (_event, { xml, type }: { xml: string; type: IsoMessageType }) => {
    const validation = await validateXml(xml, type);
    await appendHistory(buildHistoryEntry(`manual-${Date.now()}`, type, validation));
    return validation;
  });

  ipc.handle('iso:parse', async (_event, xml: string) => {
    return importAndValidateXml(xml);
  });

  ipc.handle('iso:templates:list', async () => listAllTemplates());
  ipc.handle('iso:templates:load', async (_event, id: string) => loadTemplateById(id));
  ipc.handle('iso:templates:save', async (_event, template: TemplateFile) => {
    return saveUserTemplate(template);
  });
  ipc.handle('iso:schemas:list', async () => availableSchemas());
  ipc.handle('iso:history:list', async () => loadHistory());
  ipc.handle('iso:hints', async (_event, type: IsoMessageType) => loadHints(type));
  ipc.handle('iso:rails:list', async () => loadRailAdapters());

  ipc.handle('iso:batch:generate', async (_event, payloads: MessagePayload[]) => {
    const results: { xml: string; validation: any; id: string }[] = [];
    for (const p of payloads) {
      const xml = buildIso20022Xml(p);
      const validation = await validateXml(xml, p.type);
      results.push({ xml, validation, id: p.payload.messageId });
      await appendHistory(buildHistoryEntry(p.payload.messageId, p.type, validation));
    }
    return results;
  });

  ipc.handle('iso:export', async (_event, { xml, suggestedName }: { xml: string; suggestedName: string }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: `${suggestedName}.xml`,
      filters: [{ name: 'XML', extensions: ['xml'] }]
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    await fs.writeFile(result.filePath, xml, 'utf8');
    return result.filePath;
  });
}
