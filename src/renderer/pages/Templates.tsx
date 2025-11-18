import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { HistoryEntry, TemplateFile, TemplateMeta } from '@shared/types';
import { ValidationPill } from '../components/ValidationPill';

export default function Templates() {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<TemplateFile | null>(null);
  const [xml, setXml] = useState('');

  useEffect(() => {
    window.isoApi?.listTemplates().then(setTemplates).catch(() => setTemplates([]));
    window.isoApi?.listHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  async function loadTemplate(id: string) {
    if (!window.isoApi) return;
    const template = await window.isoApi.loadTemplate(id);
    if (!template) return;
    setSelected(template);
    const result = await window.isoApi.generate(template.payload);
    setXml(result.xml);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <GlassCard title="Templates">
        <ul className="space-y-3 relative z-10">
          {templates.map((tpl) => (
            <li key={tpl.id} className="border border-outline/50 rounded-xl p-3 flex items-center justify-between bg-panel/70">
              <div className="flex items-center gap-3">
                <span className="status-dot success" />
                <div>
                  <p className="font-semibold">{tpl.name}</p>
                  <p className="text-xs text-muted">{tpl.type} • Updated {new Date(tpl.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => loadTemplate(tpl.id)}>
                Load
              </button>
            </li>
          ))}
          {templates.length === 0 && (
            <p className="text-muted text-sm">No templates yet. Load a sample in the Builder, then save it here for reuse.</p>
          )}
        </ul>
      </GlassCard>

      <GlassCard
        title="Preview"
        actions={
          <button
            disabled={!xml}
            className="btn btn-primary btn-sm"
            onClick={() => xml && window.isoApi?.exportXml(xml, selected?.meta.name || 'message')}
          >
            Export
          </button>
        }
      >
        <div className="space-y-3 relative z-10">
          {selected && (
            <div className="text-sm text-muted">
              <p className="font-semibold text-slate-50">{selected.meta.name}</p>
              <p>{selected.meta.description}</p>
            </div>
          )}
          <textarea className="code-block w-full h-72 p-3" value={xml} readOnly placeholder="Load a template to preview" />
        </div>
      </GlassCard>

      <GlassCard title="History" actions={<span className="text-sm text-muted">Recent validations</span>}>
        <ul className="space-y-3 relative z-10">
          {history.slice(0, 6).map((item) => (
            <li key={item.id} className="border border-outline/50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`status-dot ${item.validation?.valid ? 'success' : 'danger'}`} />
                <div>
                  <p className="font-medium">{item.type}</p>
                  <p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <ValidationPill validation={item.validation} />
            </li>
          ))}
          {history.length === 0 && <p className="text-sm text-muted">Generate or validate to build the audit log.</p>}
        </ul>
      </GlassCard>
    </div>
  );
}
