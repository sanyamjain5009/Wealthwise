import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { Card, SectionHeader, CurrencyInput, Slider } from '../components/ui.jsx';
import { formatINR, calcSIPFV, calcSIPInvested, buildSIPProjection, MF_CATEGORIES, BENCHMARKS } from '../utils/finance.js';
import { FundPerformanceCard } from '../components/FundPerformance.jsx';

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
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
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

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({ ...s });
  };

  const saveEdit = () => {
    onSipsChange(sips.map(s => s.id === editingId ? { ...s, ...editForm } : s));
    setEditingId(null);
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 26, fontWeight: 400, letterSpacing: '-0.5px', color: 'var(--ink)', marginBottom: 4 }}>SIP Planner</h2>
          <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>Add your mutual fund SIPs, track projections, and analyse returns.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--ink)', color: 'var(--surface)', borderRadius: 8, fontSize: 13, fontWeight: 600, flexShrink: 0, marginTop: 4 }}
        >
          <Plus size={15} /> Add SIP
        </button>
      </div>

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
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>{val}</div>
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
                    <stop offset="0%" stopColor="#000" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#000" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--green)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => formatINR(v, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="corpus" name="Corpus" stroke="#000" strokeWidth={2} fill="url(#g1)" />
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
                  <Bar dataKey="corpus" name="Corpus" fill="#000" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="invested" name="Invested" fill="var(--surface-4)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Right: fund list + add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Your SIPs <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>({sips.length})</span></span>
            <button
              onClick={() => setShowAdd(!showAdd)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--ink)', color: 'var(--surface)', borderRadius: 6, fontSize: 12, fontWeight: 500 }}
            >
              <Plus size={13} /> {sips.length > 0 ? 'Add Another' : 'Add SIP'}
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <Card style={{ background: 'var(--blue-pale)', border: '1px solid rgba(37,99,235,0.15)', padding: 18 }}>
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
                <CurrencyInput label="Monthly Amount (₹)" value={newSip.amount} onChange={v => setNewSip(p => ({ ...p, amount: v }))} />
                <div style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Expected return will be auto-fetched from live AMFI data after you add the fund and link it.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addSIP} style={{ flex: 1, padding: '9px', background: 'var(--ink)', color: 'white', borderRadius: 5, fontSize: 13, fontWeight: 500 }}>Add Fund</button>
                  <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '9px', background: 'transparent', color: 'var(--muted)', borderRadius: 5, fontSize: 13, border: '1px solid var(--border)' }}>Cancel</button>
                </div>
              </div>
            </Card>
          )}

          {/* SIP list — scrollable */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4, position: 'sticky', top: 0 }}>
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
              const isEditing = editingId === s.id;

              return (
                <Card key={s.id} style={{ padding: 16, border: isEditing ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                  {isEditing ? (
                    /* Edit mode */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 2 }}>Editing: {s.name}</div>
                      <CurrencyInput
                        label="Monthly SIP Amount (₹)"
                        value={editForm.amount}
                        onChange={v => setEditForm(p => ({ ...p, amount: v }))}
                      />
                      <div style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--muted)' }}>
                        Expected return ({editForm.expectedReturn}%) is auto-fetched from live AMFI data once linked. Link the fund to update it.
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</label>
                        <select
                          value={editForm.category}
                          onChange={e => {
                            const cat = MF_CATEGORIES.find(c => c.name === e.target.value);
                            setEditForm(p => ({ ...p, category: e.target.value, expectedReturn: cat?.typical || p.expectedReturn }));
                          }}
                          style={{ padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }}
                        >
                          {MF_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.typical}% avg)</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button onClick={saveEdit} style={{ flex: 1, padding: '9px', background: 'var(--ink)', color: 'white', borderRadius: 5, fontSize: 13, fontWeight: 500 }}>Save Changes</button>
                        <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '9px', background: 'transparent', color: 'var(--muted)', borderRadius: 5, fontSize: 13, border: '1px solid var(--border)' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{s.name}</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'var(--surface-2)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{s.category}</span>
                            {cat?.taxBenefit && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'var(--green-pale)', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>80C</span>}
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'var(--surface-2)', color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{s.expectedReturn}%</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => startEdit(s)} style={{ background: 'var(--surface-2)', color: 'var(--muted)', padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => removeSIP(s.id)} style={{ background: 'transparent', color: 'var(--muted)', padding: 4, border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {(() => {
                        const hasZerodha = s.importedFromZerodha && s.cost > 0;
                        const plPct = s.plPct ?? 0;
                        const unrealizedPL = s.unrealizedPL ?? 0;
                        const currentValue = s.currentValue ?? 0;
                        const cost = s.cost ?? 0;
                        const stats = hasZerodha ? [
                          { l: 'Monthly SIP', v: s.amount > 0 ? formatINR(s.amount, true) : 'Not set', color: 'var(--ink)', sub: 'add in edit' },
                          { l: 'Actual Return', v: `${plPct >= 0 ? '+' : ''}${plPct.toFixed(1)}%`, color: plPct >= 0 ? 'var(--green)' : 'var(--red)', sub: 'from Zerodha' },
                          { l: 'Invested', v: formatINR(cost, true), color: 'var(--ink)', sub: 'your cost' },
                          { l: 'Current Value', v: formatINR(currentValue, true), color: unrealizedPL >= 0 ? 'var(--green)' : 'var(--red)', sub: `P&L: ${unrealizedPL >= 0 ? '+' : ''}${formatINR(unrealizedPL, true)}` },
                        ] : [
                          { l: 'Monthly SIP', v: s.amount > 0 ? formatINR(s.amount, true) : '—', color: 'var(--ink)', sub: '' },
                          { l: 'Expected Return', v: `${s.expectedReturn ?? 13}%`, color: 'var(--ink)', sub: 'category avg' },
                          { l: `Corpus ${projYears}Y`, v: formatINR(fv, true), color: 'var(--ink)', sub: 'projected' },
                          { l: 'Projected Gain', v: inv > 0 ? `${((fv / inv - 1) * 100).toFixed(0)}%` : '—', color: 'var(--green)', sub: '' },
                        ];
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                            {stats.map(({ l, v, color, sub }) => (
                              <div key={l} style={{ textAlign: 'center', padding: '7px 4px', background: 'var(--surface-2)', borderRadius: 5 }}>
                                <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, letterSpacing: '0.02em' }}>{l}</div>
                                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>{v}</div>
                                {sub && <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS[cat?.risk] || 'var(--muted)' }} />
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Risk: {cat?.risk || 'Unknown'}</span>
                      </div>
                      <FundPerformanceCard
                        sip={s}
                        onReturnUpdate={(newReturn) => {
                          onSipsChange(sips.map(x => x.id === s.id ? { ...x, expectedReturn: newReturn } : x));
                        }}
                      />
                    </>
                  )}
                </Card>
              );
            })
          )}
          </div>{/* end scrollable SIP list */}

        </div>
      </div>

      {/* ── Benchmark Analysis ── */}
      {sips.filter(s => s.category && !s.name?.toLowerCase().includes('bees')).length > 0 && <BenchmarkAnalysis sips={sips} projYears={projYears} />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Benchmark Analysis Component
   Uses each SIP's expectedReturn vs index CAGRs
   ───────────────────────────────────────────── */
function BenchmarkAnalysis({ sips, projYears }) {
  const [years, setYears] = useState(10);

  // Filter to real mutual funds only — exclude ETFs, stocks, anything without a proper MF category
  const mfSips = sips.filter(s => {
    const name = (s.name || '').toLowerCase();
    const cat = (s.category || '').toLowerCase();
    // Exclude ETFs and index trackers that got imported as MFs
    if (name.includes('bees') || name.includes('etf') || name.includes('nifty 50') || name.includes('sensex')) return false;
    // Must have a recognized MF category
    const validCats = ['small cap', 'mid cap', 'large cap', 'flexi cap', 'elss', 'index fund', 'debt fund', 'hybrid', 'sectoral'];
    return validCats.some(c => cat.includes(c));
  });

  const [selectedId, setSelectedId] = useState(mfSips[0]?.id || null);
  const selectedSip = mfSips.find(s => s.id === selectedId) || mfSips[0];

  // Category → appropriate benchmark index
  const categoryBenchmark = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('small cap')) return { name: 'Nifty Smallcap 250', cagr: BENCHMARKS['Nifty Smallcap 250'].cagr };
    if (c.includes('mid cap') || c.includes('midcap')) return { name: 'Nifty Midcap 150', cagr: BENCHMARKS['Nifty Midcap 150'].cagr };
    if (c.includes('large cap') || c.includes('largecap')) return { name: 'Nifty 50', cagr: BENCHMARKS['Nifty 50'].cagr };
    if (c.includes('elss') || c.includes('flexi') || c.includes('multi')) return { name: 'Nifty 500', cagr: 13.8 };
    if (c.includes('sectoral') || c.includes('thematic')) return { name: 'Nifty 500', cagr: 13.8 };
    if (c.includes('debt') || c.includes('liquid')) return { name: 'Fixed Deposit', cagr: BENCHMARKS['Fixed Deposit'].cagr };
    return { name: 'Nifty 50', cagr: BENCHMARKS['Nifty 50'].cagr };
  };

  // IMPORTANT: always use expectedReturn (CAGR) for comparisons.
  // plPct from Zerodha is absolute % gain (not annualised), so not comparable to index CAGRs.
  // expectedReturn gets auto-updated with live 5Y CAGR from AMFI via FundPerformance component.
  const getReturn = (s) => s.expectedReturn ?? 13;

  // Whether the return is live AMFI data (auto-updated) vs initial category default
  // We detect this by checking if expectedReturn differs from category default
  const getCategoryDefault = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('small cap')) return 17;
    if (c.includes('mid cap')) return 16;
    if (c.includes('large cap')) return 12.5;
    if (c.includes('elss')) return 13;
    if (c.includes('index')) return 13;
    if (c.includes('debt')) return 7;
    return 14;
  };
  const isLiveReturn = (s) => Math.abs((s.expectedReturn ?? 13) - getCategoryDefault(s.category)) > 0.5;

  const totalAmt = mfSips.reduce((s, x) => s + (x.amount || 0), 0);
  const portfolioReturn = mfSips.length > 0
    ? mfSips.reduce((s, x) => s + getReturn(x), 0) / mfSips.length
    : 0;

  // Build projection data: ₹10,000/mo SIP for comparison fairness
  const MONTHLY = 10000;
  const buildLine = (rate) => {
    const points = [];
    for (let yr = 1; yr <= years; yr++) {
      const r = rate / 100 / 12;
      const n = yr * 12;
      const fv = r === 0 ? MONTHLY * n : MONTHLY * (((Math.pow(1+r,n)-1)/r)*(1+r));
      points.push(Math.round(fv));
    }
    return points;
  };

  const yearLabels = Array.from({ length: years }, (_, i) => `Y${i+1}`);

  const chartData = yearLabels.map((label, i) => {
    const row = { label };
    // Selected SIP
    if (selectedSip) {
      const r = selectedSip.expectedReturn / 100 / 12;
      const n = (i+1) * 12;
      row[selectedSip.name.slice(0,18)] = Math.round(r === 0 ? MONTHLY*n : MONTHLY*(((Math.pow(1+r,n)-1)/r)*(1+r)));
    }
    // Benchmarks
    Object.entries(BENCHMARKS).forEach(([name, { cagr }]) => {
      const r = cagr / 100 / 12;
      const n = (i+1) * 12;
      row[name] = Math.round(r === 0 ? MONTHLY*n : MONTHLY*(((Math.pow(1+r,n)-1)/r)*(1+r)));
    });
    return row;
  });

  const finalRow = chartData[chartData.length - 1] || {};
  const sipFinalValue = finalRow[selectedSip?.name?.slice(0,18)] || 0;
  const niftyFinalValue = finalRow['Nifty 50'] || 0;
  const fdFinalValue = finalRow['Fixed Deposit'] || 0;
  const vsNifty = sipFinalValue - niftyFinalValue;
  const vsFD = sipFinalValue - fdFinalValue;

  // Per-SIP scorecard
  const scorecards = mfSips.map(s => {
    const bench = categoryBenchmark(s.category);
    const fd = BENCHMARKS['Fixed Deposit'].cagr;
    const ret = getReturn(s);
    const live = isLiveReturn(s);
    const gap = ret - bench.cagr;
    const vsNifty50 = ret - BENCHMARKS['Nifty 50'].cagr;
    const returnLabel = live ? 'Live CAGR (AMFI)' : 'Category avg';
    let status, suggestion, color;

    if (gap >= 2) {
      status = `Beats ${bench.name.replace('Nifty ', '')}`; color = 'var(--green)';
      suggestion = `${live ? `5Y CAGR of ${ret.toFixed(1)}%` : `Category avg ${ret.toFixed(1)}%`} beats its benchmark ${bench.name} (${bench.cagr}%) by ${gap.toFixed(1)}%. Strong fund — stay invested.`;
    } else if (gap >= 0) {
      status = `Matches ${bench.name.replace('Nifty ', '')}`; color = 'var(--blue)';
      suggestion = `${ret.toFixed(1)}% is inline with ${bench.name} (${bench.cagr}%). The fund is tracking its benchmark. A low-cost index fund gives the same result at lower expense.`;
    } else if (ret >= fd + 3) {
      status = `Lags ${bench.name.replace('Nifty ', '')}`; color = 'var(--amber)';
      suggestion = `${ret.toFixed(1)}% lags ${bench.name} (${bench.cagr}%) by ${Math.abs(gap).toFixed(1)}%. This fund underperforms its category index — consider switching to a direct ${bench.name} index fund.`;
    } else {
      status = 'Near FD returns'; color = 'var(--red)';
      suggestion = `At ${ret.toFixed(1)}%, barely beating FD. Switch to an index fund immediately.`;
    }

    return { ...s, status, suggestion, color, gap, vsNifty: vsNifty50, ret, live, bench, returnLabel };
  });

  // Portfolio-level suggestions
  const suggestions = [];
  const hasIndex = mfSips.some(s => s.category === 'Index Fund');
  const hasELSS = mfSips.some(s => s.category === 'ELSS');
  const avgReturn = portfolioReturn;
  const niftyAvg = BENCHMARKS['Nifty 50'].cagr;
  const underperformers = scorecards.filter(s => s.gap < 0);
  const hasLiveData = mfSips.some(s => isLiveReturn(s));

  if (!hasLiveData) suggestions.push({ type: 'info', text: 'Returns shown are category averages. The Live Performance section below each SIP auto-fetches real CAGR from AMFI.' });
  if (avgReturn < niftyAvg) suggestions.push({ type: 'warning', text: `Portfolio avg return (${avgReturn.toFixed(1)}%) is below Nifty 50's historical avg (${niftyAvg}%). Index funds may serve you better.` });
  if (!hasIndex) suggestions.push({ type: 'info', text: 'No index fund detected. A Nifty 50 index fund as a core holding reduces cost and improves consistency.' });
  if (!hasELSS && mfSips.length >= 2) suggestions.push({ type: 'info', text: 'No ELSS fund detected. Adding one saves up to ₹46,800/year in taxes under Section 80C.' });
  if (underperformers.length > 0) suggestions.push({ type: 'warning', text: `${underperformers.map(s => s.name.split(' ')[0]).join(', ')} ${underperformers.length === 1 ? 'is' : 'are'} underperforming Nifty 50. Review or replace.` });
  if (mfSips.every(s => ['Small Cap', 'Mid Cap'].includes(s.category))) suggestions.push({ type: 'danger', text: '100% small/mid cap — very high volatility. Add a large-cap or index fund for stability.' });
  if (avgReturn >= 15) suggestions.push({ type: 'success', text: `Strong portfolio — avg ${avgReturn.toFixed(1)}% beats most benchmarks. Stay invested.` });

  const BENCH_COLORS = { 'Nifty 50': '#2563eb', 'Sensex': '#7c3aed', 'Nifty Midcap 150': '#059669', 'Nifty Smallcap 250': '#d97706', 'Fixed Deposit': '#9ca3af', 'PPF': '#6b7280' };
  const STATUS_COLORS = { warning: { bg: 'var(--amber-pale)', border: 'rgba(217,119,6,0.2)', text: 'var(--amber)', icon: '⚠' }, info: { bg: 'var(--blue-pale)', border: 'rgba(37,99,235,0.15)', text: 'var(--blue)', icon: 'ℹ' }, danger: { bg: 'var(--red-pale)', border: 'rgba(220,38,38,0.2)', text: 'var(--red)', icon: '!' }, success: { bg: 'var(--green-pale)', border: 'rgba(5,150,105,0.2)', text: 'var(--green)', icon: '✓' } };

  const BenchTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--ink)', padding: '10px 14px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label} — ₹10K/mo SIP</div>
        {[...payload].sort((a,b) => b.value - a.value).map((p, i) => (
          <div key={i} style={{ color: p.stroke, marginBottom: 2 }}>{p.name}: {formatINR(p.value, true)}</div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 36, borderTop: '1px solid var(--border)', paddingTop: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px', color: 'var(--ink)' }}>Performance vs Benchmarks</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>How your SIPs compare to major Indian indices — based on expected returns vs historical index CAGRs.</p>
      </div>

      {/* Per-SIP scorecard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
        {scorecards.map(s => (
          <Card
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            style={{ cursor: 'pointer', border: selectedId === s.id ? '1.5px solid var(--ink)' : '1px solid var(--border)', padding: 16, transition: 'all 0.15s' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 500, flex: 1, marginRight: 8, lineHeight: 1.4 }}>{s.name}</div>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: s.color === 'var(--green)' ? 'var(--green-pale)' : s.color === 'var(--red)' ? 'var(--red-pale)' : s.color === 'var(--amber)' ? 'var(--amber-pale)' : 'var(--blue-pale)', color: s.color, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {s.status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                { l: 'Your return', v: `${s.ret}%`, highlight: true },
                { l: 'vs Nifty 50', v: `${s.gap >= 0 ? '+' : ''}${s.gap.toFixed(1)}%`, pos: s.gap >= 0 },
                { l: 'vs FD', v: `+${(s.ret - BENCHMARKS['Fixed Deposit'].cagr).toFixed(1)}%`, pos: true },
              ].map(({ l, v, highlight, pos }) => (
                <div key={l} style={{ textAlign: 'center', background: 'var(--surface-2)', borderRadius: 5, padding: '6px 4px' }}>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, letterSpacing: '0.02em' }}>{l}</div>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: highlight ? 'var(--ink)' : pos ? 'var(--green)' : 'var(--red)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{s.suggestion}</div>
          </Card>
        ))}
      </div>

      {/* Growth chart */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>SIP Growth Chart</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>₹10,000/mo invested — click a fund card above to compare</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Period:</span>
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 6, padding: 2 }}>
              {[5, 10, 15, 20].map(y => (
                <button key={y} onClick={() => setYears(y)} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: years === y ? 500 : 400, background: years === y ? 'var(--surface)' : 'transparent', color: years === y ? 'var(--ink)' : 'var(--muted)', border: years === y ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'all 0.1s' }}>
                  {y}Y
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Final value comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: selectedSip?.name?.split(' ')[0] || 'Your SIP', val: sipFinalValue, color: 'var(--ink)', bold: true },
            { label: `vs Nifty 50`, val: vsNifty, color: vsNifty >= 0 ? 'var(--green)' : 'var(--red)', prefix: vsNifty >= 0 ? '+' : '' },
            { label: `vs FD`, val: vsFD, color: 'var(--green)', prefix: '+' },
          ].map(({ label, val, color, bold, prefix = '' }) => (
            <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{label} after {years}Y</div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: bold ? 600 : 500, color }}>{prefix}{formatINR(val, true)}</div>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} interval={Math.floor(years / 5)} />
            <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => formatINR(v, true)} />
            <Tooltip content={<BenchTooltip />} />
            {selectedSip && (
              <Line type="monotone" dataKey={selectedSip.name.slice(0,18)} stroke="var(--ink)" strokeWidth={2.5} dot={false} />
            )}
            {Object.entries(BENCHMARKS).map(([name, { cagr }]) => (
              <Line key={name} type="monotone" dataKey={name} stroke={BENCH_COLORS[name]} strokeWidth={1.5} dot={false} strokeDasharray={name === 'Fixed Deposit' || name === 'PPF' ? '4 3' : undefined} />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {selectedSip && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 16, height: 2.5, background: 'var(--ink)', borderRadius: 1 }} />
              <span style={{ fontSize: 11, fontWeight: 500 }}>{selectedSip.name.slice(0, 20)}</span>
            </div>
          )}
          {Object.entries(BENCHMARKS).map(([name, _]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 16, height: 1.5, background: BENCH_COLORS[name], borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Recommendations</div>
          {suggestions.map((s, i) => {
            const c = STATUS_COLORS[s.type];
            return (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, color: c.text, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
                <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.6 }}>{s.text}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}