'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './page.module.css';
import TrendCard from '../components/TrendCard';
import type { Trend } from '../components/TrendCard';
import BrandHealthPanel from '../components/BrandHealthPanel';
import HomeDashboard from '../components/HomeDashboard';
import Toast, { ToastItem } from '../components/Toast';
import TrendDrawer from '../components/TrendDrawer';
import { createClient } from '../utils/supabase/client';

/* ── Types ── */
interface RawTrends {
  google?: any[];
  reddit?: any[];
  rss?: any[];
  social?: any[];
  pinterest?: any[];
  amazon?: any[];
  twitter?: any[];
  instagram?: any[];
  nykaa?: any[];
  timestamp?: string;
}

type FilterKey =
  | 'Home' | 'AI Digest' | 'All'
  | 'Reddit' | 'Pinterest' | 'News' | 'Google'
  | 'Amazon' | 'Twitter' | 'Instagram' | 'Nykaa'
  | 'Competitor' | 'Brand Health';

const FILTERS: { key: FilterKey; icon: string; label: string }[] = [
  { key: 'Home',        icon: '🏠', label: 'Home' },
  { key: 'AI Digest',   icon: '✨', label: 'AI Digest' },
  { key: 'Brand Health',icon: '🏷️', label: 'Brand Health' },
  { key: 'All',         icon: '🌐', label: 'All Feeds' },
  { key: 'Google',      icon: '🔍', label: 'Google' },
  { key: 'Reddit',      icon: '👾', label: 'Reddit' },
  { key: 'Pinterest',   icon: '📌', label: 'Pinterest' },
  { key: 'News',        icon: '📰', label: 'News' },
  { key: 'Amazon',      icon: '🛒', label: 'Amazon' },
  { key: 'Nykaa',       icon: '💄', label: 'Nykaa' },
  { key: 'Twitter',     icon: '🐦', label: 'X / Twitter' },
  { key: 'Instagram',   icon: '📸', label: 'Instagram' },
  { key: 'Competitor',  icon: '⚔️', label: 'Competitors' },
];

const MOBILE_TABS: { filter: FilterKey; icon: string; label: string }[] = [
  { filter: 'Home',         icon: '🏠', label: 'Home' },
  { filter: 'AI Digest',    icon: '✨', label: 'Digest' },
  { filter: 'All',          icon: '🌐', label: 'Feeds' },
  { filter: 'Brand Health', icon: '🏷️', label: 'Brands' },
  { filter: 'Competitor',   icon: '⚔️', label: 'Intel' },
];

/* ── AI Digest grouping helpers ── */
const CATEGORY_ORDER = ['Skincare', 'Haircare', 'Makeup', 'Other'];
const CATEGORY_ICONS: Record<string, string> = {
  Skincare: '✨', Haircare: '💆', Makeup: '💄', Other: '🌐',
};
const URGENCY_RANK: Record<string, number> = { URGENT: 0, MONITOR: 1, WATCH: 2 };

function groupDigest(trends: any[]): { category: string; icon: string; trends: any[] }[] {
  const groups: Record<string, any[]> = {};
  for (const t of trends) {
    const cat = CATEGORY_ORDER.includes(t.category) ? t.category : 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(t);
  }
  return CATEGORY_ORDER
    .filter(c => groups[c]?.length)
    .map(c => ({
      category: c,
      icon: CATEGORY_ICONS[c],
      trends: [...groups[c]].sort(
        (a, b) => (URGENCY_RANK[a.urgency] ?? 3) - (URGENCY_RANK[b.urgency] ?? 3)
      ),
    }));
}

