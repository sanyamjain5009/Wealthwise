import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Slider, CurrencyInput } from '../components/ui.jsx';
import { inflateToFuture, formatINR } from '../utils/finance.js';

export default function ProfileSetup({ profile, onSave }) {
  const [form, setForm] = useState(profile);
  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const years = form.retirementAge - form.age;
  const inflatedCorpus = inflateToFuture(form.targetCorpus, form.inflation || 6, years);
  const inflatedExpense = inflateToFuture(form.monthlyExpense, form.inflation || 6, years);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface-2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 500,
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 40,
        animation: 'fadeUp 0.5s ease',
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Welcome to Wealth<span style={{ color: 'var(--ink)' }}>Wise</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>
            Enter everything in <strong>today's money</strong> — we'll handle inflation automatically.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your Name</label>
            <input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Sanyam"
              style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', background: 'white' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <Slider label="Current Age" value={form.age} onChange={v => update('age', v)} min={20} max={50} format={v => `${v} years`} />
          <Slider label="Target Retirement Age" value={form.retirementAge} onChange={v => update('retirementAge', v)} min={35} max={65} format={v => `${v} years`} />
          <Slider label="Inflation Assumption" value={form.inflation || 6} onChange={v => update('inflation', v)} min={4} max={10} step={0.5} format={v => `${v}%`} />

          <CurrencyInput
            label="Monthly Expenses (today's money)"
            value={form.monthlyExpense}
            onChange={v => update('monthlyExpense', v)}
            hint={`At retirement this becomes ${formatINR(inflatedExpense, true)}/mo in future money`}
          />

          <CurrencyInput
            label="Target Retirement Corpus (today's money)"
            value={form.targetCorpus}
            onChange={v => update('targetCorpus', v)}
            hint={`In ${years}Y this equals ${formatINR(inflatedCorpus, true)} in future money`}
          />

          <CurrencyInput
            label="Current Savings / Corpus"
            value={form.currentCorpus}
            onChange={v => update('currentCorpus', v)}
          />

          {/* Inflation preview box */}
          {form.targetCorpus > 0 && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Inflation Impact Preview
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Your target today</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatINR(form.targetCorpus, true)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Years to retirement</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{years} yrs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Inflation rate</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{form.inflation || 6}% p.a.</span>
              </div>
              <div style={{ height: 1, background: 'rgba(200,135,58,0.2)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>Actual target at retirement</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)' }}>{formatINR(inflatedCorpus, true)}</span>
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
            💡 Rule of thumb: Monthly expense × 300 = corpus for 4% SWR. E.g. ₹1L/mo → ₹3Cr today's money.
          </div>

          <button
            onClick={() => onSave(form)}
            disabled={!form.name}
            style={{
              padding: '13px 24px',
              background: form.name ? 'var(--ink)' : 'var(--surface-4)',
              color: form.name ? '#fff' : 'var(--muted)',
              borderRadius: 8, fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s', marginTop: 8,
            }}
          >
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}