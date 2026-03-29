import React from 'react';

export function Card({ children, style = {}, className = '', onClick }) {
  return (
    <div className={className} onClick={onClick} style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 20,
      boxShadow: 'var(--shadow-xs)',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, trend, accent = false }) {
  const isPositive = trend > 0;
  return (
    <Card style={{ background: accent ? 'var(--ink)' : 'var(--surface)' }}>
      <div style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.45)' : 'var(--muted)', marginBottom: 8, letterSpacing: '0.02em' }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: accent ? '#fff' : 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}
      </div>
      {(sub || trend !== undefined) && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {trend !== undefined && (
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: isPositive ? 'var(--green)' : 'var(--red)', background: isPositive ? 'var(--green-pale)' : 'var(--red-pale)', padding: '2px 6px', borderRadius: 4 }}>
              {isPositive ? '+' : ''}{trend}%
            </span>
          )}
          {sub && <span style={{ fontSize: 12, color: accent ? 'rgba(255,255,255,0.4)' : 'var(--muted)' }}>{sub}</span>}
        </div>
      )}
    </Card>
  );
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px', color: 'var(--ink)' }}>{title}</h2>
      {subtitle && <p style={{ marginTop: 3, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  );
}

export function Input({ label, value, onChange, type = 'number', prefix, suffix, min, max, step = 'any' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && <span style={{ position: 'absolute', left: 10, fontSize: 13, color: 'var(--muted)', pointerEvents: 'none' }}>{prefix}</span>}
        <input
          type={type} value={value}
          onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          min={min} max={max} step={step}
          style={{
            width: '100%', padding: prefix ? '9px 10px 9px 26px' : '9px 10px',
            paddingRight: suffix ? 32 : 10,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--ink)',
            fontFamily: 'var(--font-mono)', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--ink)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {suffix && <span style={{ position: 'absolute', right: 10, fontSize: 12, color: 'var(--muted)', pointerEvents: 'none' }}>{suffix}</span>}
      </div>
    </div>
  );
}

export function Slider({ label, value, onChange, min, max, step = 1, format, unit = '' }) {
  const [editing, setEditing] = React.useState(false);
  const [inputVal, setInputVal] = React.useState('');
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const startEdit = () => { setInputVal(String(value)); setEditing(true); };
  const commitEdit = () => {
    const parsed = parseFloat(inputVal);
    if (!isNaN(parsed)) onChange(parseFloat(parsed.toFixed(2)));
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</label>
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              autoFocus type="number" value={inputVal} min={min} max={max} step={step}
              onChange={e => setInputVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
              style={{ width: 64, padding: '2px 6px', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--ink)', border: '1px solid var(--ink)', borderRadius: 4, background: 'var(--surface)', textAlign: 'right', outline: 'none' }}
            />
            {unit && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{unit}</span>}
          </div>
        ) : (
          <span
            onClick={startEdit} title="Click to type a value"
            style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--ink)', cursor: 'text', padding: '2px 6px', borderRadius: 4, border: '1px solid transparent', transition: 'all 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
          >
            {format ? format(value) : value}
          </span>
        )}
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%', height: 3, appearance: 'none',
          background: `linear-gradient(to right, var(--ink) ${pct}%, var(--surface-4) ${pct}%)`,
          borderRadius: 2, cursor: 'pointer',
        }}
      />
    </div>
  );
}

export function CurrencyInput({ label, value, onChange, hint }) {
  const fmt = (n) => n > 0 ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n) : '';
  const [display, setDisplay] = React.useState(() => fmt(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setDisplay(fmt(value));
  }, [value, focused]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
    setDisplay(raw === '' ? '' : fmt(parseInt(raw, 10)));
    onChange(raw === '' ? 0 : parseInt(raw, 10));
  };

  const handleFocus = (e) => {
    setFocused(true);
    const raw = display.replace(/,/g, '');
    setDisplay(raw === '0' ? '' : raw);
    e.target.style.borderColor = 'var(--ink)';
  };

  const handleBlur = (e) => {
    setFocused(false);
    const num = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
    setDisplay(fmt(num));
    onChange(num);
    e.target.style.borderColor = 'var(--border)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)', pointerEvents: 'none' }}>₹</span>
        <input
          type="text" inputMode="numeric" value={display}
          onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}
          placeholder="0"
          style={{
            width: '100%', padding: '9px 10px 9px 24px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--ink)',
            fontFamily: 'var(--font-mono)', transition: 'border-color 0.15s',
          }}
        />
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>→ {hint}</div>}
    </div>
  );
}

export function Tag({ children, color = 'default' }) {
  const colors = {
    default: { bg: 'var(--surface-3)', text: 'var(--muted)' },
    green: { bg: 'var(--green-pale)', text: 'var(--green)' },
    red: { bg: 'var(--red-pale)', text: 'var(--red)' },
    amber: { bg: 'var(--amber-pale)', text: 'var(--amber)' },
    blue: { bg: 'var(--blue-pale)', text: 'var(--blue)' },
    black: { bg: 'var(--ink)', text: '#fff' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: c.bg, color: c.text, fontWeight: 500, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}