'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import TrendCard from '../components/TrendCard';

/* ── Types ── */
interface RawTrends {
  google?: any[];
  reddit?: any[];
  rss?: any[];
  social?: any[];
  pinterest?: any[];
}

type FilterKey = 'AI Digest' | 'All' | 'Reddit' | 'Pinterest' | 'News';

const FILTERS: { key: FilterKey; icon: string; label: string }[] = [
  { key: 'AI Digest', icon: '✨', label: 'AI Digest' },
  { key: 'All',       icon: '🌐', label: 'All' },
  { key: 'Reddit',    icon: '👾', label: 'Reddit' },
  { key: 'Pinterest', icon: '📌', label: 'Pinterest' },
  { key: 'News',      icon: '📰', label: 'News' },
];

/* ── Mappers ── */
function mapRawToCards(rawTrends: RawTrends, filter: FilterKey) {
  let list: any[] = [];

  if (filter === 'All' || filter === 'Reddit') {
    list = [...list, ...(rawTrends.reddit || []).map((p: any) => ({
      trend_name: p.title,
      label: '[REDDIT]',
      category: 'Discussion',
      source_platform: `Reddit (r/${p.subreddit})`,
      metric: `${p.score} upvotes`,
      context: p.selftext || p.title,
      result: 'Trending consumer discussion',
      url: p.url,
    }))];
  }

  if (filter === 'All' || filter === 'Pinterest') {
    list = [...list, ...(rawTrends.pinterest || []).map((p: any) => ({
      trend_name: typeof p === 'string' ? p : p.title,
      label: '[PINTEREST]',
      category: 'Visual',
      source_platform: 'Pinterest Trends',
      metric: 'Visual Spike',
      context: `Trending visual inspiration for: ${typeof p === 'string' ? p : p.title}`,
      result: 'Growing aesthetic interest on Pinterest',
      url: typeof p === 'string' ? '' : p.url,
    }))];
  }

  if (filter === 'All' || filter === 'News') {
    list = [...list, ...(rawTrends.rss || []).map((a: any) => ({
      trend_name: a.title,
      label: '[NEWS]',
      category: 'Article',
      source_platform: a.source?.includes('google') ? 'Google News' : 'RSS Feed',
      metric: 'Recent Coverage',
      context: a.summary || a.title,
      result: 'New editorial coverage in beauty space',
      url: a.link,
    }))];
  }

  return list;
}

