import React from 'react';
import { TrendingUp, Target, BarChart3, Wallet, MessageCircle, PieChart, Upload, Users } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Wallet },
  { id: 'import', label: 'Import', icon: Upload, badge: 'NEW' },
  { id: 'sip', label: 'SIP Planner', icon: TrendingUp },
  { id: 'retirement', label: 'Retirement', icon: Target },
  { id: 'benchmark', label: 'Benchmark', icon: BarChart3 },
  { id: 'networth', label: 'Net Worth', icon: PieChart },
  { id: 'spouse', label: 'Spouse', icon: Users },
  { id: 'advisor', label: 'AI Advisor', icon: MessageCircle },
];

export default function Sidebar({ active, onNav, spouse }) {
  return (
    <aside style={{
      width: 220, minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.4px' }}>
          WealthWise
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2, letterSpacing: '0.02em' }}>
          Personal Finance
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const isSpouse = id === 'spouse';
          const spouseName = spouse?.name?.trim();
          const displayLabel = isSpouse && spouseName ? spouseName : label;
          const isActive = active === id;

          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 'var(--radius)',
                marginBottom: 1,
                background: isActive ? 'var(--surface-3)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--muted)',
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                transition: 'all 0.1s', textAlign: 'left',
                border: 'none',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; } }}
            >
              <Icon size={14} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ flex: 1 }}>{displayLabel}</span>
              {badge && (
                <span style={{ fontSize: 9, background: 'var(--ink)', color: 'white', padding: '2px 5px', borderRadius: 3, fontWeight: 500, letterSpacing: '0.05em' }}>
                  {badge}
                </span>
              )}
              {isSpouse && !spouseName && (
                <span style={{ fontSize: 9, color: 'var(--muted-2)', padding: '2px 5px', borderRadius: 3, border: '1px solid var(--border)', letterSpacing: '0.03em' }}>
                  ADD
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--muted-2)', lineHeight: 1.5 }}>
        For personal use only.<br />Not financial advice.
      </div>
    </aside>
  );
}