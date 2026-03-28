import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, SectionHeader, Slider, CurrencyInput } from '../components/ui.jsx';
import { formatINR, calcSIPFV, requiredSIP, calcSWR, yearsToRetirement, inflateToFuture } from '../utils/finance.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--ink)', padding: '10px 14px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Age {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.stroke || p.fill, marginBottom: 2 }}>
          {p.name}: {formatINR(p.value, true)}
        </div>
      ))}
    </div>
  );
};

export default function Retirement({ profile, onProfileChange, sips }) {
  const years = yearsToRetirement(profile.age, profile.retirementAge);
  const totalMonthly = sips.reduce((s, x) => s + x.amount, 0);

  // All inputs are in TODAY'S money — inflate to future value for calculations
  const targetCorpusFuture = inflateToFuture(profile.targetCorpus, profile.inflation, years);
  const monthlyExpenseFuture = inflateToFuture(profile.monthlyExpense, profile.inflation, years);
  const currentCorpusFuture = inflateToFuture(profile.currentCorpus || 0, profile.expectedReturn, years);

  const projectedCorpus = useMemo(() => {
    const sipCorpus = calcSIPFV(totalMonthly, profile.expectedReturn, years);
    const existingGrowth = (profile.currentCorpus || 0) * Math.pow(1 + profile.expectedReturn / 100, years);
    return sipCorpus + existingGrowth;
  }, [totalMonthly, profile, years]);

  const annualExpenseAtRetirement = monthlyExpenseFuture * 12;
  const requiredCorpusForSWR = annualExpenseAtRetirement / (profile.swr / 100);

  // Use whichever is higher: user's stated target (inflated) or SWR-required corpus
  const effectiveTarget = Math.max(targetCorpusFuture, requiredCorpusForSWR);

  const surplus = projectedCorpus - effectiveTarget;
  const onTrack = surplus >= 0;

  const reqSIP = useMemo(() => {
    const gap = effectiveTarget - (profile.currentCorpus || 0) * Math.pow(1 + profile.expectedReturn / 100, years);
    return requiredSIP(Math.max(0, gap), profile.expectedReturn, years);
  }, [profile, years, effectiveTarget]);

  const actualSWR = calcSWR(projectedCorpus, annualExpenseAtRetirement);

  // Drawdown simulation
  const drawdownData = useMemo(() => {
    const yearsInRetirement = 90 - profile.retirementAge;
    const data = [];
    let corpus = projectedCorpus;
    const annualReturn = profile.postRetirementReturn / 100;
    for (let yr = 0; yr <= yearsInRetirement; yr++) {
      data.push({ label: `${profile.retirementAge + yr}`, corpus: Math.max(0, Math.round(corpus)) });
      // Expenses grow with inflation even in retirement
      const thisYearExpense = annualExpenseAtRetirement * Math.pow(1 + profile.inflation / 100, yr);
      corpus = corpus * (1 + annualReturn) - thisYearExpense;
      if (corpus <= 0) {
        data.push({ label: `${profile.retirementAge + yr + 1}`, corpus: 0 });
        break;
      }
    }
    return data;
  }, [projectedCorpus, profile, annualExpenseAtRetirement]);

  const corpusLastsUntil = drawdownData.findIndex(d => d.corpus === 0);
  const corpusAge = corpusLastsUntil > 0 ? profile.retirementAge + corpusLastsUntil : '90+';

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <SectionHeader
        title="Retirement Planner"
        subtitle={`All inputs in today's money · ${years} years to retirement · Inflation adjusted automatically`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Your Profile <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>(today's money)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Slider label="Current Age" value={profile.age} onChange={v => onProfileChange({ ...profile, age: v })} min={20} max={50} format={v => `${v} yrs`} />
              <Slider label="Retirement Age" value={profile.retirementAge} onChange={v => onProfileChange({ ...profile, retirementAge: v })} min={35} max={65} format={v => `${v} yrs`} />
              <CurrencyInput
                label="Current Savings (₹)"
                value={profile.currentCorpus || 0}
                onChange={v => onProfileChange({ ...profile, currentCorpus: v })}
              />
              <CurrencyInput
                label="Monthly Expenses Today (₹)"
                value={profile.monthlyExpense}
                onChange={v => onProfileChange({ ...profile, monthlyExpense: v })}
                hint={`= ${formatINR(monthlyExpenseFuture, true)}/mo at retirement`}
              />
              <CurrencyInput
                label="Target Corpus (today's money)"
                value={profile.targetCorpus}
                onChange={v => onProfileChange({ ...profile, targetCorpus: v })}
                hint={`= ${formatINR(targetCorpusFuture, true)} in future money`}
              />
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Assumptions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Slider label="Pre-Retirement Return" value={profile.expectedReturn} onChange={v => onProfileChange({ ...profile, expectedReturn: v })} min={8} max={20} step={0.5} format={v => `${v}%`} />
              <Slider label="Post-Retirement Return" value={profile.postRetirementReturn} onChange={v => onProfileChange({ ...profile, postRetirementReturn: v })} min={5} max={12} step={0.5} format={v => `${v}%`} />
              <Slider label="Inflation Rate" value={profile.inflation} onChange={v => onProfileChange({ ...profile, inflation: v })} min={4} max={10} step={0.5} format={v => `${v}%`} />
              <Slider label="Safe Withdrawal Rate" value={profile.swr} onChange={v => onProfileChange({ ...profile, swr: v })} min={2} max={6} step={0.1} format={v => `${v}%`} />
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
              {onTrack ? 'projected surplus (future money)' : 'projected shortfall — increase SIP or target'}
            </div>
          </Card>

          {/* Today vs Future comparison */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Today's Money → Future Money</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 8, alignItems: 'center' }}>
              {[
                { label: 'Target Corpus', today: profile.targetCorpus, future: targetCorpusFuture },
                { label: 'Monthly Expense', today: profile.monthlyExpense, future: monthlyExpenseFuture },
              ].map(({ label, today, future }) => (
                <React.Fragment key={label}>
                  <div style={{ background: 'var(--paper-2)', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>TODAY</div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatINR(today, true)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 16, color: 'var(--muted)' }}>→</div>
                  <div style={{ background: 'var(--accent-pale)', border: '1px solid rgba(200,135,58,0.2)', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>IN {years}Y</div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>{formatINR(future, true)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </Card>

          {/* Key numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Projected Corpus', val: formatINR(projectedCorpus, true), sub: `by age ${profile.retirementAge}` },
              { label: 'Inflation-Adjusted Target', val: formatINR(effectiveTarget, true), sub: `at ${profile.swr}% SWR` },
              { label: 'Required SIP', val: formatINR(Math.max(0, reqSIP), true), sub: 'per month to hit goal' },
            ].map(({ label, val, sub }) => (
              <Card key={label} style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Monthly Expense at Retirement', val: formatINR(monthlyExpenseFuture, true), sub: `${profile.inflation}% inflation for ${years}Y` },
              { label: 'Your Actual SWR', val: `${actualSWR.toFixed(2)}%`, sub: actualSWR <= 4 ? '✓ Sustainable' : '⚠ High — build more corpus' },
              { label: 'Corpus Lasts Until', val: `Age ${corpusAge}`, sub: `${typeof corpusAge === 'number' ? corpusAge - profile.retirementAge : '30+'} years in retirement` },
            ].map(({ label, val, sub }) => (
              <Card key={label} style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>
              </Card>
            ))}
          </div>

          {/* Drawdown chart */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Corpus Drawdown in Retirement</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>
              Future money · Expenses grow with {profile.inflation}% inflation throughout retirement
            </div>
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