/* ── Raw → Card mappers ── */
function mapRawToCards(rawTrends: RawTrends, filter: FilterKey): any[] {
  let list: any[] = [];

  if (filter === 'All' || filter === 'Google') {
    list = [...list, ...(rawTrends.google || []).map((p: any) => {
      const name    = typeof p === 'string' ? p : (p.query || p.title || 'Unknown Trend');
      const traffic = typeof p === 'object' ? (p.traffic || p.interest || '') : '';
      const source  = typeof p === 'object' ? (p.source || 'Google Trends') : 'Google Trends';
      const isNews  = source.includes('News');
      return {
        trend_name: name, label: isNews ? '[GOOGLE NEWS]' : '[GOOGLE TRENDS]',
        category: 'Search', source_platform: source,
        metric: traffic ? `${traffic}` : 'Rising',
        context: isNews ? name : `Rising search interest in India: ${name}`,
        result: isNews ? 'Editorial coverage signal' : 'Google search breakout trend',
        url: `https://www.google.com/search?q=${encodeURIComponent(name)}`,
      };
    })];
  }
  if (filter === 'All' || filter === 'Reddit') {
    list = [...list, ...(rawTrends.reddit || []).map((p: any) => ({
      trend_name: p.title, label: '[REDDIT]', category: 'Discussion',
      source_platform: `Reddit (r/${p.subreddit})`, metric: `${p.score || 0} upvotes`,
      context: p.title, result: 'Trending consumer discussion', url: p.url,
    }))];
  }
  if (filter === 'All' || filter === 'Pinterest') {
    list = [...list, ...(rawTrends.pinterest || []).map((p: any) => ({
      trend_name: typeof p === 'string' ? p : p.title, label: '[PINTEREST]',
      category: 'Visual', source_platform: 'Pinterest Trends', metric: 'Visual Spike',
      context: `Trending visual inspiration: ${typeof p === 'string' ? p : p.title}`,
      result: 'Growing aesthetic interest', url: typeof p === 'string' ? '' : p.url,
    }))];
  }
  if (filter === 'All' || filter === 'News') {
    list = [...list, ...(rawTrends.rss || []).map((a: any) => ({
      trend_name: a.title, label: '[NEWS]', category: 'Article',
      source_platform: 'Google News', metric: 'Recent Coverage',
      context: a.summary || a.title, result: 'Editorial coverage signal', url: a.link,
    }))];
  }
  if (filter === 'All' || filter === 'Amazon') {
    list = [...list, ...(rawTrends.amazon || []).map((p: any) => ({
      trend_name: p.product_name, label: '[AMAZON]', category: p.category || 'Beauty',
      source_platform: `Amazon India (${p.category || 'Beauty'})`, metric: `#${p.rank} Bestseller`,
      context: `Ranked #${p.rank} on Amazon India bestsellers${p.rating ? ` · ${p.rating}` : ''}`,
      result: 'High commercial velocity on Amazon', url: null,
    }))];
  }
  if (filter === 'All' || filter === 'Twitter') {
    list = [...list, ...(rawTrends.twitter || []).map((t: any) => {
      const text = typeof t === 'string' ? t : (t.text || t.caption || String(t));
      return {
        trend_name: text.slice(0, 60), label: '[TWITTER]', category: 'Social',
        source_platform: 'X / Twitter', metric: 'Trending India',
        context: text, result: 'Twitter/X trend signal', url: null,
      };
    })];
  }
  if (filter === 'All' || filter === 'Instagram') {
    list = [...list, ...(rawTrends.instagram || []).map((p: any) => ({
      trend_name: p.hashtag || 'Instagram Trend', label: '[INSTAGRAM]', category: 'Visual',
      source_platform: 'Instagram', metric: `${p.likes || 0} likes`,
      context: p.caption || p.hashtag, result: 'Instagram engagement signal', url: p.url,
    }))];
  }
  if (filter === 'All' || filter === 'Nykaa') {
    list = [...list, ...(rawTrends.nykaa || []).map((p: any) => ({
      trend_name: p.product_name || p.title || 'Nykaa Product', label: '[NYKAA]',
      category: p.category || 'Beauty', source_platform: `Nykaa India (${p.category || 'Beauty'})`,
      metric: p.rank ? `#${p.rank} on Nykaa` : 'Bestseller',
      context: `Trending on Nykaa India: ${p.product_name || p.title}`,
      result: "High demand on Nykaa — India's top beauty platform", url: null,
    }))];
  }
  return list;
}

