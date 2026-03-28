import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, SectionHeader, Slider, CurrencyInput } from '../components/ui.jsx';
import { formatINR, calcSIPFV, requiredSIP, calcSWR, yearsToRetirement, inflateToFuture } from '../utils/finance.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--ink)', padding: '10px 14px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.stroke || p.fill || 'var(--accent)', marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatINR(p.value, true) : p.value}
        </div>
      ))}
    </div>
  );
};

// Step-up SIP: FV = P * sum[(1+r)^n * (1+g)^(n-1)] for n=1..N (monthly)
// where g = annual step-up rate, r = monthly return rate
const calcStepUpSIPFV = (monthlyAmount, annualReturn, annualStepUp, years) => {
  const r = annualReturn / 100 / 12;
  const g = annualStepUp / 100 / 12; // monthly step-up approximation
  let fv = 0;
  let currentSIP = monthlyAmount;
  const totalMonths = years * 12;
  for (let m = 1; m <= totalMonths; m++) {
    fv += currentSIP * Math.pow(1 + r, totalMonths - m + 1);
    // Step up annually
    if (m % 12 === 0) currentSIP = currentSIP * (1 + annualStepUp / 100);
  }
  return fv;
};

// Required flat SIP to reach target (from gap after existing corpus growth)
const calcRequiredFlatSIP = (target, currentCorpus, annualReturn, years) => {
  const existingGrowth = currentCorpus * Math.pow(1 + annualReturn / 100, years);
  const gap = Math.max(0, target - existingGrowth);
  return requiredSIP(gap, annualReturn, years);
};

// Required starting SIP for step-up to reach target
const calcRequiredStepUpSIP = (target, currentCorpus, annualReturn, annualStepUp, years) => {
  const existingGrowth = currentCorpus * Math.pow(1 + annualReturn / 100, years);
  const gap = Math.max(0, target - existingGrowth);
  if (gap <= 0) return 0;
  // Binary search for starting SIP
  let lo = 0, hi = gap / years / 12;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fv = calcStepUpSIPFV(mid, annualReturn, annualStepUp, years);
    if (fv < gap) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
};

// Build year-by-year step-up SIP table
const buildStepUpTable = (startingSIP, annualStepUp, annualReturn, years, currentCorpus) => {
  const rows = [];
  let sip = startingSIP;
  let corpus = currentCorpus;
  const monthlyRate = annualReturn / 100 / 12;

  for (let yr = 1; yr <= years; yr++) {
    const startCorpus = corpus;
    // Grow corpus for this year (existing + SIP contributions)
    for (let m = 0; m < 12; m++) {
      corpus = corpus * (1 + monthlyRate) + sip;
    }
    rows.push({
      year: yr,
      age: null, // filled by caller
      label: `Year ${yr}`,
      monthlySIP: Math.round(sip),
      annualSIP: Math.round(sip * 12),
      corpusEnd: Math.round(corpus),
      growth: Math.round(corpus - startCorpus - sip * 12),
    });
    sip = sip * (1 + annualStepUp / 100);
  }
  return rows;
};

