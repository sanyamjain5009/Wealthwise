import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, RefreshCw, TrendingUp, PieChart } from 'lucide-react';
import { Card, SectionHeader } from '../components/ui.jsx';
import { formatINR } from '../utils/finance.js';
import * as XLSX from 'xlsx';

// Detect MF category from instrument type string or name
const detectMFCategory = (instrumentType, name) => {
  const t = (instrumentType || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (t.includes('small cap') || n.includes('small cap')) return 'Small Cap';
  if (t.includes('mid cap') || n.includes('mid cap') || n.includes('midcap')) return 'Mid Cap';
  if (t.includes('large cap') || n.includes('large cap')) return 'Large Cap';
  if (t.includes('elss') || n.includes('elss') || n.includes('tax saver')) return 'ELSS';
  if (t.includes('sectoral') || t.includes('thematic') || n.includes('technology') || n.includes('pharma') || n.includes('banking')) return 'Sectoral';
  if (t.includes('flexi') || t.includes('multi') || n.includes('flexi') || n.includes('multi cap')) return 'Flexi Cap';
  if (n.includes('index') || n.includes('nifty') || n.includes('sensex') || n.includes('bees')) return 'Index Fund';
  if (t.includes('debt') || n.includes('debt') || n.includes('liquid') || n.includes('gilt')) return 'Debt Fund';
  if (t.includes('hybrid') || n.includes('hybrid') || n.includes('balanced')) return 'Hybrid';
  return 'Flexi Cap';
};

const CATEGORY_RETURN = {
  'ELSS': 13, 'Small Cap': 17, 'Mid Cap': 16, 'Large Cap': 12.5,
  'Flexi Cap': 14, 'Index Fund': 13, 'Debt Fund': 7, 'Hybrid': 11, 'Sectoral': 14,
};

// Parse Zerodha XLSX — finds header row dynamically
const parseZerodhaXLSX = (workbook) => {
  const equity = [];
  const mf = [];

  const parseSheet = (sheetName, targetArray, isEquity) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    // Find header row (contains "Symbol")
    let headerIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].some(cell => cell && String(cell).trim().toLowerCase() === 'symbol')) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx < 0) return;

    const headers = rows[headerIdx].map(h => (h || '').toString().trim().toLowerCase());
    const symIdx = headers.findIndex(h => h === 'symbol');
    const isinIdx = headers.findIndex(h => h === 'isin');
    const qtyIdx = headers.findIndex(h => h.includes('quantity available'));
    const avgIdx = headers.findIndex(h => h.includes('average price'));
    const ltpIdx = headers.findIndex(h => h.includes('previous closing'));
    const plIdx = headers.findIndex(h => h === 'unrealized p&l');
    const plPctIdx = headers.findIndex(h => h.includes('unrealized p&l pct'));
    const instrIdx = headers.findIndex(h => h.includes('instrument type'));

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[symIdx]) continue;
      const name = String(row[symIdx]).trim();
      if (!name || name === 'Symbol') continue;

      const qty = parseFloat(row[qtyIdx]) || 0;
      const avgPrice = parseFloat(row[avgIdx]) || 0;
      const ltp = parseFloat(row[ltpIdx]) || 0;
      const unrealizedPL = parseFloat(row[plIdx]) || 0;
      const plPct = parseFloat(row[plPctIdx]) || 0;
      const cost = qty * avgPrice;
      const currentValue = cost + unrealizedPL;
      const isin = row[isinIdx] ? String(row[isinIdx]).trim() : '';
      const instrType = row[instrIdx] ? String(row[instrIdx]) : '';

      if (currentValue <= 0 && cost <= 0) continue;

      const item = {
        id: Date.now() + Math.random(),
        name,
        isin,
        qty,
        avgPrice,
        ltp,
        cost: Math.round(cost),
        currentValue: Math.round(currentValue > 0 ? currentValue : cost),
        unrealizedPL: Math.round(unrealizedPL),
        plPct: parseFloat(plPct.toFixed(2)),
        selected: true,
      };

      if (!isEquity) {
        item.category = detectMFCategory(instrType, name);
        item.expectedReturn = CATEGORY_RETURN[item.category] || 13;
      }

      targetArray.push(item);
    }
  };

  parseSheet('Equity', equity, true);
  parseSheet('Mutual Funds', mf, false);
  return { equity, mf };
};