/* ── Search filter helper ── */
function applySearch(trends: any[], query: string): any[] {
  if (!query.trim()) return trends;
  const q = query.toLowerCase();
  return trends.filter(t => {
    const haystack = [
      t.trend_name, t.context, t.result, t.content_idea,
      t.competitor_intel,
      ...(t.hul_products || []).map((p: any) => `${p.brand} ${p.product_name}`),
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

/* ── Supabase helpers ── */
async function fetchRawFromSupabase(): Promise<RawTrends | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('raw_trends')
      .select('platform, data, collected_at')
      .order('collected_at', { ascending: false })
      .limit(50);
    if (error || !data?.length) return null;
    const result: RawTrends = {};
    const seen = new Set<string>();
    for (const row of data) {
      if (!seen.has(row.platform)) {
        seen.add(row.platform);
        (result as any)[row.platform] = row.data;
        if (!result.timestamp) result.timestamp = row.collected_at;
      }
    }
    return result;
  } catch { return null; }
}

/** Aggregate competitor_signals directly from Supabase — used as fallback when backend is offline. */
async function fetchCompetitorSignalsFromSupabase(days = 7): Promise<any[] | null> {
  try {
    const supabase = createClient();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('competitor_signals')
      .select('competitor, platform, mention_text, source_url, collected_at')
      .gte('collected_at', cutoff)
      .order('collected_at', { ascending: false })
      .limit(100);
    if (error) return null;
    return data || [];
  } catch { return null; }
}

async function fetchCompetitorDigestFromSupabase(days = 7): Promise<any | null> {
  try {
    const supabase = createClient();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('competitor_signals')
      .select('competitor, platform')
      .gte('collected_at', cutoff);
    if (error || !data?.length) return null;

    const competitors: Record<string, { count: number; platforms: string[] }> = {};
    const own_brands:  Record<string, { count: number; platforms: string[] }> = {};

    for (const row of data) {
      const comp     = (row.competitor || '') as string;
      const platform = (row.platform   || '') as string;
      if (comp.startsWith('HUL:')) {
        const brand = comp.slice(4);
        if (!own_brands[brand]) own_brands[brand] = { count: 0, platforms: [] };
        own_brands[brand].count++;
        if (!own_brands[brand].platforms.includes(platform)) own_brands[brand].platforms.push(platform);
      } else if (comp) {
        if (!competitors[comp]) competitors[comp] = { count: 0, platforms: [] };
        competitors[comp].count++;
        if (!competitors[comp].platforms.includes(platform)) competitors[comp].platforms.push(platform);
      }
    }
    return { days, competitors, own_brands };
  } catch { return null; }
}

async function fetchAIFromSupabase(): Promise<any | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ai_digest')
      .select('trends, generated_at')
      .order('generated_at', { ascending: false })
      .limit(1);
    if (error || !data?.length) return null;
    return { trends: data[0].trends, timestamp: data[0].generated_at };
  } catch { return null; }
}

/* ════════════════════════════════════════
   PAGE COMPONENT
════════════════════════════════════════ */
const SYNC_COOLDOWN_MS = 3 * 60 * 1000;

