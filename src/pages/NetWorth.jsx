import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2 } from 'lucide-react';
import { Card, SectionHeader, Input } from '../components/ui.jsx';
import { formatINR } from '../utils/finance.js';

const ASSET_CATEGORIES = ['Mutual Funds', 'Stocks', 'Fixed Deposits', 'PPF/EPF', 'Gold', 'Real Estate', 'Crypto', 'Cash/Savings', 'Other'];
const CATEGORY_COLORS = {
  'Mutual Funds': '#c8873a', 'Stocks': '#2d6a4f', 'Fixed Deposits': '#6366f1',
  'PPF/EPF': '#f59e0b', 'Gold': '#eab308', 'Real Estate': '#14b8a6',
  'Crypto': '#ec4899', 'Cash/Savings': '#64748b', 'Other': '#94a3b8',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div style={{ background: 'var(--ink)', padding: '10px 14px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'rgba(255,255,255,0.7)' }}>{name}</div>
      <div style={{ color: 'var(--accent)', fontWeight: 500 }}>{formatINR(value, true)}</div>
    </div>
  );
};

export default function NetWorth({ assets, onAssetsChange }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', category: 'Mutual Funds', value: 0 });

  const addAsset = () => {
    if (!newAsset.name || newAsset.value <= 0) return;
    onAssetsChange([...assets, { ...newAsset, id: Date.now() }]);
    setNewAsset({ name: '', category: 'Mutual Funds', value: 0 });
    setShowAdd(false);
  };

  const removeAsset = (id) => onAssetsChange(assets.filter(a => a.id !== id));

  const total = assets.reduce((s, a) => s + a.value, 0);

  // Group by category
  const byCategory = ASSET_CATEGORIES
    .map(cat => ({
      name: cat,
      value: assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0),
    }))
    .filter(c => c.value > 0);

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <SectionHeader title="Net Worth Tracker" subtitle="Track all your assets in one place." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Left: asset list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Total */}
          <Card style={{ background: 'var(--ink)', padding: 24 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total Net Worth</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600, color: 'var(--paper)', letterSpacing: '-1.5px' }}>
              {formatINR(total)}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{assets.length} assets tracked</div>
          </Card>

          {/* Add button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAdd(!showAdd)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
            >
              <Plus size={13} /> Add Asset
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <Card style={{ background: 'var(--accent-pale)', border: '1px solid var(--accent)', padding: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Asset Name</label>
                  <input value={newAsset.name} onChange={e => setNewAsset(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. HDFC Nifty 50 Index Fund"
                    style={{ padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</label>
                  <select value={newAsset.category} onChange={e => setNewAsset(p => ({ ...p, category: e.target.value }))}
                    style={{ padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }}>
                    {ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Input label="Current Value (₹)" value={newAsset.value} onChange={v => setNewAsset(p => ({ ...p, value: v }))} prefix="₹" min={0} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addAsset} style={{ flex: 1, padding: '9px', background: 'var(--ink)', color: 'white', borderRadius: 5, fontSize: 13, fontWeight: 500 }}>Add Asset</button>
                  <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '9px', background: 'transparent', color: 'var(--muted)', borderRadius: 5, fontSize: 13, border: '1px solid var(--border)' }}>Cancel</button>
                </div>
              </div>
            </Card>
          )}

          {/* Asset list grouped by category */}
          {ASSET_CATEGORIES.filter(cat => assets.some(a => a.category === cat)).map(cat => (
            <div key={cat}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cat] }} />
                {cat}
              </div>
              {assets.filter(a => a.category === cat).map(asset => (
                <Card key={asset.id} style={{ padding: 14, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{asset.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                        {((asset.value / total) * 100).toFixed(1)}% of net worth
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--accent)' }}>{formatINR(asset.value, true)}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{formatINR(asset.value)}</div>
                      </div>
                      <button onClick={() => removeAsset(asset.id)} style={{ background: 'transparent', color: 'var(--muted)', padding: 4 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))}

          {assets.length === 0 && (
            <Card style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
              <div style={{ fontSize: 13 }}>No assets yet. Add your first one above.</div>
            </Card>
          )}
        </div>

        {/* Right: pie chart + allocation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 24 }}>
          {byCategory.length > 0 && (
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Asset Allocation</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                    {byCategory.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {byCategory.map(cat => (
                  <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: CATEGORY_COLORS[cat.name] }} />
                      <span style={{ fontSize: 12 }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{((cat.value / total) * 100).toFixed(1)}%</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{formatINR(cat.value, true)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Allocation health check */}
          {byCategory.length > 0 && (
            <Card style={{ background: 'var(--paper-2)', padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Portfolio Health</div>
              {(() => {
                const equityPct = byCategory.filter(c => ['Mutual Funds', 'Stocks'].includes(c.name)).reduce((s, c) => s + c.value, 0) / total * 100;
                const debtPct = byCategory.filter(c => ['Fixed Deposits', 'PPF/EPF'].includes(c.name)).reduce((s, c) => s + c.value, 0) / total * 100;
                const checks = [
                  { label: 'Equity allocation', val: `${equityPct.toFixed(0)}%`, ok: equityPct >= 60, note: equityPct < 60 ? 'Consider increasing for long-term growth' : 'Healthy for long-term wealth' },
                  { label: 'Debt/Safe assets', val: `${debtPct.toFixed(0)}%`, ok: debtPct <= 30, note: debtPct > 30 ? 'High — may limit growth' : 'Good balance' },
                ];
                return checks.map(c => (
                  <div key={c.label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 12 }}>{c.label}</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: c.ok ? 'var(--green)' : 'var(--accent)' }}>{c.val}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.note}</div>
                  </div>
                ));
              })()}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
