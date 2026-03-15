import { useCallback, useMemo, useRef } from 'react';
import { pointer, scaleTime } from 'd3';
import { useElementSize } from '@/lib/utils/useElementSize';
import {
  REGION_COLORS,
  TIMELINE_START,
  TIMELINE_END,
  PLAYBACK_SPEEDS,
  type PlaybackSpeed
} from '@/lib/alerts/constants';
import type { ProcessedAlert } from '@/lib/alerts/schema';

type AlertsTimelineProps = {
  alerts: ProcessedAlert[];
  currentTime: Date;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onTimeChange: (time: Date) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
};

const MARGIN_LEFT = 40;
const MARGIN_RIGHT = 20;
const SVG_HEIGHT = 60;
const CONTROLS_HEIGHT = 40;
const TICK_HEIGHT = 20;

/** Day labels to render. Only these days get a label; the rest get a small tick. */
const LABEL_DAYS = [1, 5, 10, 15, 20];

const athensFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Europe/Athens'
});

function formatCurrentTime(date: Date): string {
  return athensFormatter.format(date);
}

function buildDayTicks(start: Date, end: Date): Date[] {
  const ticks: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    ticks.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return ticks;
}

function dayLabel(day: number, isFirst: boolean): string {
  if (isFirst) return `${day} Aug`;
  return String(day);
}

export default function AlertsTimeline({
  alerts,
  currentTime,
  isPlaying,
  playbackSpeed,
  onTimeChange,
  onPlayPause,
  onSpeedChange
}: AlertsTimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const { width } = useElementSize(containerRef, { width: 0, height: 0 });

  const xScale = useMemo(() => {
    const rangeStart = MARGIN_LEFT;
    const rangeEnd = Math.max(MARGIN_LEFT + 1, width - MARGIN_RIGHT);
    return scaleTime().domain([TIMELINE_START, TIMELINE_END]).range([rangeStart, rangeEnd]).clamp(true);
  }, [width]);

  const dayTicks = useMemo(() => buildDayTicks(TIMELINE_START, TIMELINE_END), []);

  const clampToTimeline = useCallback(
    (x: number): Date => {
      return xScale.invert(x) as Date;
    },
    [xScale]
  );

  const handleScrub = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const [x] = pointer(event.nativeEvent, event.currentTarget);
      const time = clampToTimeline(x);
      onTimeChange(time);
    },
    [clampToTimeline, onTimeChange]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      isDraggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      handleScrub(event);
    },
    [handleScrub]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!isDraggingRef.current) return;
      handleScrub(event);
    },
    [handleScrub]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      isDraggingRef.current = false;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    []
  );

  const playheadX = xScale(currentTime);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        borderTop: '1px solid var(--color-rule, #d4d9e5)',
        background: 'var(--color-surface, #ffffff)',
        userSelect: 'none'
      }}
    >
      {/* SVG timeline area */}
      <svg
        width={width}
        height={SVG_HEIGHT}
        style={{ display: 'block', cursor: 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label="Alert timeline scrubber"
      >
        {/* Day tick marks */}
        {dayTicks.map((tick) => {
          const x = xScale(tick);
          const day = tick.getDate();
          const isLabeled = LABEL_DAYS.includes(day);
          const isFirst = day === LABEL_DAYS[0];

          return (
            <g key={tick.toISOString()}>
              <line
                x1={x}
                x2={x}
                y1={SVG_HEIGHT - 12}
                y2={SVG_HEIGHT}
                stroke="var(--color-rule, #d4d9e5)"
                strokeWidth={1}
              />
              {isLabeled && (
                <text
                  x={x}
                  y={SVG_HEIGHT - 16}
                  textAnchor="middle"
                  fill="var(--color-muted, #5f6a93)"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '9px',
                    letterSpacing: '0.02em'
                  }}
                >
                  {dayLabel(day, isFirst)}
                </text>
              )}
            </g>
          );
        })}

        {/* Alert tick marks */}
        {alerts.map((alert) => {
          const t = new Date(alert.timestamp);
          const x = xScale(t);
          const color = REGION_COLORS[alert.fireRegion] ?? REGION_COLORS.other;

          return (
            <line
              key={alert.tweetId}
              x1={x}
              x2={x}
              y1={SVG_HEIGHT - 12 - TICK_HEIGHT}
              y2={SVG_HEIGHT - 12}
              stroke={color}
              strokeWidth={2}
              opacity={0.7}
            >
              <title>{t.toLocaleString('en-GB', { timeZone: 'Europe/Athens' })}</title>
            </line>
          );
        })}

        {/* Playhead */}
        {width > 0 && (
          <line
            x1={playheadX}
            x2={playheadX}
            y1={0}
            y2={SVG_HEIGHT}
            stroke="var(--color-text, #1f2f8f)"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Controls bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: `${CONTROLS_HEIGHT}px`,
          padding: '0 12px',
          borderTop: '1px solid var(--color-rule, #d4d9e5)'
        }}
      >
        {/* Left: play/pause + speed buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={onPlayPause}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              color: 'var(--color-text, #1f2f8f)',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>

          <div
            style={{
              width: '1px',
              height: '16px',
              background: 'var(--color-rule, #d4d9e5)'
            }}
          />

          {PLAYBACK_SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => onSpeedChange(speed)}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                fontWeight: speed === playbackSpeed ? 700 : 400,
                letterSpacing: '0.04em',
                background: 'none',
                border: 'none',
                borderBottom: speed === playbackSpeed ? '2px solid var(--color-text, #1f2f8f)' : '2px solid transparent',
                color: speed === playbackSpeed ? 'var(--color-text, #1f2f8f)' : 'var(--color-muted, #5f6a93)',
                cursor: 'pointer',
                padding: '4px 6px',
                lineHeight: 1
              }}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Right: current time label */}
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            color: 'var(--color-text, #1f2f8f)',
            whiteSpace: 'nowrap'
          }}
        >
          {formatCurrentTime(currentTime)}
        </div>
      </div>
    </div>
  );
}
