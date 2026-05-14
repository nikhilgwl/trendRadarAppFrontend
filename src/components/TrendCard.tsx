'use client';
import React from 'react';
import styles from './TrendCard.module.css';

export interface HulProduct {
  brand: string;
  product_name: string;
  match_reason?: string;
}

export interface Trend {
  trend_name?: string;
  trend?: string;
  label?: string;
  source_platform?: string;
  platform?: string;
  metric?: string;
  popularity?: string;
  metric_summary?: string;
  context?: string;
  what_is_happening?: string;
  result?: string;
  the_result?: string;
  url?: string;
  category?: string;
  content_idea?: string;
  competitor_intel?: string | null;
  hul_products?: HulProduct[];
  urgency?: 'URGENT' | 'MONITOR' | 'WATCH';
  is_new?: boolean;
  gap_opportunity?: boolean;
  days_tracking?: number;
  appearances?: number;
}

const platformIcons: Record<string, string> = {
  reddit: '👾', pinterest: '📌', google: '🔍',
  news: '📰', rss: '📰', amazon: '🛒',
  twitter: '🐦', instagram: '📸', nykaa: '💄',
  default: '💎',
};

const urgencyConfig: Record<string, { label: string; color: string; bg: string }> = {
  URGENT:  { label: '🔴 URGENT',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  MONITOR: { label: '🟡 MONITOR', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  WATCH:   { label: '🔵 WATCH',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
};

function getPlatformIcon(platform: string): string {
  const p = platform.toLowerCase();
  for (const key of Object.keys(platformIcons)) {
    if (p.includes(key)) return platformIcons[key];
  }
  return platformIcons.default;
}

interface TrendCardProps {
  trend: Trend;
  onOpen?: () => void;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend, onOpen }) => {
  const name         = trend.trend_name || trend.trend || 'Beauty Trend';
  const platform     = trend.source_platform || trend.platform || 'Multiple Sources';
  const label        = trend.label || '[TREND]';
  const category     = trend.category || '';
  const metric       = trend.metric || trend.popularity || trend.metric_summary || 'Rising';
  const context      = trend.context || trend.what_is_happening || '';
  const result       = trend.result || trend.the_result || '';
  const contentIdea  = trend.content_idea || '';
  const compIntel    = trend.competitor_intel || null;
  const hulProducts  = trend.hul_products || [];
  const urgency      = trend.urgency || null;
  const isNew        = trend.is_new || false;
  const gapOpp       = trend.gap_opportunity || false;
  const daysTracking = trend.days_tracking ?? null;
  const appearances  = trend.appearances ?? 0;
  const seenColor    = appearances >= 6 ? '#a855f7' : appearances >= 3 ? '#f59e0b' : '#10b981';

  const shareToWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `🚀 *Trend Alert: ${name}*\n\n📍 *Source:* ${platform}\n📊 *Metric:* ${metric}\n\n💬 *Context:* ${context}\n\n✨ *Insight:* ${result}`;
    if (contentIdea) text += `\n\n💡 *Content Idea:* ${contentIdea}`;
    if (hulProducts.length > 0)
      text += `\n\n🏷️ *HUL Products:* ${hulProducts.map(p => `${p.brand} – ${p.product_name}`).join('; ')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div
      className={`premium-card ${styles.card} ${onOpen ? styles.clickable : ''}`}
      onClick={onOpen}
      style={{ cursor: onOpen ? 'pointer' : 'default' }}
    >
      {/* URGENT pulsing dot */}
      {urgency === 'URGENT' && <span className={styles.urgentDot} />}

      {/* Top row */}
      <div className={styles.cardTop}>
        <div className={styles.badges}>
          <span className="badge badge-rising">{label}</span>
          {category && <span className="badge badge-ai">{category}</span>}
          {compIntel && <span className={`badge ${styles.badgeCompetitor}`}>⚔️ Competitor</span>}
          {urgency && urgencyConfig[urgency] && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
              letterSpacing: '0.04em', color: urgencyConfig[urgency].color,
              background: urgencyConfig[urgency].bg, border: `1px solid ${urgencyConfig[urgency].color}33`,
            }}>{urgencyConfig[urgency].label}</span>
          )}
          {isNew && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
              color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            }}>✨ NEW</span>
          )}
          {gapOpp && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
              color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            }}>💡 Gap</span>
          )}
        </div>
        <span className={styles.platformIcon}>{getPlatformIcon(platform)}</span>
      </div>

      {/* Title */}
      <h3 className={styles.title}>{name}</h3>

      {/* Meta */}
      <div className={styles.meta}>
        <span className={styles.metaItem}>📍 {platform}</span>
        <span className={styles.metaItem}>📊 {metric}</span>
        {daysTracking !== null && daysTracking > 0 && (
          <span className={styles.metaItem}>🕐 {daysTracking}d tracking</span>
        )}
        {appearances >= 2 && (
          <span className={styles.metaItem} style={{ color: seenColor }}>↩ {appearances} digests</span>
        )}
      </div>

      {/* Context — clamped to 3 lines on card */}
      {context && (
        <p className={styles.context} style={{
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{context}</p>
      )}

      {/* HUL Insight */}
      {result && (
        <div className={styles.result}>
          <div className={styles.resultLabel}>✨ HUL Insight</div>
          <p className={styles.resultText}>{result}</p>
        </div>
      )}

      {/* Open drawer hint */}
      {onOpen && (
        <div className={styles.sourceHint}>
          <span>🔍</span> Click to view full details ↗
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions} onClick={e => e.stopPropagation()}>
        <button className="btn-primary" onClick={shareToWhatsApp}>💬 WhatsApp</button>
      </div>
    </div>
  );
};

export default TrendCard;
