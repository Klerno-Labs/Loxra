import { contextBridge, ipcRenderer } from 'electron';
import { IsoApi, IsoMessageType, MessagePayload, TemplateFile } from '@shared/types';

const api: IsoApi = {
  generate: (payload: MessagePayload) => ipcRenderer.invoke('iso:generate', payload),
  validate: (xml: string, type: IsoMessageType) => ipcRenderer.invoke('iso:validate', { xml, type }),
  parse: (xml: string) => ipcRenderer.invoke('iso:parse', xml),
  listTemplates: () => ipcRenderer.invoke('iso:templates:list'),
  saveTemplate: (template: TemplateFile) => ipcRenderer.invoke('iso:templates:save', template),
  loadTemplate: (id: string) => ipcRenderer.invoke('iso:templates:load', id),
  listSchemas: () => ipcRenderer.invoke('iso:schemas:list'),
  listHistory: () => ipcRenderer.invoke('iso:history:list'),
  getHints: (type: IsoMessageType) => ipcRenderer.invoke('iso:hints', type),
  listRails: () => ipcRenderer.invoke('iso:rails:list'),
  generateBatch: (payloads: MessagePayload[]) => ipcRenderer.invoke('iso:batch:generate', payloads),
  exportXml: (xml: string, suggestedName: string) => ipcRenderer.invoke('iso:export', { xml, suggestedName })
};

contextBridge.exposeInMainWorld('isoApi', api);
