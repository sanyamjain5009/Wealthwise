import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SIPPlanner from './pages/SIPPlanner.jsx';
import Retirement from './pages/Retirement.jsx';
import Benchmark from './pages/Benchmark.jsx';
import AIAdvisor from './pages/AIAdvisor.jsx';
import NetWorth from './pages/NetWorth.jsx';
import Import from './pages/Import.jsx';
import Spouse from './pages/Spouse.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';

const DEFAULT_PROFILE = {
  name: '', age: 28, retirementAge: 40, monthlyExpense: 100000,
  targetCorpus: 50000000, expectedReturn: 14, postRetirementReturn: 8,
  inflation: 6, swr: 3.5,
};

const DEFAULT_SPOUSE = { name: '', age: 27, monthlyIncome: 0, monthlyExpense: 0 };

export default function App() {
  const [profile, setProfile] = useLocalStorage('ww_profile', DEFAULT_PROFILE);
  const [sips, setSips] = useLocalStorage('ww_sips', []);
  const [assets, setAssets] = useLocalStorage('ww_assets', []);
  const [spouse, setSpouse] = useLocalStorage('ww_spouse', DEFAULT_SPOUSE);
  const [spouseSips, setSpouseSips] = useLocalStorage('ww_spouse_sips', []);
  const [spouseAssets, setSpouseAssets] = useLocalStorage('ww_spouse_assets', []);
  const [page, setPage] = useState('dashboard');
  const [setupDone, setSetupDone] = useLocalStorage('ww_setup', false);

  // Combined net worth: your assets + spouse assets
  const netWorthTotal = useMemo(() => assets.reduce((s, a) => s + a.value, 0), [assets]);
  const spouseNetWorth = useMemo(() => spouseAssets.reduce((s, a) => s + a.value, 0), [spouseAssets]);
  const combinedNetWorth = netWorthTotal + spouseNetWorth;

  // Combined SIP
  const spouseSIPTotal = useMemo(() => spouseSips.reduce((s, x) => s + x.amount, 0), [spouseSips]);

  const profileWithCorpus = useMemo(() => ({
    ...profile,
    currentCorpus: combinedNetWorth,
  }), [profile, combinedNetWorth]);

  const handleImportMF = (newSips, newAssets) => {
    const manualSips = sips.filter(s => !s.importedFromZerodha);
    const manualAssets = assets.filter(a => !a.importedFromZerodha);
    setSips([...manualSips, ...newSips]);
    setAssets([...manualAssets, ...newAssets]);
    setTimeout(() => setPage('networth'), 800);
  };

  const handleImportStocks = () => {};

  if (!setupDone) {
    return <ProfileSetup profile={profile} onSave={(p) => { setProfile(p); setSetupDone(true); }} />;
  }

  const pages = {
    dashboard: <Dashboard profile={profileWithCorpus} sips={[...sips, ...spouseSips]} netWorth={[...assets, ...spouseAssets]} onNav={setPage} />,
    sip: <SIPPlanner sips={sips} onSipsChange={setSips} />,
    retirement: (
      <Retirement
        profile={profileWithCorpus}
        onProfileChange={setProfile}
        sips={sips}
        spouseSips={spouseSips}
        netWorthTotal={combinedNetWorth}
        spouse={spouse}
      />
    ),
    benchmark: <Benchmark sips={[...sips, ...spouseSips]} />,
    networth: <NetWorth assets={assets} onAssetsChange={setAssets} />,
    spouse: <Spouse spouse={spouse} onSpouseChange={setSpouse} spouseSips={spouseSips} onSpouseSipsChange={setSpouseSips} spouseAssets={spouseAssets} onSpouseAssetsChange={setSpouseAssets} />,
    import: <Import onImportMF={handleImportMF} onImportStocks={handleImportStocks} />,
    advisor: <AIAdvisor profile={profileWithCorpus} sips={[...sips, ...spouseSips]} assets={[...assets, ...spouseAssets]} />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Sidebar active={page} onNav={setPage} spouse={spouse} />
      <main style={{ flex: 1, marginLeft: 220, padding: '32px 36px', minHeight: '100vh', maxWidth: '100%' }}>
        {pages[page] || pages['dashboard']}
      </main>
    </div>
  );
}