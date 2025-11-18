import { ReactNode } from 'react';

export default function GlassCard({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="glass-panel p-6 relative overflow-hidden">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          {title && <h3 className="font-semibold text-lg">{title}</h3>}
          <div className="flex gap-2">{actions}</div>
        </div>
        {children}
      </div>
      <div className="card-band z-0" />
    </div>
  );
}
