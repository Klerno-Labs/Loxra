import { useState } from 'react';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  { keys: ['Ctrl', 'N'], description: 'New message (go to Builder)', category: 'Navigation' },
  { keys: ['Ctrl', 'S'], description: 'Save current draft', category: 'Actions' },
  { keys: ['Ctrl', 'Shift', 'V'], description: 'Validate XML (go to Validator)', category: 'Navigation' },
  { keys: ['Ctrl', 'E'], description: 'Export current message', category: 'Actions' },
  { keys: ['Ctrl', '1'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['Ctrl', '2'], description: 'Go to Builder', category: 'Navigation' },
  { keys: ['Ctrl', '3'], description: 'Go to Validator', category: 'Navigation' },
  { keys: ['Ctrl', '4'], description: 'Go to Templates', category: 'Navigation' },
  { keys: ['Ctrl', '5'], description: 'Go to Settings', category: 'Navigation' },
  { keys: ['Ctrl', '/'], description: 'Show this help dialog', category: 'Help' },
];

export function KeyboardShortcutsModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Keyboard Shortcuts</h2>
            <p className="text-sm text-slate-400 mt-1">Speed up your workflow</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-700/30 transition-colors"
                    >
                      <span className="text-slate-300">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, i) => (
                          <kbd
                            key={i}
                            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs font-mono text-slate-200 min-w-[2rem] text-center"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 text-center">
          <p className="text-xs text-slate-500">
            Press <kbd className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs font-mono">/</kbd> anytime to view shortcuts
          </p>
        </div>
      </div>
    </div>
  );
}

export function useShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