/* ── Sidebar Component ── */
const SidebarContent = ({
  status, searchQuery, handleSearch, setSearchQuery, setSearchResults,
  searching, searchResults, activeFilter, changeFilter,
  lastUpdated, formatLastUpdated, generateAI, generatingAI,
  triggerSync, syncing, syncOnCooldown, aiSummary, shareConsolidated,
}: any) => (
  <div className={styles.sidebarInner}>
    <div className={styles.brand}>
      <h1 className={styles.brandTitle}>Trend Radar</h1>
      <span className={`${styles.statusPill} ${status === 'Online' ? styles.statusOnline : styles.statusOffline}`}>
        <span className={styles.statusDot} />
        {status === 'Online' ? 'Online' : 'Backend Sleeping'}
      </span>
    </div>

    <div className={styles.searchWrapper}>
      <span className={styles.searchIcon}>🔎</span>
      <input
        className={styles.searchInput} type="text"
        placeholder="Search 6 months of trends..."
        value={searchQuery} onChange={e => handleSearch(e.target.value)}
      />
      {searchQuery && (
        <button className={styles.searchClear}
          onClick={() => { setSearchQuery(''); setSearchResults(null); }}>✕</button>
      )}
    </div>
    {searching && <p className={styles.searchStatus}>Searching...</p>}
    {searchResults !== null && !searching && (
      <p className={styles.searchStatus}>{searchResults.length} historical results</p>
    )}

    <p className={styles.navLabel}>Categories</p>
    <nav className={styles.nav}>
      {FILTERS.map(({ key, icon, label }) => (
        <button
          key={key}
          className={`${styles.navItem} ${key === 'AI Digest' ? styles.navItemAI : ''} ${activeFilter === key && !searchResults ? styles.active : ''}`}
          onClick={() => changeFilter(key)}
        >
          <span className={styles.navIcon}>{icon}</span>
          {label}
        </button>
      ))}
    </nav>

    <div className={styles.sidebarActions}>
      {lastUpdated && <div className={styles.lastUpdatedChip}>🕒 {formatLastUpdated(lastUpdated)}</div>}
      <button className="btn-primary" onClick={generateAI} disabled={generatingAI}>
        {generatingAI ? '⏳ Analyzing...' : '🪄 AI Digest'}
      </button>
      <button className="btn-secondary" onClick={triggerSync}
        disabled={syncing || syncOnCooldown}
        title={syncOnCooldown ? 'Sync locked for 3 mins' : ''}
        style={{ marginTop: '8px' }}>
        {syncing ? '⏳ Syncing...' : syncOnCooldown ? '🔒 Synced Recently' : '🔄 Sync Data'}
      </button>
      {aiSummary?.trends && activeFilter === 'AI Digest' && !searchResults && (
        <button className="btn-secondary" onClick={shareConsolidated}
          style={{ marginTop: '8px', borderColor: 'rgba(124,58,237,0.4)' }}>
          📢 Share Report
        </button>
      )}
    </div>
  </div>
);

