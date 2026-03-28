import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Input, Slider } from '../components/ui.jsx';

export default function ProfileSetup({ profile, onSave }) {
  const [form, setForm] = useState(profile);
  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--paper)',
        borderRadius: 16,
        padding: 40,
        animation: 'fadeUp 0.5s ease',
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Welcome to Wealth<span style={{ color: 'var(--accent)' }}>Wise</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            Let's set up your profile. This takes 30 seconds and saves locally on your device.
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

          <Input label="Monthly Expenses (₹)" value={form.monthlyExpense} onChange={v => update('monthlyExpense', v)} prefix="₹" />
          <Input label="Target Retirement Corpus (₹)" value={form.targetCorpus} onChange={v => update('targetCorpus', v)} prefix="₹" />
          <Input label="Current Corpus / Savings (₹)" value={form.currentCorpus} onChange={v => update('currentCorpus', v)} prefix="₹" />

          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', padding: '8px 12px', background: 'var(--paper-2)', borderRadius: 6 }}>
            💡 Tip: Target = monthly expense × 300 gives a comfortable 4% SWR. For ₹1L/mo expenses → ₹3Cr corpus.
          </div>

          <button
            onClick={() => onSave(form)}
            disabled={!form.name}
            style={{
              padding: '13px 24px',
              background: form.name ? 'var(--ink)' : 'var(--paper-3)',
              color: form.name ? 'var(--paper)' : 'var(--muted)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s',
              marginTop: 8,
            }}
          >
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
