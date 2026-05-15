'use client';
import React, { useState, useEffect } from 'react';

interface BrandEntry {
  count: number;
  platforms: string[];
  recent_mentions: { text: string; platform: string; url?: string; collected_at?: string }[];
}

interface DigestData {
  days: number;
  competitors: Record<string, BrandEntry>;
  own_brands: Record<string, BrandEntry>;
}

/* ── Marketplace types ── */
interface MarketplaceProduct { name: string; rank: number | null; source: string; }
interface MarketplaceBrand {
  brand: string;
  type: 'hul' | 'competitor' | 'other';
  is_hul: boolean;
  product_count: number;
  best_rank: number | null;
  platforms: string[];
  products: MarketplaceProduct[];
}
interface MarketplaceData {
  categories: Record<string, MarketplaceBrand[]>;
  hul_gap_categories: string[];
  data_date: string | null;
}

/* ── Marketplace sub-components ── */
const MARKET_CAT_ORDER = ['Skincare', 'Haircare', 'Makeup', 'Beauty'];

function MarketplaceBrandRow({ entry }: { entry: MarketplaceBrand }) {
  const [open, setOpen] = useState(false);
  const typeColor = entry.is_hul ? '#10b981' : entry.type === 'competitor' ? '#ef4444' : '#94a3b8';
  const typeBg    = entry.is_hul ? 'rgba(16,185,129,0.1)' : entry.type === 'competitor' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)';
  const typeLabel = entry.is_hul ? 'HUL' : entry.type === 'competitor' ? 'Competitor' : 'Other';
  const platforms = entry.platforms ?? [];
  const products  = entry.products ?? [];

  return (
    <div style={{ background: typeBg, border: `1px solid ${typeColor}22`, borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setOpen(v => !v)}>
        {/* Brand type badge */}
        <span style={{
          fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20,
          color: typeColor, background: `${typeColor}18`, border: `1px solid ${typeColor}33`,
          flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{typeLabel}</span>

        {/* Brand name */}
        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.85rem', color: '#f1f5f9', minWidth: 0 }}>
          {entry.brand}
        </span>

        {/* Product count pill */}
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
        }}>
          {entry.product_count ?? 0} {entry.product_count === 1 ? 'product' : 'products'}
        </span>

        {/* Best rank badge (Amazon only) */}
        {entry.best_rank != null && (
          <span style={{
            fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)',
          }}>#{entry.best_rank}</span>
        )}

        {/* Platform pills */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {platforms.includes('Amazon') && <span title="Amazon" style={{ fontSize: '0.75rem' }}>🛒</span>}
          {platforms.includes('Nykaa')  && <span title="Nykaa"  style={{ fontSize: '0.75rem' }}>💄</span>}
        </div>
        <span style={{ color: '#475569', fontSize: '0.6rem' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && products.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {products.map((p, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6, padding: '6px 10px',
              fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                {p.source === 'Amazon' ? '🛒' : '💄'}
              </span>
              <span style={{ flex: 1 }}>{p.name}</span>
              {p.rank != null && (
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                  #{p.rank}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarketplaceSection({ apiBase }: { apiBase: string }) {
  const [data, setData]       = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/api/marketplace/summary`, { signal: AbortSignal.timeout(8000) })
      .then(r => r.json())
      .then((d: any) => {
        // Only accept if the payload has the expected shape
        const cats = d?.categories;
        if (cats && typeof cats === 'object' && !Array.isArray(cats)) {
          setData(d as MarketplaceData);
          const first = MARKET_CAT_ORDER.find(c => (cats[c] as any[])?.length) ?? Object.keys(cats)[0] ?? '';
          setActiveTab(first);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiBase]);

  const cats       = data?.categories ?? {};
  const categories = Object.keys(cats);
  const orderedCats = [...MARKET_CAT_ORDER.filter(c => categories.includes(c)), ...categories.filter(c => !MARKET_CAT_ORDER.includes(c))];
  const activeBrands: MarketplaceBrand[] = cats[activeTab] ?? [];
  const hulBrands   = activeBrands.filter(b => b.is_hul);
  const otherBrands = activeBrands.filter(b => !b.is_hul);

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', marginBottom: 3 }}>
            📦 Marketplace Intelligence
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Amazon & Nykaa bestseller presence by brand
          </div>
        </div>
        {data?.data_date && (
          <span style={{ fontSize: '0.65rem', color: '#334155' }}>
            🕒 {new Date(data.data_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.82rem' }}>
          Loading marketplace data...
        </div>
      ) : orderedCats.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '2rem', textAlign: 'center',
          fontSize: '0.82rem', color: '#475569',
        }}>
          No marketplace data yet — run a Sync to collect Amazon & Nykaa bestseller data.
        </div>
      ) : (
        <>
          {/* HUL gap warning */}
          {(data?.hul_gap_categories ?? []).length > 0 && (
            <div style={{
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8, padding: '10px 14px', marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem',
            }}>
              <span>⚠️</span>
              <span style={{ color: '#f59e0b' }}>
                <strong>HUL absent from bestsellers in:</strong>{' '}
                <span style={{ color: '#94a3b8' }}>{(data?.hul_gap_categories ?? []).join(', ')}</span>
              </span>
            </div>
          )}

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
            {orderedCats.map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: activeTab === cat ? 'rgba(124,58,237,0.15)' : 'transparent',
                borderColor: activeTab === cat ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)',
                color: activeTab === cat ? '#a855f7' : '#94a3b8',
                transition: 'all 0.15s',
              }}>{cat}</button>
            ))}
          </div>

          {/* Leaderboard */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
            {/* HUL brands first */}
            {hulBrands.length > 0 && (
              <div style={{ marginBottom: otherBrands.length ? '1rem' : 0 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981', marginBottom: 8 }}>
                  🏷️ HUL Brands
                </div>
                {hulBrands.map((b, i) => <MarketplaceBrandRow key={i} entry={b} />)}
              </div>
            )}

            {hulBrands.length === 0 && (
              <div style={{ padding: '0.75rem 0', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.78rem', color: '#475569', textAlign: 'center' }}>
                No HUL products in {activeTab || 'this category'} bestsellers
              </div>
            )}

            {/* Competitors + others */}
            {otherBrands.length > 0 && (
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ef4444', marginBottom: 8 }}>
                  ⚔️ Others on Shelf
                </div>
                {otherBrands.slice(0, 10).map((b, i) => <MarketplaceBrandRow key={i} entry={b} />)}
                {otherBrands.length > 10 && (
                  <div style={{ fontSize: '0.72rem', color: '#334155', textAlign: 'center', paddingTop: 8 }}>
                    +{otherBrands.length - 10} more brands
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Share-of-Voice Chart ──────────────────────────────────────────────────────

const SOV_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#a855f7', '#06b6d4', '#f43f5e'];
const HUL_COLOR  = '#10b981';

interface SovSegment { name: string; count: number; color: string; pct: number; path: string; }

function _polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function _donutArc(cx: number, cy: number, oR: number, iR: number, s: number, e: number): string {
  const os = _polar(cx, cy, oR, s), oe = _polar(cx, cy, oR, e);
  const ie = _polar(cx, cy, iR, e), is_ = _polar(cx, cy, iR, s);
  const lg = e - s > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return [
    `M ${f(os.x)} ${f(os.y)}`,
    `A ${oR} ${oR} 0 ${lg} 1 ${f(oe.x)} ${f(oe.y)}`,
    `L ${f(ie.x)} ${f(ie.y)}`,
    `A ${iR} ${iR} 0 ${lg} 0 ${f(is_.x)} ${f(is_.y)}`,
    'Z',
  ].join(' ');
}

function ShareOfVoiceChart({
  competitors, ownBrands, days,
}: {
  competitors: Record<string, BrandEntry>;
  ownBrands: Record<string, BrandEntry>;
  days: number;
}) {
  const totalOwn  = Object.values(ownBrands).reduce((s, e) => s + (e?.count ?? 0), 0);
  const totalComp = Object.values(competitors).reduce((s, e) => s + (e?.count ?? 0), 0);
  const grand     = totalOwn + totalComp;

  if (grand === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0', color: '#475569', fontSize: '0.82rem' }}>
        No mention data yet for this period — run a Sync to collect signals.
      </div>
    );
  }

  // Build raw segments
  const compEntries = Object.entries(competitors).sort((a, b) => b[1].count - a[1].count);
  const top5        = compEntries.slice(0, 5);
  const othersCount = compEntries.slice(5).reduce((s, [, e]) => s + (e.count ?? 0), 0);

  type RawSeg = { name: string; count: number; color: string };
  const rawSegs: RawSeg[] = [];
  if (totalOwn > 0)   rawSegs.push({ name: 'HUL', count: totalOwn, color: HUL_COLOR });
  top5.forEach(([name, e], i) => rawSegs.push({ name, count: e.count, color: SOV_COLORS[i % SOV_COLORS.length] }));
  if (othersCount > 0) rawSegs.push({ name: 'Others', count: othersCount, color: '#475569' });

  // Build arc paths (1.5° gap between segments)
  const GAP = 1.5;
  const cx = 90, cy = 90, oR = 72, iR = 46;
  let cursor = 0;
  const segs: SovSegment[] = rawSegs
    .filter(s => s.count > 0)
    .map(s => {
      const pct       = s.count / grand;
      const totalDeg  = pct * 360;
      const span      = Math.max(totalDeg - GAP, 0.2);
      const start     = cursor;
      cursor         += totalDeg;
      return { ...s, pct, path: _donutArc(cx, cy, oR, iR, start, start + span) };
    });

  return (
    <div>
      {/* Caveat banner */}
      <div style={{
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.18)',
        borderRadius: 8, padding: '8px 14px', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.73rem',
      }}>
        <span>⚠️</span>
        <span style={{ color: '#94a3b8', lineHeight: 1.5 }}>
          Based on <strong style={{ color: '#f59e0b' }}>{days} day{days !== 1 ? 's' : ''}</strong> of
          data · <strong style={{ color: '#f1f5f9' }}>{grand}</strong> organic mentions
          (Reddit, Google, Instagram, Twitter, News) ·
          For best accuracy, 2–3 weeks of collection is recommended
        </span>
      </div>

      {/* Chart + Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* SVG Donut */}
        <div style={{ flexShrink: 0 }}>
          <svg width={180} height={180} viewBox="0 0 180 180">
            {segs.map((seg, i) => (
              <path key={i} d={seg.path} fill={seg.color} opacity={0.9}>
                <title>{seg.name}: {seg.count} mentions ({(seg.pct * 100).toFixed(1)}%)</title>
              </path>
            ))}
            {/* Centre label */}
            <text x={cx} y={cy - 5} textAnchor="middle" fill="#f1f5f9"
                  fontSize="18" fontWeight="800" fontFamily="Outfit,sans-serif">{grand}</text>
            <text x={cx} y={cy + 11} textAnchor="middle" fill="#475569"
                  fontSize="8.5" fontWeight="700" letterSpacing="0.09em">MENTIONS</text>
          </svg>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: 150 }}>
          {segs.map((seg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: seg.color }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: seg.name === 'HUL' ? 700 : 600,
                    color: seg.name === 'HUL' ? '#10b981' : '#e2e8f0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{seg.name}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: seg.color, flexShrink: 0 }}>
                    {(seg.pct * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 4 }}>
                  <div style={{ width: `${seg.pct * 100}%`, height: '100%', background: seg.color, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          ))}

          {/* HUL vs Competitors summary line */}
          <div style={{
            marginTop: 6, paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.7rem', color: '#94a3b8',
          }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>HUL {((totalOwn / grand) * 100).toFixed(0)}%</span>
            {' vs '}
            <span style={{ color: '#ef4444', fontWeight: 700 }}>Competitors {((totalComp / grand) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, string> = {
  Reddit: '👾', Amazon: '🛒', Instagram: '📸', Twitter: '🐦',
  News: '📰', Nykaa: '💄', Social: '🌐',
};

function platformIcon(p: string) {
  for (const [k, v] of Object.entries(PLATFORM_ICONS)) {
    if (p.includes(k)) return v;
  }
  return '📡';
}

function BrandRow({ name, entry, accent }: { name: string; entry: BrandEntry; accent: string }) {
  const [open, setOpen] = useState(false);
  const maxCount = 30;
  const barPct = Math.min((entry.count / maxCount) * 100, 100);
  const platforms       = entry.platforms ?? [];
  const recentMentions  = entry.recent_mentions ?? [];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
           onClick={() => setOpen(v => !v)}>
        <div style={{
          minWidth: 36, height: 36, borderRadius: 8,
          background: `${accent}18`, border: `1px solid ${accent}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', fontWeight: 800, color: accent,
          flexShrink: 0,
        }}>
          {entry.count}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f1f5f9', marginBottom: 4 }}>{name}</div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <div style={{ width: `${barPct}%`, height: '100%', background: accent, borderRadius: 2, transition: 'width 0.6s ease' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {platforms.slice(0, 3).map(p => (
            <span key={p} title={p} style={{
              fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
              padding: '2px 6px',
            }}>{platformIcon(p)}</span>
          ))}
        </div>
        <span style={{ color: '#475569', fontSize: '0.65rem', marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && recentMentions.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {recentMentions.map((m, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6, padding: '8px 10px',
              fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5,
            }}>
              <span style={{ color: '#475569', marginRight: 6 }}>{platformIcon(m.platform)}</span>
              {m.text}
              {m.url && (
                <a href={m.url} target="_blank" rel="noreferrer"
                   style={{ display: 'inline-block', marginLeft: 6, color: '#a855f7', fontSize: '0.7rem' }}>↗</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({
  title, accent, data, emptyLabel,
}: { title: string; accent: string; data: Record<string, BrandEntry>; emptyLabel: string }) {
  const sorted = Object.entries(data ?? {}).sort((a, b) => b[1].count - a[1].count);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${accent}22`,
      borderRadius: 14,
      padding: '1.25rem',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: accent, marginBottom: '1rem',
      }}>{title}</div>
      {sorted.length === 0 ? (
        <p style={{ color: '#475569', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>{emptyLabel}</p>
      ) : (
        sorted.map(([name, entry]) => (
          <BrandRow key={name} name={name} entry={entry} accent={accent} />
        ))
      )}
    </div>
  );
}

export default function BrandHealthPanel({ apiBase }: { apiBase: string }) {
  const [days, setDays] = useState(7);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/api/competitor-digest?days=${days}`, { signal: AbortSignal.timeout(8000) })
      .then(r => r.json())
      .then(d => {
        // Only accept the payload if it has the expected shape
        if (d && typeof d.competitors === 'object' && typeof d.own_brands === 'object') {
          setDigest(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [days, apiBase]);

  const competitors = digest?.competitors ?? {};
  const ownBrands   = digest?.own_brands  ?? {};
  const totalComp   = Object.values(competitors).reduce((s, e) => s + (e?.count ?? 0), 0);
  const totalOwn    = Object.values(ownBrands).reduce((s, e) => s + (e?.count ?? 0), 0);

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', marginBottom: 4 }}>Brand Health</div>
          {digest && (
            <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: '#94a3b8' }}>
              <span><span style={{ color: '#ef4444', fontWeight: 700 }}>{Object.keys(competitors).length}</span> competitors tracked</span>
              <span><span style={{ color: '#10b981', fontWeight: 700 }}>{Object.keys(ownBrands).length}</span> HUL brands mentioned</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              padding: '5px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              background: days === d ? 'rgba(124,58,237,0.15)' : 'transparent',
              borderColor: days === d ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)',
              color: days === d ? '#a855f7' : '#94a3b8',
              transition: 'all 0.15s',
            }}>{d}d</button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      {digest && (
        <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', fontFamily: 'Outfit,sans-serif' }}>{totalComp}</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Competitor Mentions</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'Outfit,sans-serif' }}>{totalOwn}</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>HUL Brand Mentions</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#475569', fontSize: '0.88rem' }}>Loading brand data...</div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Section
            title="⚔️ Competitor Watch"
            accent="#ef4444"
            data={competitors}
            emptyLabel="No competitor mentions in this period"
          />
          <Section
            title="🏷️ HUL Brand Voice"
            accent="#10b981"
            data={ownBrands}
            emptyLabel="No HUL brand mentions in this period"
          />
        </div>
      )}

      {/* Marketplace Intelligence */}
      <MarketplaceSection apiBase={apiBase} />

      {/* Share-of-Voice Chart */}
      {digest && (
        <div style={{
          marginTop: '2rem',
          background: 'rgba(255,255,255,0.015)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '1.5rem',
        }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#475569', marginBottom: '1.25rem',
          }}>📊 Share-of-Voice</div>
          <ShareOfVoiceChart
            competitors={competitors}
            ownBrands={ownBrands}
            days={days}
          />
        </div>
      )}
    </div>
  );
}
