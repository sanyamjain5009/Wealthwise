import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Card, SectionHeader, CurrencyInput } from '../components/ui.jsx';
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
      <div style={{ color: 'var(--ink)', fontWeight: 500 }}>{formatINR(value, true)}</div>
    </div>
  );
};

function AddAssetForm({ onAdd, onCancel }) {
  const [asset, setAsset] = useState({ name: '', category: 'Mutual Funds', value: 0 });

  const handleAdd = () => {
    if (!asset.name || asset.value <= 0) return;
    onAdd(asset);
  };

  return (
    <Card style={{ background: 'var(--blue-pale)', border: '1px solid var(--border-strong)', padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--ink)' }}>Add New Asset</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Asset Name</label>
          <input
            value={asset.name}
            onChange={e => setAsset(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. HDFC Nifty 50 Index Fund"
            autoFocus
            style={{ padding: '10px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }}
            onFocus={e => e.target.style.borderColor = 'var(--ink)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</label>
          <select
            value={asset.category}
            onChange={e => setAsset(p => ({ ...p, category: e.target.value }))}
            style={{ padding: '10px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'white' }}
          >
            {ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <CurrencyInput
          label="Current Value"
          value={asset.value}
          onChange={v => setAsset(p => ({ ...p, value: v }))}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={handleAdd}
            style={{ flex: 1, padding: '10px', background: 'var(--ink)', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
          >
            Add Asset
          </button>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--muted)', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Card>
  );
}

function AssetRow({ asset, onRemove, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(asset.value);

  const save = () => {
    onUpdate(asset.id, editValue);
    setEditing(false);
  };

  return (
    <Card style={{ padding: 14, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{asset.name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{asset.category}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 160 }}>
                <CurrencyInput label="" value={editValue} onChange={setEditValue} />
              </div>
              <button onClick={save} style={{ background: 'var(--green-pale)', border: 'none', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>
                <Check size={13} color="var(--green)" />
              </button>
              <button onClick={() => setEditing(false)} style={{ background: 'var(--red-pale)', border: 'none', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>
                <X size={13} color="var(--red)" />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{formatINR(asset.value, true)}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{formatINR(asset.value)}</div>
              </div>
              <button onClick={() => { setEditValue(asset.value); setEditing(true); }} style={{ background: 'transparent', color: 'var(--muted)', padding: 4, border: 'none', cursor: 'pointer' }}>
                <Pencil size={12} />
              </button>
              <button onClick={() => onRemove(asset.id)} style={{ background: 'transparent', color: 'var(--muted)', padding: 4, border: 'none', cursor: 'pointer' }}>
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function NetWorth({ assets, onAssetsChange }) {
  const [showAdd, setShowAdd] = useState(false);

  const addAsset = (asset) => {
    onAssetsChange([...assets, { ...asset, id: Date.now() }]);
    setShowAdd(false);
  };

  const removeAsset = (id) => onAssetsChange(assets.filter(a => a.id !== id));

  const updateAsset = (id, newValue) => {
    onAssetsChange(assets.map(a => a.id === id ? { ...a, value: newValue } : a));
  };

  const total = assets.reduce((s, a) => s + a.value, 0);

  const byCategory = ASSET_CATEGORIES
    .map(cat => ({
      name: cat,
      value: assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0),
    }))
    .filter(c => c.value > 0);

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <SectionHeader title="Net Worth Tracker" subtitle="Add all your assets here — this feeds directly into your Retirement planner." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Total */}
          <Card style={{ background: 'var(--ink)', padding: 24 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total Net Worth</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 40, fontWeight: 600, color: 'var(--surface)', letterSpacing: '-1.5px' }}>
              {formatINR(total)}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{assets.length} asset{assets.length !== 1 ? 's' : ''} tracked · auto-synced to Retirement planner</div>
          </Card>

          {/* Add button or form */}
          {showAdd ? (
            <AddAssetForm onAdd={addAsset} onCancel={() => setShowAdd(false)} />
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                width: '100%', padding: '14px', background: 'white',
                border: '2px dashed var(--border)', borderRadius: 10,
                fontSize: 13, fontWeight: 500, color: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
            >
              <Plus size={15} /> Add Asset
            </button>
          )}

          {/* Empty state */}
          {assets.length === 0 && !showAdd && (
            <Card style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>No assets yet</div>
              <div style={{ fontSize: 13 }}>Click "Add Asset" above to track your mutual funds, stocks, FDs, gold, and more.</div>
            </Card>
          )}

          {/* Asset list grouped by category */}
          {ASSET_CATEGORIES.filter(cat => assets.some(a => a.category === cat)).map(cat => (
            <div key={cat}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cat] }} />
                {cat} · {formatINR(assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0), true)}
              </div>
              {assets.filter(a => a.category === cat).map(asset => (
                <AssetRow key={asset.id} asset={asset} onRemove={removeAsset} onUpdate={updateAsset} />
              ))}
            </div>
          ))}
        </div>

        {/* Right: pie + health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 24 }}>
          {byCategory.length > 0 ? (
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
          ) : (
            <Card style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 13 }}>Add assets to see your allocation chart</div>
            </Card>
          )}

          {byCategory.length > 0 && (
            <Card style={{ background: 'var(--surface-2)', padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Portfolio Health</div>
              {(() => {
                const equityPct = byCategory.filter(c => ['Mutual Funds', 'Stocks'].includes(c.name)).reduce((s, c) => s + c.value, 0) / total * 100;
                const debtPct = byCategory.filter(c => ['Fixed Deposits', 'PPF/EPF'].includes(c.name)).reduce((s, c) => s + c.value, 0) / total * 100;
                return [
                  { label: 'Equity', val: `${equityPct.toFixed(0)}%`, ok: equityPct >= 60, note: equityPct < 60 ? 'Consider increasing for growth' : 'Good for long-term wealth' },
                  { label: 'Debt/Safe', val: `${debtPct.toFixed(0)}%`, ok: debtPct <= 30, note: debtPct > 30 ? 'High — may limit growth' : 'Good balance' },
                ].map(c => (
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