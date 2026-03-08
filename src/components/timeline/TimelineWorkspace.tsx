import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  TimelineSelectionContext,
  fetchTimelineResources,
  type MediaLookup,
  type SourceLookup,
  type TimelineEvent
} from '@/lib/timeline';
import D3Timeline from './D3Timeline';
import EventDetailPanel from './EventDetailPanel';

const LazyEventMapPanel = lazy(() => import('./EventMapPanel'));

export default function TimelineWorkspace() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [sourcesById, setSourcesById] = useState<SourceLookup>({});
  const [mediaById, setMediaById] = useState<MediaLookup>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      try {
        const resources = await fetchTimelineResources(controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        setEvents(resources.events);
        setSourcesById(resources.sourcesById);
        setMediaById(resources.mediaById);
        setSelectedEventId((previous) => previous ?? resources.events[0]?.id ?? null);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unknown timeline load error.';
        setErrorMessage(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, []);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const selectionState = useMemo(
    () => ({
      events,
      selectedEventId,
      selectedEvent,
      setSelectedEventId
    }),
    [events, selectedEvent, selectedEventId]
  );

  if (isLoading) {
    return (
      <section className="timeline-placeholder" aria-live="polite">
        <h2>Loading timeline data</h2>
        <p>Reading compiled research events and references from `/data/*` artifacts.</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="timeline-placeholder" aria-live="assertive">
        <h2>Timeline data unavailable</h2>
        <p>{errorMessage}</p>
      </section>
    );
  }

  return (
    <TimelineSelectionContext.Provider value={selectionState}>
      <section className="timeline-workspace" aria-label="Timeline workspace">
        <D3Timeline
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={(eventId) => setSelectedEventId(eventId)}
        />

        <div className="workspace-panels" aria-label="Event detail and map panels">
          <EventDetailPanel selectedEvent={selectedEvent} sourcesById={sourcesById} mediaById={mediaById} />
          <Suspense
            fallback={
              <section className="map-panel" aria-label="Map panel loading state" aria-live="polite">
                <p>Loading map module...</p>
              </section>
            }
          >
            <LazyEventMapPanel selectedEvent={selectedEvent} events={events} />
          </Suspense>
        </div>
      </section>
    </TimelineSelectionContext.Provider>
  );
}
