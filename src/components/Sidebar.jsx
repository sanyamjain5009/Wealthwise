import React from 'react';
import { TrendingUp, Target, BarChart3, Wallet, MessageCircle, PieChart, Upload } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Wallet },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'sip', label: 'SIP Planner', icon: TrendingUp },
  { id: 'retirement', label: 'Retirement', icon: Target },
  { id: 'benchmark', label: 'Benchmark', icon: BarChart3 },
  { id: 'networth', label: 'Net Worth', icon: PieChart },
  { id: 'advisor', label: 'AI Advisor', icon: MessageCircle },
];

export default function Sidebar({ active, onNav }) {
  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'var(--ink)',
      display: 'flex', flexDirection: 'column', position: 'fixed',
      left: 0, top: 0, bottom: 0, zIndex: 100,
    }}>
      <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--paper)', letterSpacing: '-0.5px' }}>
          Wealth<span style={{ color: 'var(--accent)' }}>Wise</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          PERSONAL FINANCE
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNav(id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 6, marginBottom: 2,
              background: active === id ? 'rgba(200,135,58,0.15)' : 'transparent',
              color: active === id ? 'var(--accent-light)' : 'rgba(255,255,255,0.5)',
              fontSize: 13.5, fontWeight: active === id ? 500 : 400,
              transition: 'all 0.15s ease', textAlign: 'left',
              border: active === id ? '1px solid rgba(200,135,58,0.2)' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (active !== id) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
            onMouseLeave={e => { if (active !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
          >
            <Icon size={15} strokeWidth={active === id ? 2 : 1.5} />
            {label}
            {id === 'import' && <span style={{ marginLeft: 'auto', fontSize: 9, background: 'var(--accent)', color: 'white', padding: '1px 5px', borderRadius: 3, fontFamily: 'var(--font-mono)' }}>NEW</span>}
          </button>
        ))}
      </nav>

      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>
        FOR PERSONAL USE ONLY<br />NOT FINANCIAL ADVICE
      </div>
    </aside>
  );
} 