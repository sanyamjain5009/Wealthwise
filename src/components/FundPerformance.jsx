import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { searchScheme, getSchemeNAV, calculateCAGR, estimateSIPXIRR } from '../utils/mfapi.js';
import { BENCHMARKS } from '../utils/finance.js';

const NIFTY_CAGR = BENCHMARKS['Nifty 50'].cagr;
const FD_CAGR = BENCHMARKS['Fixed Deposit'].cagr;

// Map fund category to its correct benchmark index
const getCategoryBenchmark = (category) => {
  const c = (category || '').toLowerCase();
  if (c.includes('small cap')) return { name: 'Smallcap 250', cagr: BENCHMARKS['Nifty Smallcap 250'].cagr };
  if (c.includes('mid cap') || c.includes('midcap')) return { name: 'Midcap 150', cagr: BENCHMARKS['Nifty Midcap 150'].cagr };
  if (c.includes('large cap') || c.includes('largecap')) return { name: 'Nifty 50', cagr: BENCHMARKS['Nifty 50'].cagr };
  if (c.includes('elss') || c.includes('flexi') || c.includes('multi') || c.includes('sectoral')) return { name: 'Nifty 500', cagr: 13.8 };
  if (c.includes('debt') || c.includes('liquid')) return { name: 'FD', cagr: FD_CAGR };
  return { name: 'Nifty 50', cagr: BENCHMARKS['Nifty 50'].cagr };
};

function MetricBox({ label, value, color = 'var(--ink)', sub }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 7, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, letterSpacing: '0.02em' }}>{label}</div>
      <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ cagr, category }) {
  if (cagr === null || cagr === undefined) return null;
  const bench = getCategoryBenchmark(category);
  const gap = cagr - bench.cagr;
  let label, bg, color;
  if (gap >= 1) {
    label = `Beats ${bench.name}`; bg = 'var(--green-pale)'; color = 'var(--green)';
  } else if (gap >= -1) {
    label = `Matches ${bench.name}`; bg = 'var(--blue-pale)'; color = 'var(--blue)';
  } else if (cagr >= FD_CAGR + 3) {
    label = `Lags ${bench.name}`; bg = 'var(--amber-pale)'; color = 'var(--amber)';
  } else {
    label = 'Near FD'; bg = 'var(--red-pale)'; color = 'var(--red)';
  }
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: bg, color, fontWeight: 500 }}>
      {label}
    </span>
  );
}