export default function Home() {
  const [activeFilter, setActiveFilter]           = useState<FilterKey>('Home');
  const [rawTrends, setRawTrends]                 = useState<RawTrends | null>(null);
  const [aiSummary, setAiSummary]                 = useState<any>(null);
  const [competitorSignals, setCompetitorSignals] = useState<any[]>([]);
  const [competitorDigest, setCompetitorDigest]   = useState<any>(null);
  const [trendHistories, setTrendHistories]       = useState<Record<string, number>>({});
  const [status, setStatus]                       = useState<'Online' | 'OFFLINE'>('OFFLINE');
  const [lastUpdated, setLastUpdated]             = useState<string | null>(null);
  const [syncing, setSyncing]                     = useState(false);
  const [syncMessage, setSyncMessage]             = useState<string | null>(null);
  const [syncCooldownUntil, setSyncCooldownUntil] = useState<number>(0);
  const [generatingAI, setGeneratingAI]           = useState(false);
  const [drawerOpen, setDrawerOpen]               = useState(false);
  const [selectedTrend, setSelectedTrend]         = useState<Trend | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [toasts, setToasts]                       = useState<ToastItem[]>([]);
  const [searchQuery, setSearchQuery]             = useState('');
  const [searchResults, setSearchResults]         = useState<any[] | null>(null);
  const [searching, setSearching]                 = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncOnCooldown = Date.now() < syncCooldownUntil;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  /* ── Toast helpers ── */
  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* ── Load data ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [sbRaw, sbAI, sbSignals] = await Promise.all([
      fetchRawFromSupabase(),
      fetchAIFromSupabase(),
      fetchCompetitorSignalsFromSupabase(7)
    ]);
    if (sbRaw) { setRawTrends(sbRaw); setLastUpdated(sbRaw.timestamp || null); }
    if (sbAI)  setAiSummary(sbAI);
    if (sbSignals) setCompetitorSignals(sbSignals);

    // Also load competitor digest from Supabase immediately (doesn't depend on backend being awake)
    // This ensures the Competitors Tracked tile is always populated.
    const sbDigest = await fetchCompetitorDigestFromSupabase(7);
    if (sbDigest) setCompetitorDigest(sbDigest);

    try {
      const [compRes, digestRes, statusRes] = await Promise.all([
        fetch(`${API_BASE}/api/competitor-signals`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${API_BASE}/api/competitor-digest?days=7`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${API_BASE}/api/status`, { signal: AbortSignal.timeout(5000) }),
      ]);
      const compData   = await compRes.json();
      const digestData = await digestRes.json();
      const statusData = await statusRes.json();
      
      // Backend data is the source of truth if available
      if (compData.signals) setCompetitorSignals(compData.signals);
      if (digestData?.competitors) setCompetitorDigest(digestData);
      setStatus(statusData.status);
    } catch {
      setStatus('OFFLINE');
      // Fallbacks already set above
    }
    finally { setLoading(false); }
  }, [API_BASE]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Batch fetch seen-before history for AI digest trends ── */
  useEffect(() => {
    if (!aiSummary?.trends?.length) return;
    const trends = aiSummary.trends;
    Promise.all(
      trends.map(async (t: any) => {
        const kw = (t.trend_name || '').split(' ').slice(0, 3).join(' ');
        if (!kw || kw.length < 3) return [t.trend_name, 0];
        try {
          const res = await fetch(`${API_BASE}/api/trends/history?keyword=${encodeURIComponent(kw)}&days=30`,
            { signal: AbortSignal.timeout(5000) });
          const data = await res.json();
          return [t.trend_name, data.appearances ?? 0];
        } catch { return [t.trend_name, 0]; }
      })
    ).then(results => {
      const map: Record<string, number> = {};
      results.forEach(([name, count]: any) => { map[name] = count; });
      setTrendHistories(map);
    });
  }, [aiSummary, API_BASE]);

  /* ── Historical search ── */
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!q.trim()) { setSearchResults(null); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const cards = (data.results || []).map((r: any) => {
          const item = r.item; const platform = r.platform;
          return {
            trend_name: item?.title || item?.query || item?.product_name || item?.hashtag || 'Result',
            label: `[${platform.toUpperCase()}]`, category: item?.category || platform,
            source_platform: platform,
            metric: item?.score ? `${item.score} upvotes` : (item?.rank ? `#${item.rank} Bestseller` : 'Historical'),
            context: item?.title || item?.caption || item?.summary || '',
            result: `Historical match from ${new Date(r.collected_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}`,
            url: item?.url || item?.link || null,
          };
        });
        setSearchResults(cards);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 500);
  }, [API_BASE]);

  /* ── Sync ── */
  const triggerSync = async () => {
    setSyncing(true);
    setSyncCooldownUntil(Date.now() + SYNC_COOLDOWN_MS);

    // Immediate feedback toast
    addToast('🔄 Sync started — collecting fresh data across all sources...', 'info');

    const steps = [
      { msg: '⏳ Waking up backend server...', delay: 0 },
      { msg: '🔍 Collecting Google Trends...', delay: 5000 },
      { msg: '👾 Scraping Reddit discussions...', delay: 12000 },
      { msg: '📰 Fetching RSS & News feeds...', delay: 20000 },
      { msg: '📌 Scanning Pinterest...', delay: 28000 },
      { msg: '🛒 Fetching Amazon bestsellers...', delay: 36000 },
      { msg: '🐦 Scanning Twitter/X trends...', delay: 44000 },
      { msg: '💾 Saving to database...', delay: 52000 },
    ];
    const stepTimers = steps.map(({ msg, delay }) =>
      setTimeout(() => setSyncMessage(msg), delay)
    );

    const finish = (success: boolean) => {
      stepTimers.forEach(clearTimeout);
      setSyncing(false);
      setSyncMessage(null);
      if (success) {
        addToast('✅ Sync complete! Fresh data has been loaded.', 'success');
      } else {
        addToast('❌ Sync failed — check your connection and try again.', 'error');
      }
    };

    try {
      const res = await fetch(`${API_BASE}/api/sync`, {
        method: 'POST',
        signal: AbortSignal.timeout(120_000), // 2 min max wait
      });

      if (!res.ok) { finish(false); return; }

      // Poll Supabase until new data appears (max ~90 s)
      let attempts = 0;
      let newDataFound = false;
      const poll = setInterval(async () => {
        attempts++;
        const sbRaw = await fetchRawFromSupabase();
        if (sbRaw) {
          setRawTrends(sbRaw);
          setLastUpdated(sbRaw.timestamp || null);
          newDataFound = true;
        }
        if (attempts >= 9 || newDataFound) {
          clearInterval(poll);
          finish(true);
        }
      }, 10_000);
    } catch {
      finish(false);
    }
  };

  /* ── AI Generate ── */
  const generateAI = async () => {
    setGeneratingAI(true);
    try {
      const res  = await fetch(`${API_BASE}/api/trends/ai/generate`, { method: 'POST' });
      const data = await res.json();
      setAiSummary(data);
      setActiveFilter('AI Digest');
      addToast('✨ AI Digest generated! Showing latest intelligence.', 'success');
    } catch {
      addToast('❌ AI Digest failed — backend may be sleeping. Try again.', 'error');
    }
    finally { setGeneratingAI(false); }
  };

  /* ── Share ── */
  const shareConsolidated = () => {
    if (!aiSummary?.trends) return;
    let msg = '💎 *BEAUTY INTELLIGENCE BRIEF* 💎\n\n';
    aiSummary.trends.slice(0, 5).forEach((t: any) => {
      msg += `*${t.label}* — *"${t.trend_name}"*\n📍 ${t.category}\n💬 ${t.context}\n`;
      if (t.content_idea) msg += `💡 ${t.content_idea}\n`;
      msg += '\n';
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const changeFilter = (f: FilterKey) => {
    setActiveFilter(f);
    setDrawerOpen(false);
    if (searchResults !== null) { setSearchResults(null); setSearchQuery(''); }
    if (f === 'Brand Health') {
      setTimeout(() => addToast('📊 Share-of-Voice chart needs 2–3 weeks of data to populate', 'info'), 800);
    }
  };

  const formatLastUpdated = (ts: string | null) => {
    if (!ts) return 'No data yet';
    const d = new Date(ts);
    return `Last synced: ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST`;
  };

  /* ── Derived display list ── */
  const isFullPanel = (activeFilter === 'Home' || activeFilter === 'Brand Health') && !searchResults;

  const baseList = (() => {
    if (searchResults !== null) return searchResults;
    if (activeFilter === 'Home' || activeFilter === 'Brand Health') return [];
    if (activeFilter === 'AI Digest') {
      return (aiSummary?.trends || []).map((t: any) => ({
        ...t,
        appearances: trendHistories[t.trend_name] ?? undefined,
      }));
    }
    if (activeFilter === 'Competitor') {
      return competitorSignals
        .filter((c: any) => !c.competitor?.startsWith('HUL:'))
        .map((c: any) => ({
          trend_name: c.competitor, label: '[COMPETITOR]', category: 'Intelligence',
          source_platform: c.platform, metric: 'Mention',
          context: c.mention_text, result: 'Competitor activity detected', url: c.source_url,
        }));
    }
    return mapRawToCards(rawTrends || {}, activeFilter);
  })();

  const displayTrends = applySearch(baseList, searchResults !== null ? '' : searchQuery);

  const contentTitle = (() => {
    if (searchResults !== null) return `Search: "${searchQuery}"`;
    if (activeFilter === 'Home') return 'Dashboard';
    if (activeFilter === 'AI Digest') return 'Intelligence Digest';
    if (activeFilter === 'Brand Health') return 'Brand Health';
    return `${activeFilter} Feed`;
  })();

  /* ── Whether flat grid should render (not AI Digest grouped, not full panel) ── */
  const showFlatGrid = !loading && !isFullPanel && !(activeFilter === 'AI Digest' && !searchResults);
  const showDigestGrouped = !loading && activeFilter === 'AI Digest' && !searchResults;

  return (
    <>
      <div className={`overlay ${drawerOpen ? 'visible' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={styles.app}>
        <aside className={`${styles.sidebar} ${drawerOpen ? styles.open : ''} glass`}>
          <SidebarContent
            status={status} searchQuery={searchQuery} handleSearch={handleSearch}
            setSearchQuery={setSearchQuery} setSearchResults={setSearchResults}
            searching={searching} searchResults={searchResults}
            activeFilter={activeFilter} changeFilter={changeFilter}
            lastUpdated={lastUpdated} formatLastUpdated={formatLastUpdated}
            generateAI={generateAI} generatingAI={generatingAI}
            triggerSync={triggerSync} syncing={syncing} syncOnCooldown={syncOnCooldown}
            aiSummary={aiSummary} shareConsolidated={shareConsolidated}
          />
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header className={styles.mobileTopBar}>
            <button className={styles.hamburger} onClick={() => setDrawerOpen(true)}>
              <span /><span /><span />
            </button>
            <span className={styles.mobileTopBarTitle}>Trend Radar</span>
            <span className={`${styles.statusPill} ${status === 'Online' ? styles.statusOnline : styles.statusOffline}`} style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
              <span className={styles.statusDot} />
              {status === 'Online' ? 'Live' : 'Offline'}
            </span>
          </header>

          <main className={styles.content}>
            {syncMessage && (
              <div className={styles.syncBanner}>
                <span className={styles.syncBannerDot} />
                <span>{syncMessage}</span>
                {syncing && <span className={styles.syncEta}>This usually takes 2–3 minutes</span>}
              </div>
            )}

            <div className={styles.contentHeader}>
              <h2 className={styles.contentTitle}>{contentTitle}</h2>
              <p className={styles.contentSubtitle}>
                {!isFullPanel && !loading && displayTrends.length > 0
                  ? `${displayTrends.length} signals · ${formatLastUpdated(lastUpdated)}`
                  : formatLastUpdated(lastUpdated)}
              </p>
            </div>

            {/* Skeleton loaders while initial data loads */}
            {loading && !isFullPanel && (
              <div className={styles.grid}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            )}

            {/* Full-panel views */}
            {!loading && activeFilter === 'Home' && !searchResults && (
              <HomeDashboard
                aiSummary={aiSummary}
                competitorDigest={competitorDigest}
                lastUpdated={lastUpdated}
                onNavigate={changeFilter}
                onGenerate={generateAI}
                generatingAI={generatingAI}
                onSync={triggerSync}
                syncing={syncing}
                syncOnCooldown={syncOnCooldown}
              />
            )}

            {!loading && activeFilter === 'Brand Health' && !searchResults && (
              <BrandHealthPanel apiBase={API_BASE} />
            )}

            {/* AI Digest — grouped by category, URGENT sorted within each group */}
            {showDigestGrouped && (
              <>
                {displayTrends.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>✨</div>
                    <h3>No digest yet</h3>
                    <p>Click "AI Digest" to generate your first intelligence report.</p>
                  </div>
                ) : (
                  groupDigest(displayTrends).map(group => (
                    <div key={group.category} className={styles.digestSection}>
                      <div className={styles.categoryHeader}>
                        <span className={styles.categoryHeaderIcon}>{group.icon}</span>
                        <span className={styles.categoryHeaderTitle}>{group.category}</span>
                        <span className={styles.categoryHeaderCount}>
                          {group.trends.length} trend{group.trends.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className={styles.grid}>
                        {group.trends.map((trend: any, idx: number) => (
                          <TrendCard
                            key={idx}
                            trend={trend}
                            onOpen={() => setSelectedTrend(trend as Trend)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Flat card grid — raw feeds, competitor intel, search results */}
            {showFlatGrid && (
              <div className={styles.grid}>
                {displayTrends.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>💎</div>
                    <h3>{searchResults !== null ? 'No results found' : 'No data yet'}</h3>
                    <p>{searchResults !== null ? 'Try a different search term.' : 'Click Sync Data to begin collection.'}</p>
                  </div>
                ) : (
                  displayTrends.map((trend: any, idx: number) => (
                    <TrendCard
                      key={idx}
                      trend={trend}
                      onOpen={() => setSelectedTrend(trend as Trend)}
                    />
                  ))
                )}
              </div>
            )}
          </main>
        </div>

        {/* Mobile bottom tab bar */}
        <nav className={styles.mobileTabBar}>
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.filter}
              className={`${styles.mobileTab} ${activeFilter === tab.filter && !searchResults ? styles.mobileTabActive : ''}`}
              onClick={() => changeFilter(tab.filter)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Trend detail drawer */}
      <TrendDrawer
        trend={selectedTrend}
        onClose={() => setSelectedTrend(null)}
        apiBase={API_BASE}
      />

      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
