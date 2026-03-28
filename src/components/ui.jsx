import React from 'react';

export function Card({ children, style = {}, className = '', onClick }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, trend, accent = false }) {
  const isPositive = trend > 0;
  return (
    <Card style={{ background: accent ? 'var(--ink)' : 'white' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: accent ? 'rgba(255,255,255,0.4)' : 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: accent ? 'var(--paper)' : 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}
      </div>
      {(sub || trend !== undefined) && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          {trend !== undefined && (
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: isPositive ? 'var(--green)' : 'var(--red)', background: isPositive ? 'var(--green-pale)' : 'var(--red-pale)', padding: '2px 6px', borderRadius: 3 }}>
              {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
          {sub && <span style={{ fontSize: 12, color: accent ? 'rgba(255,255,255,0.35)' : 'var(--muted)' }}>{sub}</span>}
        </div>
      )}
    </Card>
  );
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, letterSpacing: '-0.5px', color: 'var(--ink)' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ marginTop: 4, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{subtitle}</p>
      )}
    </div>
  );
}

export function Input({ label, value, onChange, type = 'number', prefix, suffix, min, max, step = 'any' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.07em', color: 'var(--muted)', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{ position: 'absolute', left: 12, fontSize: 13, color: 'var(--muted)', pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          min={min}
          max={max}
          step={step}
          style={{
            width: '100%',
            padding: prefix ? '10px 12px 10px 28px' : '10px 12px',
            paddingRight: suffix ? 36 : 12,
            background: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 12, fontSize: 12, color: 'var(--muted)', pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

export function Slider({ label, value, onChange, min, max, step = 1, format, unit = '' }) {
  const [editing, setEditing] = React.useState(false);
  const [inputVal, setInputVal] = React.useState('');
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const startEdit = () => {
    setInputVal(String(value));
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseFloat(inputVal);
    if (!isNaN(parsed)) {
      // Allow values outside slider range when typed manually
      onChange(parseFloat(parsed.toFixed(2)));
    }
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.07em', color: 'var(--muted)', textTransform: 'uppercase' }}>
          {label}
        </label>
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              autoFocus
              type="number"
              value={inputVal}
              min={min}
              max={max}
              step={step}
              onChange={e => setInputVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
              style={{
                width: 72, padding: '3px 6px', fontSize: 13, fontFamily: 'var(--font-mono)',
                fontWeight: 600, color: 'var(--accent)', border: '1px solid var(--accent)',
                borderRadius: 4, background: 'var(--accent-pale)', textAlign: 'right', outline: 'none',
              }}
            />
            {unit && <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{unit}</span>}
          </div>
        ) : (
          <span
            onClick={startEdit}
            title="Click to type a custom value"
            style={{
              fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)',
              cursor: 'text', padding: '2px 6px', borderRadius: 4, border: '1px solid transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-pale)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
          >
            {format ? format(value) : value}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%', height: 4, appearance: 'none',
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--paper-3) ${pct}%)`,
          borderRadius: 2, cursor: 'pointer',
        }}
      />
    </div>
  );
}

// Comma-formatted Indian currency input — fixed version
export function CurrencyInput({ label, value, onChange, hint }) {
  const fmt = (n) => n > 0 ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n) : '';
  const [display, setDisplay] = React.useState(() => fmt(value));
  const [focused, setFocused] = React.useState(false);

  // Only sync from parent when not actively typing
  React.useEffect(() => {
    if (!focused) {
      setDisplay(fmt(value));
    }
  }, [value, focused]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
    // Update display with commas (or empty if cleared)
    setDisplay(raw === '' ? '' : fmt(parseInt(raw, 10)));
    // Send numeric value up — 0 if empty
    onChange(raw === '' ? 0 : parseInt(raw, 10));
  };

  const handleFocus = (e) => {
    setFocused(true);
    // Show plain number while editing for easier selection
    const raw = display.replace(/,/g, '');
    setDisplay(raw === '0' ? '' : raw);
    e.target.style.borderColor = 'var(--accent)';
  };

  const handleBlur = (e) => {
    setFocused(false);
    // Reformat with commas on blur
    const raw = e.target.value.replace(/,/g, '');
    const num = parseInt(raw, 10) || 0;
    setDisplay(fmt(num));
    onChange(num);
    e.target.style.borderColor = 'var(--border)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.07em', color: 'var(--muted)', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 12, fontSize: 13, color: 'var(--muted)', pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>₹</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0"
          style={{
            width: '100%',
            padding: '10px 12px 10px 28px',
            background: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono)',
            transition: 'border-color 0.15s',
          }}
        />
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
          → {hint}
        </div>
      )}
    </div>
  );
}