// Single fund performance card with live data
export function FundPerformanceCard({ sip, onReturnUpdate }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [schemeCode, setSchemeCode] = useState(sip.schemeCode || null);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  // Auto-fetch if we have a scheme code, else auto-search by name
  useEffect(() => {
    if (schemeCode) {
      fetchData(schemeCode);
    } else if (sip.name && !data && !loading) {
      autoLink();
    }
  }, []);

  const autoLink = async () => {
    setLoading(true);
    // Search by fund name — try first word + "direct" for best match
    const words = sip.name.split(' ').slice(0, 3).join(' ');
    const results = await searchScheme(words);
    if (results.length > 0) {
      // Prefer direct plans
      const direct = results.find(r => r.schemeName?.toLowerCase().includes('direct')) || results[0];
      setSchemeCode(direct.schemeCode);
      await fetchData(direct.schemeCode);
    } else {
      setLoading(false);
    }
  };

  const fetchData = async (code) => {
    setLoading(true);
    setError('');
    try {
      const navData = await getSchemeNAV(code);
      if (!navData) throw new Error('No data');
      const cagr = calculateCAGR(navData);
      if (!cagr) throw new Error('Insufficient history');

      // Estimate XIRR from Zerodha import data if available
      let xirr = null;
      if (sip.avgPrice && sip.units && sip.nav && sip.amount) {
        xirr = estimateSIPXIRR(sip.avgPrice, sip.units, sip.nav, sip.amount);
      }

      setData({ ...cagr, xirr, schemeName: navData.meta?.scheme_name, schemeCode: code });

      // Auto-update the SIP's expectedReturn with 5Y CAGR (or 3Y if 5Y unavailable)
      const bestCAGR = cagr.cagr5Y ?? cagr.cagr3Y ?? cagr.cagr1Y;
      if (bestCAGR && onReturnUpdate) {
        onReturnUpdate(parseFloat(bestCAGR.toFixed(2)));
      }
    } catch (e) {
      setError('Could not fetch live data. Search manually below.');
    }
    setLoading(false);
  };

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const results = await searchScheme(query);
    setSearchResults(results.slice(0, 8));
    setSearching(false);
  };

  const selectScheme = (code) => {
    setSchemeCode(code);
    setShowSearch(false);
    setSearchResults([]);
    setQuery('');
  };

  const cagrColor = (val) => {
    if (val === null || val === undefined) return 'var(--muted)';
    if (val >= NIFTY_CAGR) return 'var(--green)';
    if (val >= FD_CAGR + 3) return 'var(--amber)';
    return 'var(--red)';
  };

  const fmt = (v) => v !== null && v !== undefined ? `${v.toFixed(1)}%` : null;

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={12} /> Live Performance
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {data && <StatusBadge cagr={data.cagr5Y ?? data.cagr3Y} category={sip.category} />}
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Search size={10} /> {schemeCode ? 'Change' : 'Link Fund'}
          </button>
          {schemeCode && (
            <button onClick={() => fetchData(schemeCode)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>
              <RefreshCw size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div style={{ marginBottom: 12, background: 'var(--surface-2)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder={`Search for "${sip.name.split(' ')[0]}..."`}
              style={{ flex: 1, padding: '7px 10px', borderRadius: 5, border: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--font-body)', background: 'var(--surface)' }}
              autoFocus
            />
            <button onClick={doSearch} disabled={searching} style={{ padding: '7px 12px', background: 'var(--ink)', color: 'white', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>
              {searching ? '...' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {searchResults.map(r => (
                <button key={r.schemeCode} onClick={() => selectScheme(r.schemeCode)} style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11, cursor: 'pointer', color: 'var(--ink)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                >
                  <div style={{ fontWeight: 500, marginBottom: 1 }}>{r.schemeName}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Code: {r.schemeCode}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
          <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Fetching live NAV data...
        </div>
      )}

      {/* Error */}
      {error && !loading && !schemeCode && (
        <div style={{ fontSize: 11, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}

      {/* Data display */}
      {data && !loading && (
        <div>
          {data.schemeName && (
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.4 }}>
              {data.schemeName}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: data.xirr ? 8 : 0 }}>
            <MetricBox label="1Y CAGR" value={fmt(data.cagr1Y)} color={cagrColor(data.cagr1Y)} />
            <MetricBox label="3Y CAGR" value={fmt(data.cagr3Y)} color={cagrColor(data.cagr3Y)} />
            <MetricBox label="5Y CAGR" value={fmt(data.cagr5Y)} color={cagrColor(data.cagr5Y)} sub="Used for projections" />
            <MetricBox label="Since Launch" value={fmt(data.cagrInception)} color={cagrColor(data.cagrInception)} sub={`${data.inceptionYears}Y history`} />
          </div>

          {/* vs benchmark strip */}
          {(data.cagr5Y || data.cagr3Y) && (() => {
            const bench = getCategoryBenchmark(sip.category);
            const cagr = data.cagr5Y ?? data.cagr3Y;
            const vsBench = cagr !== null ? ((cagr - bench.cagr) >= 0 ? '+' : '') + (cagr - bench.cagr).toFixed(1) + '%' : null;
            const vsNifty50 = cagr !== null ? ((cagr - BENCHMARKS['Nifty 50'].cagr) >= 0 ? '+' : '') + (cagr - BENCHMARKS['Nifty 50'].cagr).toFixed(1) + '%' : null;
            return (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {[
                  { label: `vs ${bench.name} (5Y)`, val: vsBench },
                  bench.name !== 'Nifty 50' ? { label: 'vs Nifty 50 (5Y)', val: vsNifty50 } : null,
                ].filter(x => x && x.val).map(({ label, val }) => {
                  const isPos = !val.startsWith('-');
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: isPos ? 'var(--green-pale)' : 'var(--red-pale)' }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: isPos ? 'var(--green)' : 'var(--red)' }}>{val}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* XIRR from actual SIP data */}
          {data.xirr !== null && data.xirr !== undefined && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--blue-pale)', borderRadius: 6, border: '1px solid rgba(37,99,235,0.15)' }}>
              <div style={{ fontSize: 10, color: 'var(--blue)', marginBottom: 2, fontWeight: 500 }}>Your Estimated XIRR (based on actual units & avg price)</div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: data.xirr >= NIFTY_CAGR ? 'var(--green)' : 'var(--amber)' }}>
                {data.xirr.toFixed(1)}%
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>
                  vs Nifty {data.xirr >= NIFTY_CAGR ? `(+${(data.xirr - NIFTY_CAGR).toFixed(1)}% alpha)` : `(${(data.xirr - NIFTY_CAGR).toFixed(1)}% lag)`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No scheme linked yet */}
      {!schemeCode && !loading && !error && (
        <div style={{ fontSize: 11, color: 'var(--muted)', padding: '4px 0' }}>
          Click "Link Fund" to fetch live CAGR data from AMFI.
        </div>
      )}
    </div>
  );
}