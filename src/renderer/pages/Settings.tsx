import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { IsoMessageType } from '@shared/types';

interface Preferences {
  defaultType: IsoMessageType;
  exportFolder?: string;
  strictValidation: boolean;
  telemetry: boolean;
}

const STORAGE_KEY = 'iso-preferences';

export default function Settings() {
  const [prefs, setPrefs] = useState<Preferences>({
    defaultType: 'pain.001',
    strictValidation: true,
    telemetry: false
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setPrefs(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  return (
    <div className="space-y-4">
      <GlassCard title="Preferences">
        <div className="grid md:grid-cols-2 gap-4 relative z-10">
          <div>
            <label className="label">Default message type</label>
            <select
              value={prefs.defaultType}
              onChange={(e) => setPrefs({ ...prefs, defaultType: e.target.value as IsoMessageType })}
              className="mt-1 w-full"
            >
              <option value="pain.001">pain.001</option>
              <option value="pacs.008">pacs.008</option>
              <option value="pacs.009">pacs.009</option>
              <option value="camt.053">camt.053</option>
            </select>
          </div>
          <div>
            <label className="label">Strict validation</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="checkbox"
                checked={prefs.strictValidation}
                onChange={(e) => setPrefs({ ...prefs, strictValidation: e.target.checked })}
              />
              <span className="text-sm text-muted">Fail fast on schema warnings</span>
            </div>
          </div>
          <div>
            <label className="label">Telemetry</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="checkbox"
                checked={prefs.telemetry}
                onChange={(e) => setPrefs({ ...prefs, telemetry: e.target.checked })}
              />
              <span className="text-sm text-muted">Store anonymised local logs only</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
