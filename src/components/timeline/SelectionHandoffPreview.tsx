import { useTimelineSelection } from '@/lib/timeline';

export default function SelectionHandoffPreview() {
  const { selectedEvent } = useTimelineSelection();

  return (
    <section className="timeline-handoff-grid" aria-label="Selection handoff">
      <article className="timeline-handoff-card">
        <h2>Detail Panel Handoff</h2>
        {selectedEvent ? (
          <>
            <p className="timeline-handoff-title">{selectedEvent.title}</p>
            <p className="timeline-handoff-meta">{selectedEvent.displayDate}</p>
            <p>{selectedEvent.summary}</p>
          </>
        ) : (
          <p>Select an event to expose detail-panel state.</p>
        )}
      </article>

      <article className="timeline-handoff-card">
        <h2>Map Handoff</h2>
        {selectedEvent ? (
          <>
            <p className="timeline-handoff-title">{selectedEvent.id}</p>
            <p className="timeline-handoff-meta">
              Geometry: {selectedEvent.geometry ? selectedEvent.geometry.type : 'none'}
            </p>
            <p>
              Viewport:{' '}
              {selectedEvent.mapViewport
                ? `${selectedEvent.mapViewport.center[0].toFixed(2)}, ${selectedEvent.mapViewport.center[1].toFixed(2)} z${selectedEvent.mapViewport.zoom.toFixed(1)}`
                : 'fallback required'}
            </p>
          </>
        ) : (
          <p>Select an event to expose map synchronization state.</p>
        )}
      </article>
    </section>
  );
}

