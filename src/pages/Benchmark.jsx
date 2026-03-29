import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, SectionHeader, Slider } from '../components/ui.jsx';
import { formatINR, calcSIPFV, calcLumpFV, BENCHMARKS, MF_CATEGORIES } from '../utils/finance.js';

const COLORS = ['var(--accent)', 'var(--green)', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--ink)', padding: '10px 14px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Year {label}</div>
      {payload.sort((a, b) => b.value - a.value).map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatINR(p.value, true)}
        </div>
      ))}
    </div>
  );
};

export default function Benchmark({ sips }) {
  const [years, setYears] = useState(15);
  const [monthly, setMonthly] = useState(10000);
  const [mode, setMode] = useState('sip'); // sip | lump
  const [lump, setLump] = useState(100000);
  const [selected, setSelected] = useState(['Nifty 50', 'Nifty Midcap 150', 'Fixed Deposit']);

  const totalSIP = sips.reduce((s, x) => s + x.amount, 0) || monthly;

  const chartData = useMemo(() => {
    return Array.from({ length: years + 1 }, (_, yr) => {
      const point = { year: yr };
      Object.entries(BENCHMARKS).forEach(([name, { cagr }]) => {
        if (selected.includes(name)) {
          point[name] = mode === 'sip'
            ? Math.round(calcSIPFV(totalSIP, cagr, yr))
            : Math.round(calcLumpFV(lump, cagr, yr));
        }
      });
      // Add user's SIP portfolio avg if they have SIPs
      if (sips.length > 0) {
        const avgReturn = sips.reduce((s, x) => s + x.expectedReturn * x.amount, 0) / sips.reduce((s, x) => s + x.amount, 0);
        point['Your Portfolio'] = mode === 'sip'
          ? Math.round(calcSIPFV(totalSIP, avgReturn, yr))
          : Math.round(calcLumpFV(lump, avgReturn, yr));
      }
      return point;
    });
  }, [years, totalSIP, lump, mode, selected, sips]);

  const finalValues = useMemo(() => {
    const last = chartData[chartData.length - 1] || {};
    return Object.entries(last)
      .filter(([k]) => k !== 'year')
      .sort((a, b) => b[1] - a[1]);
  }, [chartData]);

  const allLines = [...Object.keys(BENCHMARKS).filter(k => selected.includes(k)), ...(sips.length > 0 ? ['Your Portfolio'] : [])];

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <SectionHeader title="Index Benchmark" subtitle="Compare your expected returns against major Indian market indices." />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Settings</div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', marginBottom: 14, background: 'var(--surface-2)', borderRadius: 6, padding: 3 }}>
              {['sip', 'lump'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  flex: 1, padding: '6px 0', borderRadius: 4, fontSize: 12, fontWeight: 500,
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {m === 'sip' ? 'SIP Mode' : 'Lump Sum'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mode === 'sip' ? (
                <Slider label="Monthly SIP" value={totalSIP} onChange={v => {}} min={1000} max={100000} step={1000} format={v => formatINR(v, true)} />
              ) : (
                <Slider label="Lump Sum" value={lump} onChange={setLump} min={10000} max={10000000} step={10000} format={v => formatINR(v, true)} />
              )}
              <Slider label="Time Horizon" value={years} onChange={setYears} min={1} max={30} format={v => `${v} yrs`} />
            </div>
          </Card>

          {/* Index selector */}
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Indices to Compare</div>
            {Object.entries(BENCHMARKS).map(([name, { cagr, color }]) => (
              <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(name)}
                  onChange={e => setSelected(p => e.target.checked ? [...p, name] : p.filter(x => x !== name))}
                  style={{ accentColor: 'var(--accent)', width: 13, height: 13 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{cagr}% avg CAGR</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              </label>
            ))}
            {sips.length > 0 && (
              <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 13, height: 13, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>Your Portfolio</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    {(sips.reduce((s, x) => s + x.expectedReturn * x.amount, 0) / sips.reduce((s, x) => s + x.amount, 0)).toFixed(1)}% weighted avg
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Chart + table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
              Growth Comparison — {years} Year {mode === 'sip' ? `SIP at ${formatINR(totalSIP, true)}/mo` : `Lump Sum of ${formatINR(lump, true)}`}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `Y${v}`} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => formatINR(v, true)} />
                <Tooltip content={<CustomTooltip />} />
                {allLines.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={name === 'Your Portfolio' ? 'var(--accent)' : BENCHMARKS[name]?.color || COLORS[i % COLORS.length]}
                    strokeWidth={name === 'Your Portfolio' ? 2.5 : 1.5}
                    dot={false}
                    strokeDasharray={name === 'Your Portfolio' ? undefined : undefined}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Leaderboard */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Final Value at Year {years}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {finalValues.map(([name, val], i) => {
                const max = finalValues[0][1];
                const pct = (val / max) * 100;
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: name === 'Your Portfolio' ? 600 : 400, color: name === 'Your Portfolio' ? 'var(--accent)' : 'var(--ink)' }}>
                        {i + 1}. {name} {name === 'Your Portfolio' && '⭐'}
                      </span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{formatINR(val, true)}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: name === 'Your Portfolio' ? 'var(--accent)' : BENCHMARKS[name]?.color || 'var(--muted)',
                        borderRadius: 2,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Insight box */}
          <Card style={{ background: 'var(--surface-2)', border: '1px solid rgba(200,135,58,0.2)', padding: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Market Insight</div>
            <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.7 }}>
              Over a {years}-year period, equity markets historically beat FD/PPF by <strong>{(BENCHMARKS['Nifty 50'].cagr - BENCHMARKS['Fixed Deposit'].cagr).toFixed(1)}%</strong> per year.
              Due to compounding, that difference grows significantly — the Nifty 50 would generate <strong>{formatINR(((chartData[years] || {})['Nifty 50'] || 0) - ((chartData[years] || {})['Fixed Deposit'] || 0), true)}</strong> more than FD in this scenario.
              Stay invested through volatility.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}