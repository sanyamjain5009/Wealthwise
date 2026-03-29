import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User } from 'lucide-react';
import { Card, SectionHeader } from '../components/ui.jsx';
import { formatINR, yearsToRetirement } from '../utils/finance.js';

const SUGGESTIONS = [
  "Am I on track for early retirement?",
  "How should I rebalance my SIPs?",
  "What's a good SWR for Indian investors?",
  "Should I add ELSS for 80C benefits?",
  "How do I plan for medical inflation in retirement?",
  "What is the ideal equity-debt ratio for my age?",
];

function buildContext(profile, sips, assets) {
  const totalSIP = sips.reduce((s, x) => s + x.amount, 0);
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const years = yearsToRetirement(profile.age, profile.retirementAge);
  return `You are WealthWise, a personal finance advisor for an Indian investor. Be concise, practical, and India-specific (mention INR, Indian funds, SEBI, 80C, NPS, PPF, etc. where relevant).

USER PROFILE:
- Age: ${profile.age}, Target retirement age: ${profile.retirementAge} (${years} years away)
- Current net worth: Rs ${totalAssets.toLocaleString('en-IN')}
- Monthly SIP total: Rs ${totalSIP.toLocaleString('en-IN')}
- Target retirement corpus: Rs ${profile.targetCorpus.toLocaleString('en-IN')}
- Monthly expenses: Rs ${profile.monthlyExpense.toLocaleString('en-IN')}
- Expected return: ${profile.expectedReturn}%, Inflation: ${profile.inflation}%, SWR: ${profile.swr}%
- Risk appetite: High

CURRENT SIPs:
${sips.length > 0 ? sips.map(s => `- ${s.name} (${s.category}): Rs ${s.amount.toLocaleString('en-IN')}/mo at ${s.expectedReturn}%`).join('\n') : 'No SIPs added yet.'}

ASSETS:
${assets.length > 0 ? assets.map(a => `- ${a.name} (${a.category}): Rs ${a.value.toLocaleString('en-IN')}`).join('\n') : 'No assets tracked yet.'}

Give honest, direct advice. Point out risks. Use bullet points for lists.`;
}

export default function AIAdvisor({ profile, sips, assets }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === 'your_api_key_here') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'No API key configured.\n\nTo enable AI Advisor:\n1. Create .env.local in the project root\n2. Add: VITE_ANTHROPIC_API_KEY=your_key_here\n3. Get your key at console.anthropic.com\n4. Restart: npm run dev\n\nOn Vercel: add it under Project Settings > Environment Variables.'
        }]);
        setLoading(false);
        return;
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildContext(profile, sips, assets),
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content?.[0]?.text || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Check your API key.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <SectionHeader title="AI Financial Advisor" subtitle="Powered by Claude with full context of your portfolio." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, flex: 1, minHeight: 0 }}>
        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                <Sparkles size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 18, marginBottom: 6, color: 'var(--ink)' }}>Your personal finance advisor</div>
                <div style={{ fontSize: 13 }}>Ask anything about your SIPs, retirement plan, or portfolio.</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: msg.role === 'user' ? 'var(--ink)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {msg.role === 'user' ? <User size={14} color="white" /> : <Sparkles size={14} color="white" />}
                </div>
                <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: msg.role === 'user' ? 'var(--ink)' : 'var(--surface-2)', color: msg.role === 'user' ? 'var(--surface)' : 'var(--ink)', fontSize: 13.5, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} color="white" /></div>
                <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: 'pulse 1s ease infinite', animationDelay: `${d}s` }} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Ask about your finances..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5, fontFamily: 'var(--font-body)', background: 'var(--surface)' }} onFocus={e => e.target.style.borderColor = 'var(--ink)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 40, height: 40, borderRadius: 8, background: input.trim() ? 'var(--ink)' : 'var(--surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={15} color={input.trim() ? 'white' : 'var(--muted)'} />
            </button>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Try asking</div>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{ textAlign: 'left', padding: '10px 14px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5, transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.background = 'var(--surface-2)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'white'; }}>
              {s}
            </button>
          ))}
          <Card style={{ padding: 14, background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>My context</div>
            {[{ l: 'Age', v: profile.age }, { l: 'Monthly SIP', v: formatINR(sips.reduce((s, x) => s + x.amount, 0), true) }, { l: 'Net Worth', v: formatINR(assets.reduce((s, a) => s + a.value, 0), true) }, { l: 'Target', v: formatINR(profile.targetCorpus, true) }].map(({ l, v }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{l}</span>
                <span style={{ color: 'var(--ink)' }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}