/* ════════════════════════════════════════
   PAGE COMPONENT
════════════════════════════════════════ */
export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('AI Digest');
  const [rawTrends, setRawTrends]       = useState<RawTrends | null>(null);
  const [aiSummary, setAiSummary]       = useState<any>(null);
  const [status, setStatus]             = useState<'Online' | 'OFFLINE'>('OFFLINE');
  const [syncing, setSyncing]           = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    try {
      const [rawRes, aiRes, statusRes] = await Promise.all([
        fetch(`${API_BASE}/api/trends/raw`),
        fetch(`${API_BASE}/api/trends/ai`),
        fetch(`${API_BASE}/api/status`),
      ]);
      setRawTrends(await rawRes.json());
      setAiSummary(await aiRes.json());
      const s = await statusRes.json();
      setStatus(s.status);
    } catch (err) {
      console.error('Fetch error:', err);
      setStatus('OFFLINE');
    }
  }, [API_BASE]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Actions ── */
  const triggerSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/api/sync`, { method: 'POST' });
      setTimeout(fetchData, 5000);
    } catch (err) { console.error(err); }
    finally { setSyncing(false); }
  };

  const generateAI = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch(`${API_BASE}/api/trends/ai/generate`, { method: 'POST' });
      setAiSummary(await res.json());
      setActiveFilter('AI Digest');
    } catch (err) { console.error(err); }
    finally { setGeneratingAI(false); }
  };

  const shareConsolidated = () => {
    if (!aiSummary?.trends) return;
    let msg = '💎 *BEAUTY INTELLIGENCE BRIEF* 💎\n\n';
    aiSummary.trends.slice(0, 5).forEach((t: any) => {
      msg += `*${t.label}* — *"${t.trend_name}"*\n`;
      msg += `📍 ${t.category}\n`;
      msg += `💬 ${t.context}\n\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  /* ── Display data ── */
  const displayTrends = activeFilter === 'AI Digest'
    ? (aiSummary?.trends || [])
    : mapRawToCards(rawTrends || {}, activeFilter);

  const changeFilter = (f: FilterKey) => {
    setActiveFilter(f);
    setDrawerOpen(false);
  };

  /* ── Sidebar content (shared by desktop sidebar + mobile drawer) ── */
  const SidebarContent = () => (
    <div className={styles.sidebarInner}>
      <div className={styles.brand}>
        <h1 className={styles.brandTitle}>Trend Radar</h1>
        <span className={`${styles.statusPill} ${status === 'Online' ? styles.statusOnline : styles.statusOffline}`}>
          <span className={styles.statusDot} />
          {status}
        </span>
      </div>

      <p className={styles.navLabel}>Views</p>
      <nav className={styles.nav}>
        {FILTERS.map(({ key, icon, label }) => (
          <button
            key={key}
            className={`${styles.navItem} ${key === 'AI Digest' ? styles.navItemAI : ''} ${activeFilter === key ? styles.active : ''}`}
            onClick={() => changeFilter(key)}
          >
            <span className={styles.navIcon}>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      <div className={styles.sidebarActions}>
        <button className="btn-primary" onClick={generateAI} disabled={generatingAI}>
          {generatingAI ? '⏳ Analyzing...' : '🪄 Generate AI Digest'}
        </button>
        <button className="btn-secondary" onClick={triggerSync} disabled={syncing}>
          {syncing ? '⏳ Syncing...' : '🔄 Sync Raw Data'}
        </button>
        {aiSummary?.trends && activeFilter === 'AI Digest' && (
          <button className="btn-secondary" onClick={shareConsolidated} style={{ borderColor: 'rgba(124,58,237,0.4)' }}>
            📢 Share AI Report
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile Drawer Overlay ── */}
      <div
        className={`overlay ${drawerOpen ? 'visible' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      <div className={styles.app}>

        {/* ── Desktop Sidebar ── */}
        <aside className={`${styles.sidebar} ${drawerOpen ? styles.open : ''} glass`}>
          <SidebarContent />
        </aside>

        {/* ── Right side wrapper ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Mobile Top Bar ── */}
          <header className={`${styles.mobileTopBar} glass`}>
            <button className={styles.hamburger} onClick={() => setDrawerOpen(o => !o)} aria-label="Open menu">
              <span /><span /><span />
            </button>
            <span className={styles.mobileTopBarTitle}>✨ Trend Radar</span>
            <span className={`${styles.statusPill} ${status === 'Online' ? styles.statusOnline : styles.statusOffline}`}>
              <span className={styles.statusDot} />
              {status}
            </span>
          </header>

          {/* ── Mobile Tab Strip ── */}
          <div className={styles.mobileTabStrip}>
            {FILTERS.map(({ key, icon, label }) => (
              <button
                key={key}
                className={`${styles.mobileTab} ${activeFilter === key ? styles.active : ''}`}
                onClick={() => changeFilter(key)}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* ── Main Content ── */}
          <main className={styles.content}>
            <div className={styles.contentHeader}>
              <h2 className={styles.contentTitle}>
                {activeFilter === 'AI Digest' ? 'AI Intelligence Brief' : `${activeFilter} Insights`}
              </h2>
              <p className={styles.contentSubtitle}>
                {displayTrends.length} trend{displayTrends.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className={styles.grid}>
              {displayTrends.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    {activeFilter === 'AI Digest' ? '✨' : '🔍'}
                  </div>
                  <h3>{activeFilter === 'AI Digest' ? 'No AI Digest yet' : 'No data yet'}</h3>
                  <p>
                    {activeFilter === 'AI Digest'
                      ? 'Click "Generate AI Digest" to create your intelligence brief.'
                      : 'Click "Sync Raw Data" to fetch the latest trends.'}
                  </p>
                </div>
              ) : (
                displayTrends.map((trend: any, idx: number) => (
                  <TrendCard key={idx} trend={trend} />
                ))
              )}
            </div>
          </main>
        </div>

        {/* ── Mobile Bottom Action Bar ── */}
        <div className={`${styles.mobileBottomBar} glass`}>
          <button className="btn-primary" onClick={generateAI} disabled={generatingAI}>
            {generatingAI ? '⏳' : '🪄'} AI Digest
          </button>
          <button className="btn-secondary" onClick={triggerSync} disabled={syncing}>
            {syncing ? '⏳' : '🔄'} Sync
          </button>
          {aiSummary?.trends && (
            <button className="btn-secondary" onClick={shareConsolidated} style={{ borderColor: 'rgba(124,58,237,0.4)' }}>
              📢 Share
            </button>
          )}
        </div>

      </div>
    </>
  );
}
