import { useMemo } from 'react';
import { getCategoryColor, getCategoryLabel } from '@/lib/timeline/categories';
import type { MediaLookup, SourceLookup, TimelineEvent } from '@/lib/timeline/types';

type EventDetailPanelProps = {
  selectedEvent: TimelineEvent | null;
  sourcesById: SourceLookup;
  mediaById: MediaLookup;
};

function splitBody(body: string): string[] {
  return body
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default function EventDetailPanel({ selectedEvent, sourcesById, mediaById }: EventDetailPanelProps) {
  const sources = useMemo(() => {
    if (!selectedEvent) {
      return [];
    }

    return selectedEvent.sourceRefs
      .map((sourceRef) => sourcesById[sourceRef])
      .filter((source): source is NonNullable<typeof source> => Boolean(source));
  }, [selectedEvent, sourcesById]);

  const images = useMemo(() => {
    if (!selectedEvent) {
      return [];
    }

    const orderedIds = [selectedEvent.coverImage, ...selectedEvent.imageRefs].filter(
      (value): value is string => Boolean(value)
    );

    const dedupedIds = [...new Set(orderedIds)];
    return dedupedIds
      .map((mediaId) => mediaById[mediaId])
      .filter((media): media is NonNullable<typeof media> => Boolean(media));
  }, [mediaById, selectedEvent]);

  if (!selectedEvent) {
    return (
      <aside className="detail-panel" aria-label="Event detail panel" aria-live="polite">
        <p className="detail-placeholder">Select an event to inspect images, summary, legend, and source links.</p>
      </aside>
    );
  }

  const bodyParagraphs = splitBody(selectedEvent.body);
  const leadText = bodyParagraphs[0] ?? '';
  const visibleImages = images.slice(0, 4);
  const legendText = visibleImages[0]?.caption ?? selectedEvent.summary;

  return (
    <aside className="detail-panel" aria-label="Event detail panel" aria-live="polite">
      <header className="detail-header">
        <p className="detail-eyebrow">Selected event</p>
        <h2>{selectedEvent.title}</h2>
        <p className="detail-date">{selectedEvent.displayDate}</p>
        <span
          className="detail-category"
          style={{
            borderColor: getCategoryColor(selectedEvent.category),
            color: getCategoryColor(selectedEvent.category)
          }}
        >
          {getCategoryLabel(selectedEvent.category)}
        </span>
      </header>

      <div className="detail-top-grid">
        <section className="detail-media-column" aria-label="Event images">
          {visibleImages.length > 0 ? (
            <div className="detail-image-grid detail-image-grid--primary">
              {visibleImages.map((image) => (
                <figure key={image.id} className="detail-figure">
                  <img src={image.file} alt={image.alt} loading="lazy" />
                </figure>
              ))}
            </div>
          ) : (
            <p className="detail-empty-block">No linked images available for this event.</p>
          )}
        </section>

        <section className="detail-text-column" aria-label="Summary and source links">
          <h3>Summary</h3>
          <p>{selectedEvent.summary}</p>
          {leadText ? <p>{leadText}</p> : null}

          <h3>Source tags</h3>
          {sources.length > 0 ? (
            <div className="detail-source-tags">
              {sources.map((source) => (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="source-tag">
                  {source.publisher}
                </a>
              ))}
            </div>
          ) : (
            <p className="detail-empty-block">No source links available for this event.</p>
          )}
        </section>
      </div>

      <section className="detail-section detail-legend-section" aria-label="Event legend">
        <h3>Legend</h3>
        <p>{legendText}</p>
      </section>

      <section className="detail-section" aria-label="Sources">
        <h3>Sources</h3>
        {sources.length > 0 ? (
          <ol className="detail-source-list">
            {sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
                <p className="detail-source-meta">
                  {source.publisher} {source.date ? `(${source.date})` : ''}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p>No source references available for this event.</p>
        )}
      </section>
    </aside>
  );
}
