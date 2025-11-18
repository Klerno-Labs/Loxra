import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { HistoryEntry, IsoMessageType } from '@shared/types';
import { ValidationPill } from '../components/ValidationPill';

const messageCards: { type: IsoMessageType; title: string; desc: string }[] = [
  { type: 'pain.001', title: 'pain.001', desc: 'Customer Credit Transfer Initiation' },
  { type: 'pacs.008', title: 'pacs.008', desc: 'FI to FI Customer Credit Transfer' },
  { type: 'pacs.009', title: 'pacs.009', desc: 'Financial Institution Credit Transfer' },
  { type: 'pacs.002', title: 'pacs.002', desc: 'Payment Status Report' },
  { type: 'camt.053', title: 'camt.053', desc: 'Bank to Customer Statement' }
];

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    window.isoApi?.listHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  return (
    <div className="space-y-6">
      <GlassCard
        title="Intelligence for the New Financial System."
        actions={<span className="text-sm text-muted">Real-time validation, translation, and structure for global value transfer.</span>}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 relative z-10">
          <div className="text-sm text-muted max-w-2xl leading-relaxed">
            Built for teams who need precision inside every transaction.
          </div>
          <div className="flex gap-2">
            <Link className="btn btn-primary btn-md pulse" to="/builder">
              New message
            </Link>
            <Link className="btn btn-ghost btn-md" to="/validator">
              Validate XML
            </Link>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10" id="features">
          {messageCards.map((card) => (
            <Link
              key={card.type}
              to={`/builder?type=${card.type}`}
              className="block p-4 rounded-2xl border border-outline/50 bg-panel/80 hover:border-accent/60 hover:shadow-glow transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold">{card.title}</h4>
                <span className="text-xs text-muted">{card.type}</span>
              </div>
              <p className="text-sm text-muted">{card.desc}</p>
              <p className="text-xs text-muted mt-2">Start with guided fields, live XML, and inline validation.</p>
            </Link>
          ))}
        </div>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard title="Recent messages" actions={<Link to="/templates" className="text-sm text-accent">Open history</Link>}>
          {history.length === 0 && (
            <p className="text-muted text-sm">No history yet. Generate or validate a message to start your audit trail.</p>
          )}
          <ul className="space-y-3 relative z-10">
            {history.slice(0, 5).map((item) => (
              <li key={item.id} className="border border-outline/50 rounded-xl p-3 flex items-center justify-between bg-surface/60">
                <div>
                  <p className="font-medium">{item.type}</p>
                  <p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <ValidationPill validation={item.validation} />
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard title="First run helper">
          <ol className="text-sm text-muted space-y-2 relative z-10 list-decimal list-inside">
            <li>Pick a rail and message type, then fill required fields (hints inline).</li>
            <li>Generate to see live XML preview and validation; fix any highlighted issues.</li>
            <li>Export XML or save as a template for reuse; validate incoming XML anytime.</li>
          </ol>
        </GlassCard>
      </div>
    </div>
  );
}
