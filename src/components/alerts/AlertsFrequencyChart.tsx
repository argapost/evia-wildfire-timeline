import { useMemo, useRef } from 'react';
import { scaleTime, scaleLinear } from 'd3';
import { useElementSize } from '@/lib/utils/useElementSize';
import { REGION_COLORS, TIMELINE_START, TIMELINE_END } from '@/lib/alerts/constants';
import type { ProcessedAlert } from '@/lib/alerts/schema';

type AlertsFrequencyChartProps = {
  alerts: ProcessedAlert[];
};

const CHART_HEIGHT = 180;
const MARGIN = { top: 12, right: 16, bottom: 28, left: 32 };

/** Generate 6-hour time bins from start to end */
function generate6HourBins(start: Date, end: Date): Date[] {
  const bins: Date[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    bins.push(new Date(cursor));
    cursor.setTime(cursor.getTime() + 6 * 3600 * 1000);
  }
  return bins;
}

/** Build stacked bin data: for each bin, count alerts by region */
function buildStackedBins(
  alerts: ProcessedAlert[],
  bins: Date[]
): { binStart: Date; stacks: { region: string; count: number; y0: number }[] }[] {
  const binInterval = 6 * 3600 * 1000;
  const startMs = bins[0]?.getTime() ?? 0;

  // Count per bin per region
  const countsMap = new Map<number, Map<string, number>>();
  for (const bin of bins) {
    countsMap.set(bin.getTime(), new Map());
  }

  for (const alert of alerts) {
    const ts = new Date(alert.timestamp).getTime();
    const binIndex = Math.floor((ts - startMs) / binInterval);
    if (binIndex < 0 || binIndex >= bins.length) continue;
    const binKey = bins[binIndex].getTime();
    const regionMap = countsMap.get(binKey)!;
    regionMap.set(alert.fireRegion, (regionMap.get(alert.fireRegion) ?? 0) + 1);
  }

  // Collect all regions in order of first appearance
  const allRegions: string[] = [];
  const regionSet = new Set<string>();
  for (const alert of alerts) {
    if (!regionSet.has(alert.fireRegion)) {
      regionSet.add(alert.fireRegion);
      allRegions.push(alert.fireRegion);
    }
  }

  return bins.map((binStart) => {
    const regionMap = countsMap.get(binStart.getTime())!;
    let cumulative = 0;
    const stacks: { region: string; count: number; y0: number }[] = [];
    for (const region of allRegions) {
      const count = regionMap.get(region) ?? 0;
      if (count > 0) {
        stacks.push({ region, count, y0: cumulative });
        cumulative += count;
      }
    }
    return { binStart, stacks };
  });
}

/** Format date for x-axis tick */
function formatTickDate(d: Date): string {
  return `${d.getDate()} Aug`;
}

export default function AlertsFrequencyChart({ alerts }: AlertsFrequencyChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { width } = useElementSize(containerRef, { width: 0, height: 0 });

  const bins = useMemo(() => generate6HourBins(TIMELINE_START, TIMELINE_END), []);

  const stackedData = useMemo(() => buildStackedBins(alerts, bins), [alerts, bins]);

  const maxCount = useMemo(
    () =>
      stackedData.reduce((max, bin) => {
        const total = bin.stacks.reduce((sum, s) => sum + s.count, 0);
        return Math.max(max, total);
      }, 0),
    [stackedData]
  );

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  const xScale = useMemo(
    () =>
      scaleTime()
        .domain([TIMELINE_START, TIMELINE_END])
        .range([0, innerWidth]),
    [innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, Math.max(1, maxCount)])
        .range([innerHeight, 0])
        .nice(),
    [innerHeight, maxCount]
  );

  // Generate 2-day x-axis ticks
  const xTicks = useMemo(() => {
    const ticks: Date[] = [];
    const cursor = new Date(TIMELINE_START);
    while (cursor <= TIMELINE_END) {
      ticks.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 2);
    }
    return ticks;
  }, []);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const niceDomain = yScale.domain();
    const top = niceDomain[1];
    const step = top <= 5 ? 1 : top <= 20 ? 5 : 10;
    const ticks: number[] = [];
    for (let v = 0; v <= top; v += step) {
      ticks.push(v);
    }
    return ticks;
  }, [yScale]);

  const barWidth = Math.max(1, (innerWidth / bins.length) - 1);

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Section header */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--color-muted, #5f6a93)',
          paddingBottom: '6px',
          borderBottom: '1px solid var(--color-rule, #d4d9e5)',
          marginBottom: '12px',
        }}
      >
        Alert frequency
      </div>

      {/* Chart container */}
      <div ref={containerRef} style={{ width: '100%' }}>
        {width > 0 && (
          <svg
            width={width}
            height={CHART_HEIGHT}
            style={{ display: 'block' }}
            aria-label="Alert frequency chart showing alerts per 6-hour block"
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Horizontal grid lines */}
              {yTicks.map((v) => (
                <line
                  key={`grid-${v}`}
                  x1={0}
                  x2={innerWidth}
                  y1={yScale(v)}
                  y2={yScale(v)}
                  stroke="var(--color-rule, #d4d9e5)"
                  strokeWidth={0.5}
                  strokeDasharray={v === 0 ? undefined : '2,3'}
                />
              ))}

              {/* Stacked bars */}
              {stackedData.map((bin) => {
                const x = xScale(bin.binStart);
                return bin.stacks.map((stack) => {
                  const barH = innerHeight - yScale(stack.count);
                  const y = yScale(stack.y0 + stack.count);
                  return (
                    <rect
                      key={`${bin.binStart.getTime()}-${stack.region}`}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(0, barH)}
                      fill={REGION_COLORS[stack.region] ?? REGION_COLORS.other}
                      rx={1}
                      ry={1}
                      opacity={0.85}
                    >
                      <title>
                        {`${stack.region}: ${stack.count} alert${stack.count !== 1 ? 's' : ''}`}
                      </title>
                    </rect>
                  );
                });
              })}

              {/* X-axis line */}
              <line
                x1={0}
                x2={innerWidth}
                y1={innerHeight}
                y2={innerHeight}
                stroke="var(--color-rule, #d4d9e5)"
                strokeWidth={1}
              />

              {/* X-axis ticks */}
              {xTicks.map((tick) => {
                const x = xScale(tick);
                return (
                  <g key={tick.toISOString()}>
                    <line
                      x1={x}
                      x2={x}
                      y1={innerHeight}
                      y2={innerHeight + 5}
                      stroke="var(--color-rule, #d4d9e5)"
                      strokeWidth={1}
                    />
                    <text
                      x={x}
                      y={innerHeight + 16}
                      textAnchor="middle"
                      fill="var(--color-muted, #5f6a93)"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '9px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {formatTickDate(tick)}
                    </text>
                  </g>
                );
              })}

              {/* Y-axis ticks */}
              {yTicks.map((v) => (
                <text
                  key={`ytick-${v}`}
                  x={-8}
                  y={yScale(v)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="var(--color-muted, #5f6a93)"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '9px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {v}
                </text>
              ))}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
