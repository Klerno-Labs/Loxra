import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type ShortcutHandler = () => void;

interface Shortcuts {
  onNew?: ShortcutHandler;
  onSave?: ShortcutHandler;
  onValidate?: ShortcutHandler;
  onExport?: ShortcutHandler;
  onHelp?: ShortcutHandler;
}

export function useKeyboardShortcuts(shortcuts: Shortcuts = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl+S even in inputs
        if (!((e.ctrlKey || e.metaKey) && e.key === 's')) {
          return;
        }
      }

      // Ctrl/Cmd + N - New message
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (shortcuts.onNew) {
          shortcuts.onNew();
        } else {
          navigate('/builder');
        }
      }

      // Ctrl/Cmd + S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        shortcuts.onSave?.();
      }

      // Ctrl/Cmd + Shift + V - Validate
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        if (shortcuts.onValidate) {
          shortcuts.onValidate();
        } else {
          navigate('/validator');
        }
      }

      // Ctrl/Cmd + E - Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        shortcuts.onExport?.();
      }

      // Ctrl/Cmd + / - Help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        shortcuts.onHelp?.();
      }

      // Ctrl/Cmd + 1-5 - Quick navigation
      if ((e.ctrlKey || e.metaKey) && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        const routes = ['/', '/builder', '/validator', '/templates', '/settings'];
        navigate(routes[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, shortcuts]);
}
