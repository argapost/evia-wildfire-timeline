import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProcessedAlert, AlertsSummary } from '@/lib/alerts/schema';
import type { PlaybackSpeed } from '@/lib/alerts/constants';
import { BASE_SECONDS_PER_HOUR, PLAYBACK_SPEEDS, TIMELINE_START } from '@/lib/alerts/constants';
import AlertsMap from './AlertsMap';
import AlertsTimeline from './AlertsTimeline';
import AlertDetailCard from './AlertDetailCard';
import AlertsFrequencyChart from './AlertsFrequencyChart';
import AlertsAnalysisPanel from './AlertsAnalysisPanel';

type AlertsReplayModuleProps = {
  alerts: ProcessedAlert[];
  summary: AlertsSummary;
};

export default function AlertsReplayModule({ alerts, summary }: AlertsReplayModuleProps) {
  const [currentTime, setCurrentTime] = useState<Date>(TIMELINE_START);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(PLAYBACK_SPEEDS[0]);
  const [selectedAlert, setSelectedAlert] = useState<ProcessedAlert | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const urlUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read initial time from URL on mount (client-only, avoids hydration mismatch)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('t');
    if (t) {
      const parsed = new Date(t);
      if (!isNaN(parsed.getTime())) setCurrentTime(parsed);
    }
  }, []);

  // Sync current time to URL (debounced, only when not playing)
  useEffect(() => {
    if (isPlaying) return;
    if (urlUpdateTimerRef.current) clearTimeout(urlUpdateTimerRef.current);
    urlUpdateTimerRef.current = setTimeout(() => {
      const iso = currentTime.toISOString().slice(0, 19);
      const url = new URL(window.location.href);
      url.searchParams.set('t', iso);
      window.history.replaceState(null, '', url.toString());
    }, 300);
    return () => {
      if (urlUpdateTimerRef.current) clearTimeout(urlUpdateTimerRef.current);
    };
  }, [currentTime, isPlaying]);

  // Compute current position: array index of the most recent alert at currentTime
  const rawIdx = alerts.findIndex(
    (a) => new Date(a.timestamp).getTime() > currentTime.getTime()
  );
  const resolvedArrayIndex = rawIdx === -1 ? alerts.length - 1 : Math.max(0, rawIdx - 1);
  // The actual chronologicalIndex property (for map filters)
  const resolvedChronoIndex = alerts[resolvedArrayIndex]?.chronologicalIndex ?? 0;

  // Filter alerts by region
  const filteredAlerts =
    regionFilter === 'all' ? alerts : alerts.filter((a) => a.fireRegion === regionFilter);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastFrameRef.current) / 1000; // seconds elapsed
      lastFrameRef.current = now;

      // Advance simulated time: delta seconds * speed * hours_per_second → ms
      const msToAdvance = delta * playbackSpeed * (3600 * 1000) / BASE_SECONDS_PER_HOUR;

      setCurrentTime((prev) => {
        const next = new Date(prev.getTime() + msToAdvance);
        const lastAlertTime = new Date(alerts[alerts.length - 1].timestamp).getTime();

        if (next.getTime() > lastAlertTime + 60000) {
          setIsPlaying(false);
          return new Date(lastAlertTime);
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, alerts]);

  // Auto-select alert when playback crosses an alert timestamp
  const prevArrayIdxRef = useRef(resolvedArrayIndex);
  useEffect(() => {
    if (isPlaying && resolvedArrayIndex !== prevArrayIdxRef.current && resolvedArrayIndex >= 0) {
      const alert = alerts[resolvedArrayIndex];
      if (alert) {
        setSelectedAlert(alert);
      }
    }
    prevArrayIdxRef.current = resolvedArrayIndex;
  }, [resolvedArrayIndex, isPlaying, alerts]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleTimeChange = useCallback((time: Date) => {
    setCurrentTime(time);
    setIsPlaying(false);
  }, []);

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
  }, []);

  const handleSelectAlert = useCallback(
    (alert: ProcessedAlert | null) => {
      setSelectedAlert(alert);
      if (alert) {
        setIsPlaying(false);
      }
    },
    []
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedAlert(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowRight': {
          e.preventDefault();
          const nextAlert = alerts[resolvedArrayIndex + 1];
          if (nextAlert) {
            setCurrentTime(new Date(nextAlert.timestamp));
            setSelectedAlert(nextAlert);
            setIsPlaying(false);
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (resolvedArrayIndex > 0) {
            const prevAlert = alerts[resolvedArrayIndex - 1];
            setCurrentTime(new Date(prevAlert.timestamp));
            setSelectedAlert(prevAlert);
            setIsPlaying(false);
          }
          break;
        }
        case 'Home':
          e.preventDefault();
          setCurrentTime(TIMELINE_START);
          setSelectedAlert(null);
          setIsPlaying(false);
          break;
        case 'End':
          e.preventDefault();
          if (alerts.length > 0) {
            const last = alerts[alerts.length - 1];
            setCurrentTime(new Date(last.timestamp));
            setSelectedAlert(last);
            setIsPlaying(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alerts, resolvedArrayIndex, handlePlayPause]);

  // Available regions for filter dropdown
  const availableRegions = Array.from(new Set(alerts.map((a) => a.fireRegion))).sort();

  return (
    <div>
      {/* Map + timeline area */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 16rem)', minHeight: '32rem' }}>
      {/* Region filter + summary stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Region:</span>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.76rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1px solid var(--color-rule)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              padding: '2px 6px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All regions ({summary.totalAlerts})</option>
            {availableRegions.map((region) => (
              <option key={region} value={region}>
                {region.replace(/_/g, ' ')} ({summary.countByRegion[region] ?? 0})
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            letterSpacing: '0.04em',
            color: 'var(--color-muted)'
          }}
        >
          Peak: {summary.peakDay} ({summary.peakDayCount} alerts) | Geocoded:{' '}
          {summary.geocodedAlertCount}/{summary.totalAlerts}
        </div>
      </div>

      {/* Map container */}
      <div style={{ position: 'relative', flex: 1, minHeight: '400px', border: '1px solid var(--color-rule)' }}>
        <AlertsMap
          alerts={filteredAlerts}
          currentIndex={resolvedChronoIndex}
          selectedAlert={selectedAlert}
          onSelectAlert={handleSelectAlert}
        />
        <AlertDetailCard alert={selectedAlert} onClose={handleCloseDetail} />
      </div>

      {/* Timeline scrubber */}
      <AlertsTimeline
        alerts={filteredAlerts}
        currentTime={currentTime}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onTimeChange={handleTimeChange}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
      />

      </div>

      {/* OSINT analysis (scrollable below the map) */}
      <AlertsFrequencyChart alerts={filteredAlerts} />
      <AlertsAnalysisPanel alerts={filteredAlerts} />
    </div>
  );
}
