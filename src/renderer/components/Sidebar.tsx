import type { JSX } from 'react';
import { Link } from 'react-router-dom';

interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: JSX.Element;
}

const nav: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    description: 'Overview & recent activity',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 13.5V6.8a1 1 0 0 1 .9-1l4.2-.6a1 1 0 0 1 1.1 1v7.3a1 1 0 0 1-.9 1l-4.2.6A1 1 0 0 1 4 13.5Z" />
        <path d="M13 11.5V5.5a1 1 0 0 1 .9-1l4.2.6a1 1 0 0 1 .9 1v6a1 1 0 0 1-.9 1l-4.2.6a1 1 0 0 1-.9-1Z" />
        <path d="M4 17.5h16" />
      </svg>
    )
  },
  {
    label: 'Builder',
    href: '/builder',
    description: 'Compose ISO-20022 messages',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4.5 7.5h15" />
        <path d="M6 5.5h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" />
        <path d="M8.5 10.5h7" />
        <path d="M8.5 13.5h4" />
      </svg>
    )
  },
  {
    label: 'Validator',
    href: '/validator',
    description: 'Validate existing XML',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="5" />
        <path d="m13.5 13.5 4 4" />
        <path d="M8 10h4" />
        <path d="M10 8v4" />
      </svg>
    )
  },
  {
    label: 'Templates',
    href: '/templates',
    description: 'Manage templates & history',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5.5 6.5h13" />
        <path d="M6.5 5.5h11a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z" />
        <path d="M8.5 10.5h7" />
        <path d="M8.5 13.5h5" />
      </svg>
    )
  },
  {
    label: 'Settings',
    href: '/settings',
    description: 'Preferences & defaults',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M5.9 7.5 4.5 9" />
        <path d="M18.1 7.5 19.5 9" />
        <path d="M5.9 16.5 4.5 15" />
        <path d="M19.5 15 18.1 16.5" />
        <path d="M12 4.5v2" />
        <path d="M12 17.5v2" />
      </svg>
    )
  }
];

const logoSrc = new URL('../assets/Loxra_tight.png', import.meta.url).toString();

export default function Sidebar({ current }: { current: string }) {
  return (
    <aside className="w-64 border-r border-outline/70 bg-surface-strong/80 backdrop-blur-xl px-6 pt-3 pb-6 space-y-4 hidden md:block relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <img src={logoSrc} alt="Loxra" className="h-16 w-auto drop-shadow-[0_8px_20px_rgba(47,125,246,0.45)]" />
        </div>
        <p className="text-xs text-muted leading-relaxed">Intelligence for the New Financial System.</p>
      </div>
      <nav className="space-y-2 relative">
        {nav.map((item) => {
          const active = current === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`nav-pill block group ${active ? 'active text-white' : 'text-slate-200 hover:text-white'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className={`status-dot ${active ? 'success' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted group-hover:text-slate-100">Go</span>
              </div>
              <p className="text-xs text-muted mt-1">{item.description}</p>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
