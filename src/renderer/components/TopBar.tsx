import { useEffect, useState } from 'react';
import { IsoMessageType } from '@shared/types';

export default function TopBar() {
  const [schemas, setSchemas] = useState<IsoMessageType[]>([]);

  useEffect(() => {
    window.isoApi?.listSchemas().then(setSchemas).catch(() => setSchemas([]));
  }, []);

  return (
    <header className="flex items-center justify-between px-6 pt-5 pb-2">
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Intelligence for the New Financial System.</h2>
          <p className="text-sm text-muted">Build, validate, and inspect ISO-20022 messages locally with full schema compliance.</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted">
        <div className="chip chip-strong">
          <span className="status-dot success" />
          {schemas.length} schemas ready
        </div>
        <div className="chip">
          <span className="status-dot success" />
          Offline-first
        </div>
      </div>
    </header>
  );
}