function FileUploadZone({ onFile, label, sublabel }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onFile(e.target.result, file.name);
    reader.readAsArrayBuffer(file);
  };

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10, padding: '36px 24px', textAlign: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
        background: dragging ? 'var(--surface-2)' : 'var(--surface)',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
      onMouseLeave={e => { if (!dragging) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />
      <Upload size={32} style={{ color: 'var(--ink)', margin: '0 auto 12px', display: 'block', opacity: 0.8 }} />
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{sublabel}</div>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
        .xlsx file accepted · drag & drop or click
      </div>
    </div>
  );
}

function HoldingRow({ item, onToggle, isEquity }) {
  const gain = item.plPct;
  const isPos = gain >= 0;
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      background: item.selected ? (isEquity ? 'var(--green-pale)' : 'var(--surface-2)') : 'var(--surface-2)',
      borderRadius: 6, cursor: 'pointer',
      border: `1px solid ${item.selected ? (isEquity ? 'rgba(45,106,79,0.25)' : 'rgba(200,135,58,0.25)') : 'transparent'}`,
      transition: 'all 0.1s',
    }}>
      <input type="checkbox" checked={item.selected} onChange={() => onToggle(item.id)}
        style={{ accentColor: isEquity ? 'var(--green)' : 'var(--accent)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {isEquity ? `${item.qty} shares @ ₹${item.avgPrice.toFixed(2)}` : `${item.qty.toFixed(3)} units · ${item.category}`}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: isEquity ? 'var(--green)' : 'var(--accent)' }}>
          {formatINR(item.currentValue, true)}
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isPos ? 'var(--green)' : 'var(--red)' }}>
          {isPos ? '+' : ''}{gain.toFixed(2)}%
        </div>
      </div>
    </label>
  );
}

