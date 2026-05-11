import React from 'react';
import styles from './TrendCard.module.css';

interface Trend {
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
}

interface TrendCardProps {
  trend: Trend;
}

const platformIcons: Record<string, string> = {
  reddit: '👾',
  pinterest: '📌',
  google: '🔍',
  news: '📰',
  rss: '📰',
  grazia: '📰',
  herzindagi: '📰',
  indiatimes: '📰',
  default: '💎',
};

function getPlatformIcon(platform: string): string {
  const p = platform.toLowerCase();
  for (const key of Object.keys(platformIcons)) {
    if (p.includes(key)) return platformIcons[key];
  }
  return platformIcons.default;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  const name     = trend.trend_name || trend.trend || 'Beauty Trend';
  const platform = trend.source_platform || trend.platform || 'Multiple Sources';
  const label    = trend.label || '[TREND]';
  const category = trend.category || '';
  const metric   = trend.metric || trend.popularity || trend.metric_summary || 'Rising';
  const context  = trend.context || trend.what_is_happening || '';
  const result   = trend.result || trend.the_result || '';
  const hasUrl   = Boolean(trend.url);

  const shareToWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🚀 *Trend Alert: ${name}*\n\n📍 *Source:* ${platform}\n📊 *Metric:* ${metric}\n\n💬 *Context:* ${context}\n\n✨ *Result:* ${result}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const openSource = () => {
    if (trend.url) window.open(trend.url, '_blank');
  };

  return (
    <div
      className={`premium-card ${styles.card} ${hasUrl ? styles.clickable : ''}`}
      onClick={hasUrl ? openSource : undefined}
      style={{ cursor: hasUrl ? 'pointer' : 'default' }}
    >
      {/* Top row: badges + icon */}
      <div className={styles.cardTop}>
        <div className={styles.badges}>
          <span className="badge badge-rising">{label}</span>
          {category && <span className="badge badge-ai">{category}</span>}
        </div>
        <span className={styles.platformIcon}>{getPlatformIcon(platform)}</span>
      </div>

      {/* Title */}
      <h3 className={styles.title}>{name}</h3>

      {/* Meta */}
      <div className={styles.meta}>
        <span className={styles.metaItem}>📍 {platform}</span>
        <span className={styles.metaItem}>📊 {metric}</span>
      </div>

      {/* Context */}
      {context && <p className={styles.context}>{context}</p>}

      {/* Result */}
      {result && (
        <div className={styles.result}>
          <div className={styles.resultLabel}>✨ HUL Insight</div>
          <p className={styles.resultText}>{result}</p>
        </div>
      )}

      {/* Source hint */}
      {hasUrl && (
        <div className={styles.sourceHint}>
          <span>🔗</span> Click card to view original source ↗
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions} onClick={e => e.stopPropagation()}>
        <button className="btn-primary" onClick={shareToWhatsApp}>
          💬 WhatsApp
        </button>
      </div>
    </div>
  );
};

export default TrendCard;
