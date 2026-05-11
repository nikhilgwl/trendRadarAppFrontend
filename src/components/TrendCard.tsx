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

const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  const name = trend.trend_name || trend.trend || 'Beauty Trend';
  const platform = trend.source_platform || trend.platform || 'Multiple Sources';
  const label = trend.label || '[TREND]';
  const category = trend.category || '';
  const metric = trend.metric || trend.popularity || trend.metric_summary || 'Rising';
  const context = trend.context || trend.what_is_happening || '';
  const result = trend.result || trend.the_result || '';

  const shareToWhatsApp = () => {
    const text = `🚀 *Trend Alert: ${name}*\n\n📍 *Source:* ${platform}\n📊 *Metric:* ${metric}\n\n💬 *Context:* ${context}\n\n✨ *Result:* ${result}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = `🚀 *Trend Alert: ${name}*\n\n📍 Source: ${platform}\n📊 Metric: ${metric}\n\nContext: ${context}\n\nResult: ${result}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(trend.url || '')}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const getPlatformIcon = (p: string) => {
    const platform = p.toLowerCase();
    if (platform.includes('reddit')) return '👾';
    if (platform.includes('pinterest')) return '📌';
    if (platform.includes('google') || platform.includes('search')) return '🔍';
    if (platform.includes('news') || platform.includes('grazia') || platform.includes('herzindagi') || platform.includes('indiatimes') || platform.includes('lifestyle')) return '📰';
    return '💎';
  };

  const copyToClipboard = () => {
    const text = `🚀 Trend Alert: ${name}\n\n📍 Source: ${platform}\n📊 Metric: ${metric}\n\nContext: ${context}\n\nResult: ${result}`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const openSource = () => {
    if (trend.url) {
      window.open(trend.url, '_blank');
    }
  };

  return (
    <div 
      className={`premium-card ${trend.url ? styles.clickable : ''}`} 
      onClick={openSource}
      style={{ cursor: trend.url ? 'pointer' : 'default' }}
    >
      <div className={styles.header}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-rising">{label}</span>
          {category && <span className={`badge ${styles.categoryBadge}`}>{category}</span>}
        </div>
        <span className={styles.platformIcon}>{getPlatformIcon(platform)}</span>
      </div>
      
      <h3 className={styles.title}>{name}</h3>
      
      <div className={styles.meta}>
        <span>📍 {platform}</span>
        <span>📊 {metric}</span>
      </div>

      <div className={styles.content}>
        <p className={styles.context}>{context}</p>
        <div className={styles.result}>
          <strong>✨ Result:</strong>
          <p>{result}</p>
        </div>
      </div>

      {trend.url && <div className={styles.sourceHint}>Click to view original source ↗</div>}

      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        <button onClick={shareToWhatsApp} className="btn-primary">
          <span className={styles.btnIcon}>💬</span> WhatsApp
        </button>
        <button onClick={shareToTelegram} className="btn-secondary">
          <span className={styles.btnIcon}>✈️</span> Telegram
        </button>
      </div>
    </div>
  );
};

export default TrendCard;
