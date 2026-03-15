import type { ProcessedAlert } from '@/lib/alerts/schema';
import {
  REGION_COLORS,
  REGION_LABELS,
  ALERT_TYPE_LABELS,
} from '@/lib/alerts/constants';

type AlertDetailCardProps = {
  alert: ProcessedAlert | null;
  onClose: () => void;
};

const ALERT_TYPE_BADGE_COLORS: Record<string, string> = {
  evacuation: '#c74949',
  shelter_in_place: '#aa7880',
  fire_danger: '#d4a23e',
  general: '#909090',
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatAlertTimestamp(timestamp: string): string {
  const d = new Date(timestamp);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

function renderTextWithHashtags(text: string, regionColor: string) {
  const parts = text.split(/(#\S+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span key={i} style={{ color: regionColor, fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function AlertDetailCard({ alert, onClose }: AlertDetailCardProps) {
  if (!alert) return null;

  const regionColor = REGION_COLORS[alert.fireRegion] ?? REGION_COLORS.other;
  const regionLabel = REGION_LABELS[alert.fireRegion] ?? alert.fireRegion;
  const typeLabel = ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType;
  const badgeColor = ALERT_TYPE_BADGE_COLORS[alert.alertType] ?? '#909090';

  const hasFrom = alert.fromLocations.length > 0;
  const hasTo = alert.toLocations.length > 0;
  const hasLocations = hasFrom || hasTo;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        maxWidth: 380,
        padding: 16,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid var(--color-rule, #d4d9e5)',
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-sans)',
        zIndex: 10,
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 24,
          height: 24,
          padding: 0,
          border: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-sans)',
          fontSize: 16,
          lineHeight: '24px',
          color: 'var(--color-muted, #5f6a93)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        &times;
      </button>

      {/* Timestamp */}
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-muted, #5f6a93)',
          marginBottom: 6,
        }}
      >
        {formatAlertTimestamp(alert.timestamp)}
      </div>

      {/* Alert type badge */}
      <span
        style={{
          display: 'inline-block',
          fontFamily: 'var(--font-sans)',
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#fff',
          background: badgeColor,
          padding: '2px 6px',
          borderRadius: 2,
          marginBottom: 4,
        }}
      >
        {typeLabel}
      </span>

      {/* Region label */}
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          color: regionColor,
          marginBottom: 8,
          marginTop: 4,
        }}
      >
        {regionLabel}
      </div>

      {/* Tweet text */}
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--color-text, #1f2f8f)',
          marginBottom: hasLocations ? 10 : 8,
        }}
      >
        {renderTextWithHashtags(alert.text, regionColor)}
      </div>

      {/* Locations */}
      {hasLocations && (
        <div style={{ marginBottom: 8 }}>
          {hasFrom && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                marginBottom: 2,
              }}
            >
              <span style={{ color: 'var(--color-muted, #5f6a93)' }}>FROM: </span>
              <span style={{ color: 'var(--color-text, #1f2f8f)' }}>
                {alert.fromLocations.map((l) => l.nameEn).join(', ')}
              </span>
            </div>
          )}
          {hasTo && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
              }}
            >
              <span style={{ color: 'var(--color-muted, #5f6a93)' }}>TO: </span>
              <span style={{ color: 'var(--color-text, #1f2f8f)' }}>
                {alert.toLocations.map((l) => l.nameEn).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Engagement metrics */}
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          color: 'var(--color-muted, #5f6a93)',
          marginBottom: 6,
          display: 'flex',
          gap: 10,
        }}
      >
        <span>RT {alert.engagement.retweets}</span>
        <span>Likes {alert.engagement.likes}</span>
        <span>Replies {alert.engagement.replies}</span>
      </div>

      {/* Source link */}
      <a
        href={alert.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          color: 'var(--color-muted, #5f6a93)',
          textDecoration: 'underline',
        }}
      >
        View original
      </a>
    </div>
  );
}