export default function Retirement({ profile, onProfileChange, sips, netWorthTotal }) {
  const [stepUpRate, setStepUpRate] = useState(10);
  const [showFullTable, setShowFullTable] = useState(false);

  const years = yearsToRetirement(profile.age, profile.retirementAge);
  const totalMonthly = sips.reduce((s, x) => s + x.amount, 0);
  const currentCorpus = netWorthTotal || 0;

  const targetCorpusFuture = inflateToFuture(profile.targetCorpus, profile.inflation, years);
  const monthlyExpenseFuture = inflateToFuture(profile.monthlyExpense, profile.inflation, years);

  const projectedCorpus = useMemo(() => {
    const sipCorpus = calcSIPFV(totalMonthly, profile.expectedReturn, years);
    const existingGrowth = currentCorpus * Math.pow(1 + profile.expectedReturn / 100, years);
    return sipCorpus + existingGrowth;
  }, [totalMonthly, profile, years, currentCorpus]);

  const annualExpenseAtRetirement = monthlyExpenseFuture * 12;
  const requiredCorpusForSWR = annualExpenseAtRetirement / (profile.swr / 100);
  const effectiveTarget = Math.max(targetCorpusFuture, requiredCorpusForSWR);
  const surplus = projectedCorpus - effectiveTarget;
  const onTrack = surplus >= 0;
  const actualSWR = calcSWR(projectedCorpus, annualExpenseAtRetirement);

  // Required SIPs
  const reqFlatSIP = useMemo(() => calcRequiredFlatSIP(effectiveTarget, currentCorpus, profile.expectedReturn, years), [effectiveTarget, currentCorpus, profile.expectedReturn, years]);
  const reqStepUpSIP = useMemo(() => calcRequiredStepUpSIP(effectiveTarget, currentCorpus, profile.expectedReturn, stepUpRate, years), [effectiveTarget, currentCorpus, profile.expectedReturn, stepUpRate, years]);

  // Step-up table
  const stepUpTable = useMemo(() => {
    const rows = buildStepUpTable(reqStepUpSIP, stepUpRate, profile.expectedReturn, years, currentCorpus);
    return rows.map((r, i) => ({ ...r, age: profile.age + i + 1, label: `Age ${profile.age + i + 1}` }));
  }, [reqStepUpSIP, stepUpRate, profile.expectedReturn, years, currentCorpus, profile.age]);

  const visibleRows = showFullTable ? stepUpTable : stepUpTable.slice(0, 5);

  // Drawdown simulation
  const drawdownData = useMemo(() => {
    const yearsInRetirement = 90 - profile.retirementAge;
    const data = [];
    let corpus = projectedCorpus;
    const annualReturn = profile.postRetirementReturn / 100;
    for (let yr = 0; yr <= yearsInRetirement; yr++) {
      data.push({ label: `${profile.retirementAge + yr}`, corpus: Math.max(0, Math.round(corpus)) });
      const thisYearExpense = annualExpenseAtRetirement * Math.pow(1 + profile.inflation / 100, yr);
      corpus = corpus * (1 + annualReturn) - thisYearExpense;
      if (corpus <= 0) { data.push({ label: `${profile.retirementAge + yr + 1}`, corpus: 0 }); break; }
    }
    return data;
  }, [projectedCorpus, profile, annualExpenseAtRetirement]);

  const corpusLastsUntil = drawdownData.findIndex(d => d.corpus === 0);
  const corpusAge = corpusLastsUntil > 0 ? profile.retirementAge + corpusLastsUntil : '90+';

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <SectionHeader title="Retirement Planner" subtitle={`All inputs in today's money · ${years} years to retirement · Inflation adjusted automatically`} />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Your Profile <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>(today's money)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Slider label="Current Age" value={profile.age} onChange={v => onProfileChange({ ...profile, age: v })} min={20} max={50} format={v => `${v} yrs`} />
              <Slider label="Retirement Age" value={profile.retirementAge} onChange={v => onProfileChange({ ...profile, retirementAge: v })} min={35} max={65} format={v => `${v} yrs`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.07em', color: 'var(--muted)', textTransform: 'uppercase' }}>Current Net Worth</label>
                <div style={{ padding: '10px 14px', background: 'var(--green-pale)', border: '1px solid var(--green-light)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--green)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatINR(currentCorpus)}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>← from Net Worth</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Update in the Net Worth tab</div>
              </div>
              <CurrencyInput label="Monthly Expenses Today (₹)" value={profile.monthlyExpense} onChange={v => onProfileChange({ ...profile, monthlyExpense: v })} hint={`= ${formatINR(monthlyExpenseFuture, true)}/mo at retirement`} />
              <CurrencyInput label="Target Corpus (today's money)" value={profile.targetCorpus} onChange={v => onProfileChange({ ...profile, targetCorpus: v })} hint={`= ${formatINR(targetCorpusFuture, true)} in future money`} />
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Assumptions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Slider label="Pre-Retirement Return" value={profile.expectedReturn} onChange={v => onProfileChange({ ...profile, expectedReturn: v })} min={8} max={20} step={0.5} format={v => `${v}%`} />
              <Slider label="Post-Retirement Return" value={profile.postRetirementReturn} onChange={v => onProfileChange({ ...profile, postRetirementReturn: v })} min={5} max={12} step={0.5} format={v => `${v}%`} />
              <Slider label="Inflation Rate" value={profile.inflation} onChange={v => onProfileChange({ ...profile, inflation: v })} min={4} max={10} step={0.5} format={v => `${v}%`} />
              <Slider label="Safe Withdrawal Rate" value={profile.swr} onChange={v => onProfileChange({ ...profile, swr: v })} min={2} max={6} step={0.1} format={v => `${v}%`} />
              <Slider label="Annual SIP Step-Up" value={stepUpRate} onChange={setStepUpRate} min={0} max={25} step={1} format={v => `${v}%`} />
            </div>
          </Card>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status */}
          <Card style={{ background: onTrack ? 'var(--green)' : 'var(--red)', color: 'white', padding: 20 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {onTrack ? '✓ On Track' : '⚠ Shortfall Detected'}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, letterSpacing: '-1px' }}>
              {formatINR(Math.abs(surplus), true)}
            </div>
            <div style={{ opacity: 0.75, fontSize: 13, marginTop: 4 }}>
              {onTrack ? 'projected surplus at retirement' : 'projected shortfall — see SIP plan below'}
            </div>
          </Card>

          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Projected Corpus', val: formatINR(projectedCorpus, true), sub: `by age ${profile.retirementAge}`, color: 'var(--accent)' },
              { label: 'Required Corpus', val: formatINR(effectiveTarget, true), sub: `at ${profile.swr}% SWR`, color: 'var(--ink)' },
              { label: 'Monthly Expense at Retirement', val: formatINR(monthlyExpenseFuture, true), sub: `${profile.inflation}% inflation × ${years}Y`, color: 'var(--ink)' },
            ].map(({ label, val, sub, color }) => (
              <Card key={label} style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Your Actual SWR', val: `${actualSWR.toFixed(2)}%`, sub: actualSWR <= 4 ? '✓ Sustainable' : '⚠ High — build more corpus', color: actualSWR <= 4 ? 'var(--green)' : 'var(--red)' },
              { label: 'Corpus Lasts Until', val: `Age ${corpusAge}`, sub: `${typeof corpusAge === 'number' ? corpusAge - profile.retirementAge : '30+'} yrs of retirement`, color: 'var(--ink)' },
              { label: 'Current Monthly SIP', val: formatINR(totalMonthly, true), sub: `across ${sips.length} fund${sips.length !== 1 ? 's' : ''}`, color: 'var(--accent)' },
            ].map(({ label, val, sub, color }) => (
              <Card key={label} style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>
              </Card>
            ))}
          </div>

          {/* SIP PLAN — flat vs step-up comparison */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>SIP Plan to Hit Your Target</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Two ways to reach {formatINR(effectiveTarget, true)} in {years} years</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {/* Flat SIP */}
              <div style={{ background: 'var(--paper-2)', borderRadius: 10, padding: 18, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Option A — Flat SIP</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
                  {formatINR(reqFlatSIP, true)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>per month, every month</div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  Same amount forever.<br />
                  Total invested: <strong>{formatINR(reqFlatSIP * 12 * years, true)}</strong>
                </div>
                {totalMonthly > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, padding: '5px 8px', borderRadius: 4, background: reqFlatSIP <= totalMonthly ? 'var(--green-pale)' : 'var(--red-pale)', color: reqFlatSIP <= totalMonthly ? 'var(--green)' : 'var(--red)' }}>
                    {reqFlatSIP <= totalMonthly ? `✓ Your current SIP covers this` : `↑ Need ${formatINR(reqFlatSIP - totalMonthly, true)}/mo more`}
                  </div>
                )}
              </div>

              {/* Step-up SIP */}
              <div style={{ background: 'var(--accent-pale)', borderRadius: 10, padding: 18, border: '1px solid rgba(200,135,58,0.3)' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Option B — Step-Up SIP ({stepUpRate}%/yr)</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.5px' }}>
                  {formatINR(reqStepUpSIP, true)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>starting monthly SIP</div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid rgba(200,135,58,0.2)', paddingTop: 10 }}>
                  Increases {stepUpRate}% every year.<br />
                  Year {years} SIP: <strong>{formatINR(reqStepUpSIP * Math.pow(1 + stepUpRate / 100, years - 1), true)}/mo</strong>
                </div>
                {totalMonthly > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, padding: '5px 8px', borderRadius: 4, background: reqStepUpSIP <= totalMonthly ? 'var(--green-pale)' : 'var(--accent-pale)', color: reqStepUpSIP <= totalMonthly ? 'var(--green)' : 'var(--accent)', border: '1px solid rgba(200,135,58,0.2)' }}>
                    {reqStepUpSIP <= totalMonthly ? `✓ Your current SIP covers this` : `↑ Need ${formatINR(reqStepUpSIP - totalMonthly, true)}/mo more to start`}
                  </div>
                )}
              </div>
            </div>

            {/* Step-up SIP bar chart */}
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>Step-Up SIP — Annual Amount Over Time</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stepUpTable} barSize={18}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} interval={Math.floor(years / 6)} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => formatINR(v, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="annualSIP" name="Annual SIP" radius={[3, 3, 0, 0]}>
                  {stepUpTable.map((_, i) => (
                    <Cell key={i} fill={`rgba(200,135,58,${0.4 + (i / stepUpTable.length) * 0.6})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Year-by-year table */}
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Year-by-Year Step-Up SIP Plan</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Starting at {formatINR(reqStepUpSIP, true)}/mo, stepping up {stepUpRate}% annually</div>
              </div>
              <button onClick={() => setShowFullTable(!showFullTable)} style={{ fontSize: 11, padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 5, background: 'white', color: 'var(--muted)', cursor: 'pointer' }}>
                {showFullTable ? 'Show less' : `Show all ${years} years`}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Age', 'Monthly SIP', 'Annual SIP', 'Corpus End of Year'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Age' ? 'left' : 'right', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, i) => (
                    <tr key={row.year} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--paper)' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 500 }}>
                        {row.age}
                        {row.age === profile.retirementAge && <span style={{ marginLeft: 6, fontSize: 9, background: 'var(--green)', color: 'white', padding: '1px 5px', borderRadius: 3 }}>RETIRE</span>}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 500 }}>{formatINR(row.monthlySIP, true)}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{formatINR(row.annualSIP, true)}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatINR(row.corpusEnd, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Drawdown chart */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Corpus Drawdown in Retirement</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>Future money · Expenses grow with {profile.inflation}% inflation throughout retirement</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={drawdownData}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={onTrack ? 'var(--green)' : 'var(--red)'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={onTrack ? 'var(--green)' : 'var(--red)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => formatINR(v, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="corpus" name="Corpus" stroke={onTrack ? 'var(--green)' : 'var(--red)'} strokeWidth={2} fill="url(#ddGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

        </div>
      </div>
    </div>
  );
}