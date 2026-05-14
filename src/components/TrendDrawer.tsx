'use client';
import React, { useEffect, useState } from 'react';
import { Trend } from './TrendCard';

interface VelocityPoint { date: string; count: number; }

function extractKeyword(name: string): string {
  const words = name.split(/\s+/).filter(w => w.length > 3);
  return words.slice(0, 2).join(' ') || name.split(/\s+/)[0] || name;
}

const URGENCY_COLORS: Record<string, string> = {
  URGENT: '#ef4444', MONITOR: '#f59e0b', WATCH: '#3b82f6',
};

/* ── Velocity Sparkline ── */
function Sparkline({ data, loading }: { data: VelocityPoint[]; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '0.78rem' }}>
        Loading signal data...
      </div>
    );
  }
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const hasData  = data.some(d => d.count > 0);

  if (!hasData) {
    return (
      <div style={{ height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, textAlign: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: '#475569' }}>No raw signal yet for this keyword</span>
        <span style={{ fontSize: '0.68rem', color: '#334155' }}>Will populate as daily data accumulates</span>
      </div>
    );
  }

  const first7avg = data.slice(0, 7).reduce((s, d) => s + d.count, 0) / 7;
  const last7avg  = data.slice(-7).reduce((s, d) => s + d.count, 0) / 7;
  const direction = last7avg > first7avg * 1.2 ? '↑ Accelerating'
                  : last7avg < first7avg * 0.8 ? '↓ Fading'
                  : '→ Stable';
  const dirColor  = last7avg > first7avg * 1.2 ? '#10b981'
                  : last7avg < first7avg * 0.8 ? '#ef4444'
                  : '#f59e0b';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 68, marginBottom: 6 }}>
        {data.map((d, i) => {
          const h = Math.max((d.count / maxCount) * 64, d.count > 0 ? 4 : 1);
          return (
            <div
              key={i}
              title={`${d.date}: ${d.count} signal${d.count !== 1 ? 's' : ''}`}
              style={{
                flex: 1, minWidth: 2, height: h, borderRadius: 2,
                background: d.count > 0
                  ? `rgba(124,58,237,${0.25 + (d.count / maxCount) * 0.75})`
                  : 'rgba(255,255,255,0.04)',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.62rem', color: '#334155' }}>
          {data[0]?.date?.slice(5)}
        </span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: dirColor }}>{direction}</span>
        <span style={{ fontSize: '0.62rem', color: '#334155' }}>
          {data[data.length - 1]?.date?.slice(5)}
        </span>
      </div>
    </div>
  );
}

/* ── Helpers ── */
const Divider = () => (
  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '1.25rem 0' }} />
);

const SectionLabel = ({ text, color = '#475569' }: { text: string; color?: string }) => (
  <div style={{
    fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.1em', color, marginBottom: 8,
  }}>{text}</div>
);

const AccentBlock = ({ color, label, text }: { color: string; label: string; text: string }) => (
  <div style={{
    background: `${color}0d`, border: `1px solid ${color}22`,
    borderLeft: `3px solid ${color}`,
    borderRadius: '0 8px 8px 0', padding: '0.875rem 1rem', marginBottom: '1.25rem',
  }}>
    <SectionLabel text={label} color={color} />
    <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>{text}</p>
  </div>
);

