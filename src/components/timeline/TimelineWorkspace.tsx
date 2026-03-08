import { useEffect, useMemo, useState } from 'react';
import {
  TimelineSelectionContext,
  fetchTimelineEvents,
  type TimelineEvent
} from '@/lib/timeline';
import D3Timeline from './D3Timeline';
import SelectionHandoffPreview from './SelectionHandoffPreview';

export default function TimelineWorkspace() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      try {
        const nextEvents = await fetchTimelineEvents(controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        setEvents(nextEvents);
        setSelectedEventId((previous) => previous ?? nextEvents[0]?.id ?? null);
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
        <p>Reading compiled research events from `/data/events.index.json`.</p>
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
        <SelectionHandoffPreview />
      </section>
    </TimelineSelectionContext.Provider>
  );
}