function SummaryBar({ label, total, color }) {
  return (
    <div style={{ padding: '10px 14px', background: 'var(--ink)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color, fontSize: 14 }}>{formatINR(total)}</span>
    </div>
  );
}

export default function Import({ onImportMF, onImportStocks }) {
  const [equity, setEquity] = useState([]);
  const [mf, setMf] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState({ equity: false, mf: false });
  const [error, setError] = useState('');

  const handleFile = async (arrayBuffer, filename) => {
    setError('');
    try {
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const { equity: eq, mf: mfData } = parseZerodhaXLSX(wb);
      if (eq.length === 0 && mfData.length === 0) {
        throw new Error('No holdings found. Make sure you upload the Zerodha Holdings XLSX (console.zerodha.com → Portfolio → Holdings → Download).');
      }
      setEquity(eq);
      setMf(mfData);
      setLoaded(true);
    } catch (e) {
      setError(e.message || 'Failed to parse file.');
    }
  };

  const toggleEquity = (id) => setEquity(p => p.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  const toggleMF = (id) => setMf(p => p.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  const selectAll = (type, val) => {
    if (type === 'equity') setEquity(p => p.map(s => ({ ...s, selected: val })));
    else setMf(p => p.map(s => ({ ...s, selected: val })));
  };

  const selectedEquity = equity.filter(s => s.selected);
  const selectedMF = mf.filter(s => s.selected);
  const totalEquity = selectedEquity.reduce((s, x) => s + x.currentValue, 0);
  const totalMF = selectedMF.reduce((s, x) => s + x.currentValue, 0);

  const doImport = () => {
    const newSips = selectedMF.map(s => ({
      id: s.id, name: s.name, category: s.category,
      amount: 0, expectedReturn: s.expectedReturn,
      currentValue: s.currentValue, units: s.qty,
      nav: s.ltp, isin: s.isin,
      avgPrice: s.avgPrice,
      cost: s.cost,
      plPct: s.plPct,
      unrealizedPL: s.unrealizedPL,
      importedFromZerodha: true,
    }));
    const mfAssets = selectedMF.map(s => ({
      id: s.id + 0.1, name: s.name, category: 'Mutual Funds',
      value: s.currentValue, importedFromZerodha: true,
    }));
    const stockAssets = selectedEquity.map(s => ({
      id: s.id, name: s.name, category: 'Stocks',
      value: s.currentValue, importedFromZerodha: true,
    }));
    // Single combined call — avoids React state overwrite issue
    onImportMF(newSips, [...mfAssets, ...stockAssets]);
    setDone({ equity: true, mf: true });
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <SectionHeader
        title="Import from Zerodha"
        subtitle="Upload your Zerodha Holdings XLSX — stocks and mutual funds import in one click."
      />

      {error && (
        <Card style={{ background: 'var(--red-pale)', border: '1px solid var(--red)', padding: 14, marginBottom: 20, display: 'flex', gap: 10 }}>
          <AlertCircle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>
        </Card>
      )}

      {/* How to download */}
      {!loaded && (
        <Card style={{ padding: 20, marginBottom: 20, background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>How to download your holdings file</div>
          <div style={{ display: 'flex', gap: 32 }}>
            {['Go to console.zerodha.com', 'Click Portfolio → Holdings', 'Click Download → XLSX', 'Upload the file below'].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--ink)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{step}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loaded ? (
        <FileUploadZone
          onFile={handleFile}
          label="Upload Zerodha Holdings XLSX"
          sublabel="Contains your equity and mutual fund holdings in one file"
        />
      ) : (
        <div>
          {/* Re-upload button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => { setLoaded(false); setEquity([]); setMf([]); setDone({ equity: false, mf: false }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', background: 'none', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6 }}>
              <RefreshCw size={11} /> Upload different file
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Equity */}
            <Card style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={14} color="var(--green)" /> Equity Holdings
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{selectedEquity.length} of {equity.length} selected</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => selectAll('equity', true)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'white', color: 'var(--muted)', cursor: 'pointer' }}>All</button>
                  <button onClick={() => selectAll('equity', false)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'white', color: 'var(--muted)', cursor: 'pointer' }}>None</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
                {equity.map(s => <HoldingRow key={s.id} item={s} onToggle={toggleEquity} isEquity={true} />)}
              </div>
              <SummaryBar label="Selected value" total={totalEquity} color="var(--green)" />
            </Card>

            {/* MF */}
            <Card style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PieChart size={14} color="var(--accent)" /> Mutual Funds
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{selectedMF.length} of {mf.length} selected</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => selectAll('mf', true)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'white', color: 'var(--muted)', cursor: 'pointer' }}>All</button>
                  <button onClick={() => selectAll('mf', false)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'white', color: 'var(--muted)', cursor: 'pointer' }}>None</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
                {mf.map(s => <HoldingRow key={s.id} item={s} onToggle={toggleMF} isEquity={false} />)}
              </div>
              <SummaryBar label="Selected value" total={totalMF} color="var(--ink)" />
            </Card>
          </div>

          {/* Combined total + import button */}
          <Card style={{ padding: 20, background: 'var(--ink)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 20, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Equity</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 600, color: 'var(--green)' }}>{formatINR(totalEquity, true)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Mutual Funds</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>{formatINR(totalMF, true)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Total Portfolio</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 600, color: 'var(--surface)' }}>{formatINR(totalEquity + totalMF, true)}</div>
              </div>
              {done.equity && done.mf ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontWeight: 500, fontSize: 13 }}>
                  <CheckCircle size={18} /> Imported!
                </div>
              ) : (
                <button onClick={doImport} style={{
                  padding: '12px 24px', background: 'var(--accent)', color: 'white',
                  borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Upload size={14} /> Import All to WealthWise
                </button>
              )}
            </div>
          </Card>

          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            🔒 All parsing happens locally in your browser. Your file is never uploaded to any server.
          </div>
        </div>
      )}
    </div>
  );
}