/* ── Main Drawer ── */
export default function TrendDrawer({
  trend, onClose, apiBase,
}: { trend: Trend | null; onClose: () => void; apiBase: string }) {
  const [velocity,        setVelocity]        = useState<VelocityPoint[]>([]);
  const [velocityLoading, setVelocityLoading] = useState(false);

  useEffect(() => {
    if (!trend?.trend_name) { setVelocity([]); return; }
    const kw = extractKeyword(trend.trend_name);
    if (!kw) return;
    setVelocityLoading(true);
    fetch(`${apiBase}/api/trends/velocity?keyword=${encodeURIComponent(kw)}&days=30`, {
      signal: AbortSignal.timeout(8000),
    })
      .then(r => r.json())
      .then(d => { setVelocity(d.data || []); setVelocityLoading(false); })
      .catch(() => setVelocityLoading(false));
  }, [trend?.trend_name, apiBase]);

  useEffect(() => {
    if (trend) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [trend]);

  if (!trend) return null;

  const name        = trend.trend_name || trend.trend || 'Beauty Trend';
  const platform    = trend.source_platform || trend.platform || 'Multiple Sources';
  const metric      = trend.metric || trend.popularity || 'Rising';
  const context     = trend.context || trend.what_is_happening || '';
  const result      = trend.result || trend.the_result || '';
  const contentIdea = trend.content_idea || '';
  const compIntel   = trend.competitor_intel || null;
  const hulProducts = trend.hul_products || [];
  const urgency     = trend.urgency;
  const urgColor    = urgency ? URGENCY_COLORS[urgency] : undefined;
  const appearances = trend.appearances ?? 0;
  const seenColor   = appearances >= 6 ? '#a855f7' : appearances >= 3 ? '#f59e0b' : '#10b981';

  const shareToWhatsApp = () => {
    let text = `🚀 *Trend Alert: ${name}*\n\n📍 *Source:* ${platform}\n📊 *Metric:* ${metric}\n\n💬 *Context:* ${context}\n\n✨ *Insight:* ${result}`;
    if (contentIdea) text += `\n\n💡 *Content Idea:* ${contentIdea}`;
    if (hulProducts.length > 0)
      text += `\n\n🏷️ *HUL Products:* ${hulProducts.map(p => `${p.brand} – ${p.product_name}`).join('; ')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 490,
        }}
      />

      {/* Panel */}
      <div className="trend-drawer">

        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          padding: '1rem 1.25rem',
          background: 'rgba(13,17,23,0.96)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          {/* Mobile drag handle (visual only) */}
          <div style={{
            display: 'none', // shown on mobile via @media in a real CSS module
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.15)',
            margin: '0 auto 12px',
          }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: 'rgba(124,58,237,0.12)', color: '#a855f7',
              border: '1px solid rgba(124,58,237,0.2)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>{trend.label || '[TREND]'}</span>
            {urgency && urgColor && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                color: urgColor, background: `${urgColor}18`, border: `1px solid ${urgColor}33`,
              }}>{urgency}</span>
            )}
            {trend.is_new && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              }}>✨ NEW</span>
            )}
            {trend.gap_opportunity && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
              }}>💡 Gap</span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#94a3b8', cursor: 'pointer',
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '1.5rem 1.25rem', flex: 1 }}>

          {/* Trend name */}
          <h2 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800,
            color: '#f1f5f9', lineHeight: 1.25, marginBottom: '1rem',
          }}>{name}</h2>

          {/* Meta strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: '1.25rem', fontSize: '0.78rem', color: '#94a3b8' }}>
            <span>📍 {platform}</span>
            <span>📊 {metric}</span>
            {trend.category && <span>📂 {trend.category}</span>}
            {(trend.days_tracking ?? 0) > 0 && <span>🕐 {trend.days_tracking}d tracking</span>}
            {appearances >= 2 && <span style={{ color: seenColor }}>↩ {appearances} digests</span>}
          </div>

          <Divider />

          {context && (
            <>
              <SectionLabel text="Context" />
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: 0 }}>{context}</p>
              <Divider />
            </>
          )}

          {result      && <AccentBlock color="#7c3aed" label="✨ HUL Insight"       text={result}      />}
          {contentIdea && <AccentBlock color="#10b981" label="💡 Content Idea"      text={contentIdea} />}
          {compIntel   && <AccentBlock color="#ef4444" label="⚔️ Competitor Watch"  text={compIntel}   />}

          {/* Velocity sparkline */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '0.875rem 1rem', marginBottom: '1.25rem',
          }}>
            <SectionLabel text="📈 Signal Velocity — last 30 days" />
            <Sparkline data={velocity} loading={velocityLoading} />
          </div>

          {/* HUL Products */}
          {hulProducts.length > 0 && (
            <>
              <SectionLabel text={`🏷️ HUL Products matched (${hulProducts.length})`} color="#a855f7" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem' }}>
                {hulProducts.map((p, i) => (
                  <div key={i} style={{
                    background: 'rgba(124,58,237,0.05)',
                    border: '1px solid rgba(124,58,237,0.12)',
                    borderRadius: 8, padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a855f7', marginBottom: 2 }}>{p.brand}</div>
                    <div style={{ fontSize: '0.85rem', color: '#f1f5f9', fontWeight: 500 }}>{p.product_name}</div>
                    {p.match_reason && (
                      <div style={{ fontSize: '0.67rem', color: '#475569', marginTop: 2, fontStyle: 'italic' }}>via: {p.match_reason}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Gap opportunity callout */}
          {hulProducts.length === 0 && trend.gap_opportunity && (
            <div style={{
              background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.25)',
              borderRadius: 10, padding: '1rem', textAlign: 'center', marginBottom: '1.25rem',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>💡</div>
              <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>White Space Opportunity</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No HUL product currently matches this trend — potential innovation territory.</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: '0.5rem' }}>
            {trend.url && (
              <a href={trend.url} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                <button className="btn-secondary" style={{ width: '100%' }}>🔗 Open Source</button>
              </a>
            )}
            <button className="btn-primary" style={{ flex: 1 }} onClick={shareToWhatsApp}>
              💬 WhatsApp
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
