import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { Card, SectionHeader, Input, Slider } from '../components/ui.jsx';
import { formatINR, calcSIPFV, calcSIPInvested, buildSIPProjection, MF_CATEGORIES } from '../utils/finance.js';

const RISK_COLORS = { Low: '#2d6a4f', Moderate: '#c8873a', 'Moderate-High': '#e8a85a', High: '#c1121f', 'Very High': '#8b0000' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--ink)', padding: '10px 14px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.stroke, marginBottom: 2 }}>
          {p.name}: {formatINR(p.value, true)}
        </div>
      ))}
    </div>
  );
};

export default function SIPPlanner({ sips, onSipsChange }) {
  const [showAdd, setShowAdd] = useState(false);
  const [projYears, setProjYears] = useState(15);
  const [newSip, setNewSip] = useState({
    name: '', category: 'Flexi Cap', amount: 5000, expectedReturn: 14,
  });

  const addSIP = () => {
    if (!newSip.name || newSip.amount <= 0) return;
    onSipsChange([...sips, { ...newSip, id: Date.now() }]);
    setNewSip({ name: '', category: 'Flexi Cap', amount: 5000, expectedReturn: 14 });
    setShowAdd(false);
  };

  const removeSIP = (id) => onSipsChange(sips.filter(s => s.id !== id));

  const totalMonthly = sips.reduce((s, x) => s + x.amount, 0);

  const projData = useMemo(() => {
    if (sips.length === 0) return buildSIPProjection(5000, 13, projYears);
    const points = Array.from({ length: projYears + 1 }, (_, yr) => {
      let totalCorpus = 0, totalInvested = 0;
      sips.forEach(s => {
        const fv = calcSIPFV(s.amount, s.expectedReturn, yr);
        const inv = calcSIPInvested(s.amount, yr);
        totalCorpus += fv;
        totalInvested += inv;
      });
      return { label: `Y${yr}`, corpus: Math.round(totalCorpus), invested: Math.round(totalInvested), gains: Math.round(totalCorpus - totalInvested) };
    });
    return points;
  }, [sips, projYears]);

  const finalCorpus = projData[projData.length - 1]?.corpus || 0;
  const finalInvested = projData[projData.length - 1]?.invested || 0;
  const wealthMultiple = finalInvested > 0 ? (finalCorpus / finalInvested).toFixed(1) : '—';

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <SectionHeader title="SIP Planner" subtitle="Add your mutual fund SIPs, track projections, and analyse returns." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* Left: chart + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Monthly SIP', val: formatINR(totalMonthly, true) },
              { label: `Corpus in ${projYears}Y`, val: formatINR(finalCorpus, true) },
              { label: 'Wealth Multiple', val: `${wealthMultiple}×` },
            ].map(({ label, val }) => (
              <Card key={label} style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--accent)' }}>{val}</div>
              </Card>
            ))}
          </div>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Growth Projection</span>
              <div style={{ width: 160 }}>
                <Slider label="" value={projYears} onChange={setProjYears} min={1} max={30} step={1} format={v => `${v} years`} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={projData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--green)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => formatINR(v, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="corpus" name="Corpus" stroke="var(--accent)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="invested" name="Invested" stroke="var(--green)" strokeWidth={1.5} fill="url(#g2)" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Per-fund breakdown */}
          {sips.length > 1 && (
            <Card>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Per-Fund Projected Corpus ({projYears}Y)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sips.map(s => ({
                  name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
                  corpus: Math.round(calcSIPFV(s.amount, s.expectedReturn, projYears)),
                  invested: Math.round(calcSIPInvested(s.amount, projYears)),
                }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => formatINR(v, true)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="corpus" name="Corpus" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="invested" name="Invested" fill="var(--paper-3)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Right: fund list + add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Your SIPs</span>
            <button
              onClick={() => setShowAdd(!showAdd)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 6, fontSize: 12, fontWeight: 500 }}
            >
              <Plus size={13} /> Add SIP
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <Card style={{ background: 'var(--accent-pale)', border: '1px solid var(--accent)', padding: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fund Name</label>
                  <input
                    value={newSip.name}
                    onChange={e => setNewSip(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Mirae Asset Large Cap"
                    style={{ padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</label>
                  <select
                    value={newSip.category}
                    onChange={e => {
                      const cat = MF_CATEGORIES.find(c => c.name === e.target.value);
                      setNewSip(p => ({ ...p, category: e.target.value, expectedReturn: cat?.typical || p.expectedReturn }));
                    }}
                    style={{ padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }}
                  >
                    {MF_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.typical}% avg)</option>)}
                  </select>
                </div>
                <Input label="Monthly Amount (₹)" value={newSip.amount} onChange={v => setNewSip(p => ({ ...p, amount: v }))} prefix="₹" min={500} />
                <Slider label="Expected Return" value={newSip.expectedReturn} onChange={v => setNewSip(p => ({ ...p, expectedReturn: v }))} min={5} max={25} step={0.5} format={v => `${v}%`} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addSIP} style={{ flex: 1, padding: '9px', background: 'var(--ink)', color: 'white', borderRadius: 5, fontSize: 13, fontWeight: 500 }}>Add Fund</button>
                  <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '9px', background: 'transparent', color: 'var(--muted)', borderRadius: 5, fontSize: 13, border: '1px solid var(--border)' }}>Cancel</button>
                </div>
              </div>
            </Card>
          )}

          {/* SIP list */}
          {sips.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              <TrendingUp size={28} style={{ margin: '0 auto 10px', opacity: 0.3, display: 'block' }} />
              <div style={{ fontSize: 13 }}>No SIPs yet. Add your first fund.</div>
            </Card>
          ) : (
            sips.map(s => {
              const cat = MF_CATEGORIES.find(c => c.name === s.category);
              const fv = calcSIPFV(s.amount, s.expectedReturn, projYears);
              const inv = calcSIPInvested(s.amount, projYears);
              return (
                <Card key={s.id} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{s.name}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'var(--paper-2)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{s.category}</span>
                        {cat?.taxBenefit && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'var(--green-pale)', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>80C</span>}
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'var(--accent-pale)', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{s.expectedReturn}%</span>
                      </div>
                    </div>
                    <button onClick={() => removeSIP(s.id)} style={{ background: 'transparent', color: 'var(--muted)', padding: 4 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { l: 'Monthly', v: formatINR(s.amount, true) },
                      { l: `Corpus ${projYears}Y`, v: formatINR(fv, true) },
                      { l: 'Gain', v: `${((fv / inv - 1) * 100).toFixed(0)}%` },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ textAlign: 'center', padding: '6px 0', background: 'var(--paper)', borderRadius: 4 }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--accent)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Risk badge */}
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS[cat?.risk] || 'var(--muted)' }} />
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Risk: {cat?.risk || 'Unknown'}</span>
                  </div>
                </Card>
              );
            })
          )}

          {/* Suggestions */}
          {sips.length > 0 && (
            <Card style={{ background: 'var(--green-pale)', border: '1px solid var(--green-light)', padding: 14 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>💡 Quick Tip</div>
              <div style={{ fontSize: 12, color: '#1b4332', lineHeight: 1.6 }}>
                {sips.every(s => ['Large Cap', 'Index Fund'].includes(s.category))
                  ? 'Consider adding a mid-cap or flexi-cap fund for higher long-term growth potential given your high-risk appetite.'
                  : sips.every(s => ['Small Cap', 'Mid Cap'].includes(s.category))
                  ? 'Your portfolio is high-risk. Consider adding a large-cap or index fund for stability.'
                  : 'Diversified portfolio. Keep adding to hit your monthly SIP target.'}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
