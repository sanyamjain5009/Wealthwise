import React, { useState } from 'react';
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
  currentCorpus: 0,
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

  if (!setupDone) {
    return <ProfileSetup profile={profile} onSave={(p) => { setProfile(p); setSetupDone(true); }} />;
  }

  const navItems = {
    dashboard: <Dashboard profile={profile} sips={sips} netWorth={assets} onNav={setPage} />,
    sip: <SIPPlanner sips={sips} onSipsChange={setSips} />,
    retirement: <Retirement profile={profile} onProfileChange={setProfile} sips={sips} />,
    benchmark: <Benchmark sips={sips} />,
    networth: <NetWorth assets={assets} onAssetsChange={setAssets} />,
    advisor: <AIAdvisor profile={profile} sips={sips} assets={assets} />,
  };

  // Add net worth to sidebar by modifying nav
  const handleNav = (id) => {
    // Treat 'dashboard' clicks on net worth section as networth page
    setPage(id);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={page} onNav={handleNav} />
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
