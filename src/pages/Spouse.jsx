import React, { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { Card, SectionHeader, Slider, CurrencyInput } from '../components/ui.jsx';
import { formatINR, MF_CATEGORIES } from '../utils/finance.js';

const RISK_COLORS = { Low: '#2d6a4f', Moderate: '#c8873a', 'Moderate-High': '#e8a85a', High: '#c1121f', 'Very High': '#8b0000' };

export default function Spouse({ spouse, onSpouseChange, spouseSips, onSpouseSipsChange, spouseAssets, onSpouseAssetsChange }) {
  const [showAddSIP, setShowAddSIP] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newSip, setNewSip] = useState({ name: '', category: 'Flexi Cap', amount: 5000, expectedReturn: 14 });
  const [newAsset, setNewAsset] = useState({ name: '', category: 'Mutual Funds', value: 0 });

  const ASSET_CATEGORIES = ['Mutual Funds', 'Stocks', 'Fixed Deposits', 'PPF/EPF', 'Gold', 'Real Estate', 'Crypto', 'Cash/Savings', 'Other'];

  const totalSIP = spouseSips.reduce((s, x) => s + x.amount, 0);
  const totalAssets = spouseAssets.reduce((s, a) => s + a.value, 0);

  const addSIP = () => {
    if (!newSip.name || newSip.amount <= 0) return;
    onSpouseSipsChange([...spouseSips, { ...newSip, id: Date.now() }]);
    setNewSip({ name: '', category: 'Flexi Cap', amount: 5000, expectedReturn: 14 });
    setShowAddSIP(false);
  };

  const addAsset = () => {
    if (!newAsset.name || newAsset.value <= 0) return;
    onSpouseAssetsChange([...spouseAssets, { ...newAsset, id: Date.now() }]);
    setNewAsset({ name: '', category: 'Mutual Funds', value: 0 });
    setShowAddAsset(false);
  };

  const hasSpouse = spouse.name && spouse.name.trim() !== '';

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <SectionHeader
        title="Spouse / Partner"
        subtitle="Add your partner's financials — their savings and SIPs will combine with yours for joint retirement planning."
      />

      {/* Spouse profile */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={15} color="var(--accent)" /> Partner Profile
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Partner's Name</label>
                <input
                  value={spouse.name || ''}
                  onChange={e => onSpouseChange({ ...spouse, name: e.target.value })}
                  placeholder="e.g. Priya"
                  style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', background: 'var(--surface)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <Slider label="Partner's Age" value={spouse.age || 28} onChange={v => onSpouseChange({ ...spouse, age: v })} min={20} max={55} format={v => `${v} yrs`} />
              <CurrencyInput
                label="Monthly Income (take-home)"
                value={spouse.monthlyIncome || 0}
                onChange={v => onSpouseChange({ ...spouse, monthlyIncome: v })}
              />
              <CurrencyInput
                label="Monthly Expenses"
                value={spouse.monthlyExpense || 0}
                onChange={v => onSpouseChange({ ...spouse, monthlyExpense: v })}
                hint={spouse.monthlyIncome > 0 ? `Saves ${formatINR((spouse.monthlyIncome || 0) - (spouse.monthlyExpense || 0) - totalSIP, true)}/mo after SIPs` : ''}
              />
            </div>
          </Card>

          {/* Combined summary card */}
          {hasSpouse && (
            <Card style={{ background: 'var(--ink)', padding: 20 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                {spouse.name}'s Contribution
              </div>
              {[
                { label: 'Net Worth', val: formatINR(totalAssets, true) },
                { label: 'Monthly SIP', val: formatINR(totalSIP, true) },
                { label: 'Monthly Income', val: formatINR(spouse.monthlyIncome || 0, true) },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--ink)' }}>{val}</span>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* SIPs + Assets */}
        {hasSpouse ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* SIPs */}
            <Card style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{spouse.name}'s SIPs</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Total: {formatINR(totalSIP, true)}/mo</div>
                </div>
                <button onClick={() => setShowAddSIP(!showAddSIP)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--ink)', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                  <Plus size={13} /> Add SIP
                </button>
              </div>

              {showAddSIP && (
                <div style={{ background: 'var(--surface-2)', border: '1px solid rgba(200,135,58,0.3)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fund Name</label>
                      <input value={newSip.name} onChange={e => setNewSip(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Parag Parikh Flexi Cap" style={{ padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }} onFocus={e => e.target.style.borderColor = 'var(--ink)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</label>
                      <select value={newSip.category} onChange={e => { const cat = MF_CATEGORIES.find(c => c.name === e.target.value); setNewSip(p => ({ ...p, category: e.target.value, expectedReturn: cat?.typical || p.expectedReturn })); }} style={{ padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }}>
                        {MF_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.typical}% avg)</option>)}
                      </select>
                    </div>
                    <CurrencyInput label="Monthly Amount" value={newSip.amount} onChange={v => setNewSip(p => ({ ...p, amount: v }))} />
                    <Slider label="Expected Return" value={newSip.expectedReturn} onChange={v => setNewSip(p => ({ ...p, expectedReturn: v }))} min={5} max={25} step={0.5} format={v => `${v}%`} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={addSIP} style={{ flex: 1, padding: '9px', background: 'var(--ink)', color: 'white', borderRadius: 5, fontSize: 13, fontWeight: 500 }}>Add</button>
                      <button onClick={() => setShowAddSIP(false)} style={{ flex: 1, padding: '9px', background: 'transparent', color: 'var(--muted)', borderRadius: 5, fontSize: 13, border: '1px solid var(--border)' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {spouseSips.length === 0 && !showAddSIP ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontSize: 13, background: 'var(--surface-2)', borderRadius: 8 }}>
                  No SIPs added yet. Click "Add SIP" above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {spouseSips.map(s => {
                    const cat = MF_CATEGORIES.find(c => c.name === s.category);
                    return (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS[cat?.risk] || 'var(--muted)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.category} · {s.expectedReturn}% expected</div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{formatINR(s.amount, true)}/mo</span>
                        <button onClick={() => onSpouseSipsChange(spouseSips.filter(x => x.id !== s.id))} style={{ background: 'transparent', color: 'var(--muted)', padding: 4, border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Assets */}
            <Card style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{spouse.name}'s Assets & Savings</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Total: {formatINR(totalAssets, true)}</div>
                </div>
                <button onClick={() => setShowAddAsset(!showAddAsset)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--ink)', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                  <Plus size={13} /> Add Asset
                </button>
              </div>

              {showAddAsset && (
                <div style={{ background: 'var(--green-pale)', border: '1px solid var(--green-light)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Asset Name</label>
                      <input value={newAsset.name} onChange={e => setNewAsset(p => ({ ...p, name: e.target.value }))} placeholder="e.g. EPF, FD, Gold ETF" style={{ padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }} onFocus={e => e.target.style.borderColor = 'var(--green)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</label>
                      <select value={newAsset.category} onChange={e => setNewAsset(p => ({ ...p, category: e.target.value }))} style={{ padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }}>
                        {ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <CurrencyInput label="Current Value" value={newAsset.value} onChange={v => setNewAsset(p => ({ ...p, value: v }))} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={addAsset} style={{ flex: 1, padding: '9px', background: 'var(--green)', color: 'white', borderRadius: 5, fontSize: 13, fontWeight: 500 }}>Add</button>
                      <button onClick={() => setShowAddAsset(false)} style={{ flex: 1, padding: '9px', background: 'transparent', color: 'var(--muted)', borderRadius: 5, fontSize: 13, border: '1px solid var(--border)' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {spouseAssets.length === 0 && !showAddAsset ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontSize: 13, background: 'var(--surface-2)', borderRadius: 8 }}>
                  No assets added yet. Add FDs, EPF, savings, etc.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {spouseAssets.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{a.category}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{formatINR(a.value, true)}</span>
                      <button onClick={() => onSpouseAssetsChange(spouseAssets.filter(x => x.id !== a.id))} style={{ background: 'transparent', color: 'var(--muted)', padding: 4, border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, background: 'var(--surface-2)', border: '2px dashed var(--border)' }}>
            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
              <Users size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>Add your partner's name to get started</div>
              <div style={{ fontSize: 13 }}>Their SIPs and savings will combine with yours for joint retirement planning.</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}