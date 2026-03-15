import { useMemo } from 'react';
import { REGION_COLORS, REGION_LABELS } from '@/lib/alerts/constants';
import type { ProcessedAlert } from '@/lib/alerts/schema';

type AlertsAnalysisPanelProps = {
  alerts: ProcessedAlert[];
};

// ── Shared styles ──

const sectionHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--color-muted, #5f6a93)',
  paddingBottom: '6px',
  borderTop: '1px solid var(--color-rule, #d4d9e5)',
  paddingTop: '16px',
  marginTop: '24px',
  marginBottom: '12px',
};

const tableCellStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.82rem',
  padding: '4px 10px 4px 0',
  verticalAlign: 'top',
  lineHeight: 1.4,
  borderBottom: '1px solid var(--color-rule, #d4d9e5)',
};

const tableHeaderCellStyle: React.CSSProperties = {
  ...tableCellStyle,
  fontWeight: 600,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--color-muted, #5f6a93)',
  borderBottom: '2px solid var(--color-rule, #d4d9e5)',
};

const numericCellStyle: React.CSSProperties = {
  ...tableCellStyle,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

const numericHeaderStyle: React.CSSProperties = {
  ...tableHeaderCellStyle,
  textAlign: 'right',
};

// ── Helpers ──

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} Aug`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-GB');
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}

// ── Section 1: Evacuation Network ──

type EvacuationDestination = {
  nameEn: string;
  count: number;
  sourceVillages: string[];
};

function computeEvacuationNetwork(alerts: ProcessedAlert[]): EvacuationDestination[] {
  const destMap = new Map<string, { count: number; sources: Set<string> }>();

  for (const alert of alerts) {
    if (alert.alertType !== 'evacuation') continue;
    if (alert.toLocations.length === 0) continue;

    const fromNames = alert.fromLocations.map((loc) => loc.nameEn);

    for (const toLoc of alert.toLocations) {
      const key = toLoc.nameEn;
      if (!destMap.has(key)) {
        destMap.set(key, { count: 0, sources: new Set() });
      }
      const entry = destMap.get(key)!;
      entry.count += 1;
      for (const name of fromNames) {
        entry.sources.add(name);
      }
    }
  }

  return Array.from(destMap.entries())
    .map(([nameEn, { count, sources }]) => ({
      nameEn,
      count,
      sourceVillages: Array.from(sources).sort(),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function EvacuationNetworkSection({ alerts }: { alerts: ProcessedAlert[] }) {
  const destinations = useMemo(() => computeEvacuationNetwork(alerts), [alerts]);

  if (destinations.length === 0) {
    return (
      <div>
        <div style={sectionHeaderStyle}>Evacuation network</div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.82rem',
            color: 'var(--color-muted, #5f6a93)',
          }}
        >
          No evacuation data available.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={sectionHeaderStyle}>Evacuation network</div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'auto',
        }}
      >
        <thead>
          <tr>
            <th style={tableHeaderCellStyle}>Destination</th>
            <th style={numericHeaderStyle}>Count</th>
            <th style={tableHeaderCellStyle}>Source villages</th>
          </tr>
        </thead>
        <tbody>
          {destinations.map((dest) => (
            <tr key={dest.nameEn}>
              <td
                style={{
                  ...tableCellStyle,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {dest.nameEn}
              </td>
              <td style={numericCellStyle}>{dest.count}</td>
              <td
                style={{
                  ...tableCellStyle,
                  color: 'var(--color-muted, #5f6a93)',
                  fontSize: '0.78rem',
                }}
              >
                {dest.sourceVillages.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Section 2: Multi-fire Comparison Table ──

type RegionRow = {
  region: string;
  label: string;
  color: string;
  dateFirst: string;
  dateLast: string;
  alertCount: number;
  evacuationCount: number;
  totalEngagement: number;
};

function computeRegionComparison(alerts: ProcessedAlert[]): RegionRow[] {
  const regionMap = new Map<
    string,
    {
      timestamps: number[];
      alertCount: number;
      evacuationCount: number;
      totalEngagement: number;
    }
  >();

  for (const alert of alerts) {
    const region = alert.fireRegion;
    if (!regionMap.has(region)) {
      regionMap.set(region, {
        timestamps: [],
        alertCount: 0,
        evacuationCount: 0,
        totalEngagement: 0,
      });
    }
    const entry = regionMap.get(region)!;
    entry.timestamps.push(new Date(alert.timestamp).getTime());
    entry.alertCount += 1;
    if (alert.alertType === 'evacuation') {
      entry.evacuationCount += 1;
    }
    entry.totalEngagement +=
      alert.engagement.retweets + alert.engagement.likes;
  }

  return Array.from(regionMap.entries())
    .map(([region, data]) => {
      const sorted = data.timestamps.sort((a, b) => a - b);
      return {
        region,
        label: REGION_LABELS[region] ?? region,
        color: REGION_COLORS[region] ?? REGION_COLORS.other,
        dateFirst: new Date(sorted[0]).toISOString(),
        dateLast: new Date(sorted[sorted.length - 1]).toISOString(),
        alertCount: data.alertCount,
        evacuationCount: data.evacuationCount,
        totalEngagement: data.totalEngagement,
      };
    })
    .sort((a, b) => b.alertCount - a.alertCount);
}

function FireComparisonSection({ alerts }: { alerts: ProcessedAlert[] }) {
  const rows = useMemo(() => computeRegionComparison(alerts), [alerts]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div>
      <div style={sectionHeaderStyle}>Fire incidents comparison</div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'auto',
        }}
      >
        <thead>
          <tr>
            <th style={tableHeaderCellStyle}>Region</th>
            <th style={tableHeaderCellStyle}>Date range</th>
            <th style={numericHeaderStyle}>Alerts</th>
            <th style={numericHeaderStyle}>Evacuations</th>
            <th style={numericHeaderStyle}>Engagement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.region}>
              <td
                style={{
                  ...tableCellStyle,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: row.color,
                      flexShrink: 0,
                    }}
                  />
                  {row.label}
                </span>
              </td>
              <td
                style={{
                  ...tableCellStyle,
                  whiteSpace: 'nowrap',
                  fontSize: '0.78rem',
                  color: 'var(--color-muted, #5f6a93)',
                }}
              >
                {formatDateShort(row.dateFirst)} &ndash; {formatDateShort(row.dateLast)}
              </td>
              <td style={numericCellStyle}>{formatNumber(row.alertCount)}</td>
              <td style={numericCellStyle}>{formatNumber(row.evacuationCount)}</td>
              <td style={numericCellStyle}>{formatNumber(row.totalEngagement)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Section 3: Engagement Summary ──

function EngagementSummarySection({ alerts }: { alerts: ProcessedAlert[] }) {
  const stats = useMemo(() => {
    if (alerts.length === 0) return null;

    let totalEngagement = 0;
    let mostRetweeted: ProcessedAlert | null = null;
    let maxRetweets = -1;

    for (const alert of alerts) {
      const engagement = alert.engagement.retweets + alert.engagement.likes;
      totalEngagement += engagement;

      if (alert.engagement.retweets > maxRetweets) {
        maxRetweets = alert.engagement.retweets;
        mostRetweeted = alert;
      }
    }

    const avgEngagement = totalEngagement / alerts.length;

    return {
      totalEngagement,
      avgEngagement,
      mostRetweeted,
      maxRetweets,
      totalAlerts: alerts.length,
    };
  }, [alerts]);

  if (!stats || !stats.mostRetweeted) {
    return null;
  }

  const { mostRetweeted, maxRetweets, totalEngagement, avgEngagement, totalAlerts } = stats;

  const snippetStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.82rem',
    lineHeight: 1.6,
    color: 'var(--color-text, #1f2f8f)',
    margin: '0 0 6px 0',
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--color-muted, #5f6a93)',
    fontSize: '0.78rem',
  };

  const valueStyle: React.CSSProperties = {
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div>
      <div style={sectionHeaderStyle}>Engagement summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={snippetStyle}>
          <span style={labelStyle}>Most retweeted alert: </span>
          <span style={{ fontStyle: 'italic' }}>
            &ldquo;{truncateText(mostRetweeted.text, 120)}&rdquo;
          </span>
          {' '}&mdash;{' '}
          <span style={valueStyle}>{formatNumber(maxRetweets)} RTs</span>
          {' '}
          <span style={labelStyle}>
            ({formatDateShort(mostRetweeted.timestamp)})
          </span>
        </p>
        <p style={snippetStyle}>
          <span style={labelStyle}>Total engagement: </span>
          <span style={valueStyle}>{formatNumber(totalEngagement)}</span>
          {' '}
          <span style={labelStyle}>
            across {formatNumber(totalAlerts)} alerts
          </span>
        </p>
        <p style={snippetStyle}>
          <span style={labelStyle}>Average engagement: </span>
          <span style={valueStyle}>{Math.round(avgEngagement).toLocaleString('en-GB')}</span>
          {' '}
          <span style={labelStyle}>per alert</span>
        </p>
      </div>
    </div>
  );
}

// ── Main Panel ──

export default function AlertsAnalysisPanel({ alerts }: AlertsAnalysisPanelProps) {
  return (
    <div style={{ paddingBottom: '32px' }}>
      <EvacuationNetworkSection alerts={alerts} />
      <FireComparisonSection alerts={alerts} />
      <EngagementSummarySection alerts={alerts} />
    </div>
  );
}
