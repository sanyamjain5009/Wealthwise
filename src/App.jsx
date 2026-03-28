import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SIPPlanner from './pages/SIPPlanner.jsx';
import Retirement from './pages/Retirement.jsx';
import Benchmark from './pages/Benchmark.jsx';
import AIAdvisor from './pages/AIAdvisor.jsx';
import NetWorth from './pages/NetWorth.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';

const DEFAULT_PROFILE = {
  name: '',
  age: 28,
  retirementAge: 40,
  monthlyExpense: 100000,
  targetCorpus: 50000000,
  expectedReturn: 14,
  postRetirementReturn: 8,
  inflation: 6,
  swr: 3.5,
};

const SAMPLE_SIPS = [];
const SAMPLE_ASSETS = [];

export default function App() {
  const [profile, setProfile] = useLocalStorage('ww_profile', DEFAULT_PROFILE);
  const [sips, setSips] = useLocalStorage('ww_sips', SAMPLE_SIPS);
  const [assets, setAssets] = useLocalStorage('ww_assets', SAMPLE_ASSETS);
  const [page, setPage] = useState('dashboard');
  const [setupDone, setSetupDone] = useLocalStorage('ww_setup', false);

  // Net worth total is the single source of truth for current corpus
  const netWorthTotal = useMemo(
    () => assets.reduce((sum, a) => sum + a.value, 0),
    [assets]
  );

  // Merge netWorthTotal into profile so all pages stay in sync
  const profileWithCorpus = useMemo(
    () => ({ ...profile, currentCorpus: netWorthTotal }),
    [profile, netWorthTotal]
  );

  if (!setupDone) {
    return <ProfileSetup profile={profile} onSave={(p) => { setProfile(p); setSetupDone(true); }} />;
  }

  const navItems = {
    dashboard: <Dashboard profile={profileWithCorpus} sips={sips} netWorth={assets} onNav={setPage} />,
    sip: <SIPPlanner sips={sips} onSipsChange={setSips} />,
    retirement: <Retirement profile={profileWithCorpus} onProfileChange={setProfile} sips={sips} netWorthTotal={netWorthTotal} />,
    benchmark: <Benchmark sips={sips} />,
    networth: <NetWorth assets={assets} onAssetsChange={setAssets} />,
    advisor: <AIAdvisor profile={profileWithCorpus} sips={sips} assets={assets} />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={page} onNav={setPage} />
      <main style={{
        flex: 1,
        marginLeft: 220,
        padding: '36px 40px',
        minHeight: '100vh',
        maxWidth: '100%',
      }}>
        {navItems[page] || navItems['dashboard']}
      </main>
    </div>
  );
}