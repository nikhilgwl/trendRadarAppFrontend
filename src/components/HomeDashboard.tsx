'use client';
import React from 'react';

interface DigestData {
  days?: number;
  competitors?: Record<string, { count: number; platforms: string[] }>;
  own_brands?: Record<string, { count: number }>;
}

interface HomeDashboardProps {
  aiSummary: any;
  competitorDigest: DigestData | null;
  lastUpdated: string | null;
  onNavigate: (filter: any) => void;
  onGenerate: () => void;
  generatingAI: boolean;
  onSync: () => void;
  syncing: boolean;
  syncOnCooldown: boolean;
}

const urgencyColors: Record<string, string> = {
  URGENT: '#ef4444',
  MONITOR: '#f59e0b',
  WATCH: '#3b82f6',
};

function KpiTile({ value, label, color, onClick }: { value: number | string; label: string; color: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: `${color}0d`,
      border: `1px solid ${color}22`,
      borderRadius: 12,
      padding: '1rem 1.25rem',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s',
      flex: 1,
      minWidth: 0,
    }}
    onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)')}
    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'translateY(0)')}>
      <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit,sans-serif', color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>{label}</div>
    </div>
  );
}

function MiniTrendCard({ trend, onClick }: { trend: any; onClick: () => void }) {
  const urgencyColor = trend.urgency ? urgencyColors[trend.urgency] : undefined;
  return (
    <div onClick={onClick} style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${urgencyColor ? urgencyColor + '33' : 'rgba(255,255,255,0.07)'}`,
      borderLeft: urgencyColor ? `3px solid ${urgencyColor}` : '3px solid rgba(124,58,237,0.4)',
      borderRadius: 10,
      padding: '1rem',
      cursor: 'pointer',
      transition: 'background 0.15s',
      flex: 1,
      minWidth: 220,
    }}
    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20,
          background: 'rgba(124,58,237,0.12)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.2)',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>{trend.category || 'Trend'}</span>
        {trend.urgency && urgencyColor && (
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: urgencyColor }}>{trend.urgency}</span>
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9', marginBottom: 6, lineHeight: 1.3 }}>
        {trend.trend_name}
      </div>
      <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {trend.context}
      </p>
      {trend.is_new && (
        <span style={{ display: 'inline-block', marginTop: 8, fontSize: '0.6rem', fontWeight: 700,
          padding: '2px 6px', borderRadius: 20, color: '#10b981',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>✨ NEW</span>
      )}
    </div>
  );
}

export default function HomeDashboard({
  aiSummary, competitorDigest, lastUpdated,
  onNavigate, onGenerate, generatingAI, onSync, syncing, syncOnCooldown,
}: HomeDashboardProps) {
  const trends = aiSummary?.trends || [];
  const urgentCount     = trends.filter((t: any) => t.urgency === 'URGENT').length;
  const newCount        = trends.filter((t: any) => t.is_new).length;
  const gapCount        = trends.filter((t: any) => t.gap_opportunity).length;
  const competitorCount = competitorDigest ? Object.keys(competitorDigest.competitors || {}).length : 0;

  const topCompetitors = competitorDigest
    ? Object.entries(competitorDigest.competitors || {})
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
    : [];
  const maxCount = topCompetitors[0]?.[1]?.count || 1;

  const hasData = trends.length > 0 || topCompetitors.length > 0;

  if (!hasData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', color: '#475569' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: 8, color: '#94a3b8' }}>No data yet</h3>
        <p style={{ fontSize: '0.88rem', marginBottom: '1.5rem', maxWidth: 300 }}>Sync data first, then generate an AI digest to see your intelligence dashboard.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={onSync} disabled={syncing || syncOnCooldown}>
            {syncing ? '⏳ Syncing...' : syncOnCooldown ? '🔒 Synced' : '🔄 Sync Data'}
          </button>
          <button className="btn-primary" onClick={onGenerate} disabled={generatingAI}>
            {generatingAI ? '⏳ Analyzing...' : '🪄 AI Digest'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* KPI row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <KpiTile value={urgentCount} label="Urgent Trends" color="#ef4444" onClick={() => onNavigate('AI Digest')} />
        <KpiTile value={newCount}    label="New This Run"  color="#10b981" onClick={() => onNavigate('AI Digest')} />
        <KpiTile value={gapCount}    label="Gap Opportunities" color="#f59e0b" onClick={() => onNavigate('AI Digest')} />
        <KpiTile value={competitorCount} label="Competitors Tracked" color="#a855f7" onClick={() => onNavigate('Brand Health')} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '2rem' }}>
        <button className="btn-primary" onClick={onGenerate} disabled={generatingAI} style={{ flex: 1 }}>
          {generatingAI ? '⏳ Analyzing...' : '🪄 Regenerate AI Digest'}
        </button>
        <button className="btn-secondary" onClick={onSync} disabled={syncing || syncOnCooldown} style={{ flex: 1 }}>
          {syncing ? '⏳ Syncing...' : syncOnCooldown ? '🔒 Synced Recently' : '🔄 Sync Data'}
        </button>
      </div>

      {/* Today's Intelligence */}
      {trends.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' }}>
              Today's Intelligence
            </div>
            <button onClick={() => onNavigate('AI Digest')} style={{
              background: 'transparent', border: 'none', color: '#a855f7',
              fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
            }}>View all {trends.length} →</button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {trends.slice(0, 3).map((t: any, i: number) => (
              <MiniTrendCard key={i} trend={t} onClick={() => onNavigate('AI Digest')} />
            ))}
          </div>
        </div>
      )}

      {/* Competitor Pulse */}
      {topCompetitors.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' }}>
              ⚔️ Competitor Pulse (7d)
            </div>
            <button onClick={() => onNavigate('Brand Health')} style={{
              background: 'transparent', border: 'none', color: '#a855f7',
              fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
            }}>Full report →</button>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 12, padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {topCompetitors.map(([name, entry]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 100, fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9', flexShrink: 0 }}>{name}</div>
                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(entry.count / maxCount) * 100}%`, height: '100%', background: '#ef4444', borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ width: 28, textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, color: '#ef4444', flexShrink: 0 }}>{entry.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastUpdated && (
        <p style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: '#475569', textAlign: 'center' }}>
          Last synced: {new Date(lastUpdated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}
