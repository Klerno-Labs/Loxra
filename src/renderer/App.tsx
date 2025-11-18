import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import Validator from './pages/Validator';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import { useThemeStore } from './stores/themeStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal, useShortcutsModal } from './components/KeyboardShortcutsModal';

function AppShell() {
  const location = useLocation();
  const theme = useThemeStore((state) => state.theme);
  const shortcutsModal = useShortcutsModal();
  
  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Global keyboard shortcuts with help modal
  useKeyboardShortcuts({
    onHelp: shortcutsModal.open,
  });

  return (
    <div className="flex min-h-screen text-slate-100">
      <Sidebar current={location.pathname} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-6 space-y-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/validator" element={<Validator />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <KeyboardShortcutsModal isOpen={shortcutsModal.isOpen} onClose={shortcutsModal.close} />
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
