'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import TrendCard from '../components/TrendCard';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('AI Digest');
  const [rawTrends, setRawTrends] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [status, setStatus] = useState('OFFLINE');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchData = async () => {
    try {
      const [rawRes, aiRes, statusRes] = await Promise.all([
        fetch(`${API_BASE}/api/trends/raw`),
        fetch(`${API_BASE}/api/trends/ai`),
        fetch(`${API_BASE}/api/status`)
      ]);

      setRawTrends(await rawRes.json());
      setAiSummary(await aiRes.json());
      const s = await statusRes.json();
      setStatus(s.status);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/api/sync`, { method: 'POST' });
      setTimeout(fetchData, 5000); // Wait for bg task
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const generateAI = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch(`${API_BASE}/api/trends/ai/generate`, { method: 'POST' });
      setAiSummary(await res.json());
      setActiveFilter('AI Digest');
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const getDisplayTrends = () => {
    if (activeFilter === 'AI Digest') {
      return aiSummary?.trends || [];
    }

    if (!rawTrends) return [];

    let list: any[] = [];
    
    // Uniform Mapping
    if (activeFilter === 'All' || activeFilter === 'Reddit') {
      list = [...list, ...(rawTrends.reddit || []).map((p: any) => ({
        trend_name: p.title,
        label: '[REDDIT]',
        category: 'Discussion',
        source_platform: `Reddit (r/${p.subreddit})`,
        metric: `${p.score} upvotes`,
        context: p.title,
        result: 'Trending consumer discussion',
        url: p.url
      }))];
    }

    if (activeFilter === 'All' || activeFilter === 'Pinterest') {
      list = [...list, ...(rawTrends.pinterest || []).map((p: any) => ({
        trend_name: typeof p === 'string' ? p : p.title,
        label: '[PINTEREST]',
        category: 'Visual',
        source_platform: 'Pinterest Trends',
        metric: 'Visual Spike',
        context: `Trending visual inspiration for ${typeof p === 'string' ? p : p.title}`,
        result: 'Growing aesthetic interest',
        url: typeof p === 'string' ? '' : p.url
      }))];
    }

    if (activeFilter === 'All' || activeFilter === 'News') {
      list = [...list, ...(rawTrends.rss || []).map((a: any) => ({
        trend_name: a.title,
        label: '[NEWS]',
        category: 'Article',
        source_platform: a.source?.includes('google') ? 'Google News' : 'RSS Feed',
        metric: 'Recent Coverage',
        context: a.summary || a.title,
        result: 'New editorial coverage',
        url: a.link
      }))];
    }

    return list;
  };

  const shareConsolidated = () => {
    if (!aiSummary?.trends) return;
    
    let msg = "💎 *CONSOLIDATED BEAUTY INTELLIGENCE* 💎\n\n";
    aiSummary.trends.slice(0, 5).forEach((t: any) => {
      msg += `*${t.label}* - *"${t.trend_name}"*\n`;
      msg += `📍 Category: ${t.category}\n`;
      msg += `💬 ${t.context}\n\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filters = ['AI Digest', 'All', 'Reddit', 'Pinterest', 'News'];

  return (
    <main className={styles.main}>
      <aside className={`${styles.sidebar} glass`}>
        <div className={styles.logo}>
          <h1>Trend Radar</h1>
          <span className={styles.status}>
            <span className={styles.dot}></span> {status}
          </span>
        </div>

        <nav className={styles.nav}>
          {filters.map(filter => (
            <button
              key={filter}
              className={`${styles.navItem} ${activeFilter === filter ? styles.active : ''} ${filter === 'AI Digest' ? styles.aiTab : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'AI Digest' ? '✨ AI Digest' : filter}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginBottom: '12px' }}
            onClick={generateAI}
            disabled={generatingAI}
          >
            {generatingAI ? '✨ Analyzing...' : '🪄 Generate AI Digest'}
          </button>
          <button 
            className="btn-secondary" 
            style={{ width: '100%' }}
            onClick={triggerSync}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : '🔄 Sync Raw Data'}
          </button>
          {aiSummary && (
            <button 
              className="btn-secondary" 
              style={{ width: '100%', marginTop: '12px', border: '1px solid #7c3aed' }}
              onClick={shareConsolidated}
            >
              📢 Share AI Report
            </button>
          )}
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.header}>
          <h2>{activeFilter === 'AI Digest' ? 'Consolidated AI Intelligence' : `${activeFilter} Insights`}</h2>
          <p>Showing {getDisplayTrends().length} trends found recently.</p>
        </header>

        <div className={styles.grid}>
          {getDisplayTrends().map((trend: any, idx: number) => (
            <TrendCard key={idx} trend={trend} />
          ))}
        </div>
      </section>
    </main>
  );
}
