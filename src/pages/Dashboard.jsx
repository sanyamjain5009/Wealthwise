import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, PieChart, ArrowRight } from 'lucide-react';
import { Card, StatCard, SectionHeader } from '../components/ui.jsx';
import { formatINR, calcSIPFV, buildSIPProjection, yearsToRetirement } from '../utils/finance.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--ink)', padding: '10px 14px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatINR(p.value, true)}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ profile, sips, netWorth, onNav }) {
  const age = profile.age;
  const retAge = profile.retirementAge;
  const years = yearsToRetirement(age, retAge);

  const totalMonthlySIP = sips.reduce((sum, s) => sum + s.amount, 0);
  const totalInvested = netWorth.reduce((sum, a) => sum + a.value, 0);

  const projectedCorpus = useMemo(() => {
    const avgReturn = sips.length > 0
      ? sips.reduce((s, x) => s + x.expectedReturn * x.amount, 0) / totalMonthlySIP
      : 13;
    return calcSIPFV(totalMonthlySIP, avgReturn || 13, years) + totalInvested * Math.pow(1.13, years);
  }, [sips, totalMonthlySIP, years, totalInvested]);

  const chartData = useMemo(() => buildSIPProjection(totalMonthlySIP, 13, Math.min(years, 20), totalInvested), [totalMonthlySIP, years, totalInvested]);

  const progress = Math.min((projectedCorpus / profile.targetCorpus) * 100, 100);

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <SectionHeader
        title={`Good day, ${profile.name || 'Investor'} ✦`}
        subtitle={`${years} years to retirement · Age ${age} → ${retAge}`}
      />

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Net Worth"
          value={formatINR(totalInvested, true)}
          sub="across all assets"
          accent
        />
        <StatCard
          label="Monthly SIP"
          value={formatINR(totalMonthlySIP, true)}
          sub={`${sips.length} fund${sips.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Projected Corpus"
          value={formatINR(projectedCorpus, true)}
          sub={`by age ${retAge}`}
          trend={projectedCorpus >= profile.targetCorpus ? 12.4 : -8.2}
        />
        <StatCard
          label="Target Corpus"
          value={formatINR(profile.targetCorpus, true)}
          sub={`${profile.swr}% SWR`}
        />
      </div>

      {/* Progress bar */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Retirement Goal Progress</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)' }}>{progress.toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: progress >= 100 ? 'var(--green)' : progress >= 70 ? 'var(--accent)' : 'var(--red)',
            borderRadius: 4,
            transition: 'width 1s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          <span>Current: {formatINR(totalInvested, true)}</span>
          <span>Gap: {formatINR(Math.max(0, profile.targetCorpus - projectedCorpus), true)}</span>
          <span>Target: {formatINR(profile.targetCorpus, true)}</span>
        </div>
      </Card>

      {/* Chart + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>Corpus Projection</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>@ 13% avg CAGR</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--green)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => formatINR(v, true)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="corpus" name="Corpus" stroke="#000" strokeWidth={2} fill="url(#corpusGrad)" />
              <Area type="monotone" dataKey="invested" name="Invested" stroke="var(--green)" strokeWidth={1.5} fill="url(#investedGrad)" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Plan your SIPs', sub: 'Add & project funds', icon: TrendingUp, page: 'sip' },
            { label: 'Retirement Calculator', sub: 'Model your corpus', icon: Target, page: 'retirement' },
            { label: 'Benchmark vs Index', sub: 'Compare returns', icon: PieChart, page: 'benchmark' },
          ].map(({ label, sub, icon: Icon, page }) => (
            <Card
              key={page}
              onClick={() => onNav(page)}
              style={{ cursor: 'pointer', transition: 'all 0.15s', padding: 16 }}
              className="hover-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
                  </div>
                </div>
                <ArrowRight size={14} color="var(--muted)" />
              </div>
            </Card>
          ))}

          {/* SIP summary */}
          {sips.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active SIPs</div>
              {sips.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < Math.min(sips.length, 3) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 12 }}>{s.name}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{formatINR(s.amount, true)}/mo</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}