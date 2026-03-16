import type { TimelineEvent } from '@/lib/timeline/types';
import type { TimelineDisplayOptions } from './TimelineWorkspace';

type TimelineLegendProps = {
  events: TimelineEvent[];
  displayOptions?: TimelineDisplayOptions;
};

const ICON = '/images/legend/';

/** 16×16 point icon */
function Icon({ src, alt }: { src: string; alt?: string }) {
  return <img className="legend-icon" src={`${ICON}${src}`} alt={alt ?? ''} aria-hidden="true" />;
}

/** 24×14 wide / duration icon */
function WideIcon({ src, alt }: { src: string; alt?: string }) {
  return <img className="legend-icon-wide" src={`${ICON}${src}`} alt={alt ?? ''} aria-hidden="true" />;
}

export default function TimelineLegend({ events, displayOptions }: TimelineLegendProps) {
  const hideFireEvents = displayOptions?.hideFireEvents ?? false;
  const hideDuration = displayOptions?.hideDurationEvents ?? false;

  const legendCategories = displayOptions?.legendCategories;

  // Compute which categories are actually present in visible events
  const fireCategories = new Set(['wildfire', 'suppression', 'flood']);
  const visibleCategories = new Set<string>();
  if (legendCategories) {
    for (const c of legendCategories) visibleCategories.add(c);
  } else {
    for (const e of events) {
      if (hideFireEvents && fireCategories.has(e.category)) continue;
      if (hideDuration && e.endTs && e.endTs !== e.startTs) continue;
      visibleCategories.add(e.category);
    }
  }

  // Helper: only show a legend entry if at least one of its categories is visible
  const show = (...cats: string[]) => cats.some((c) => visibleCategories.has(c));

  return (
    <section className="legend-panel" aria-label="Timeline legend">
      {/* Row 1: Environmental events */}
      {(show('wildfire') || show('suppression') || show('flood')) && (
        <div className="legend-row">
          {show('wildfire') && (
            <span className="legend-entry">
              <WideIcon src="_activefire.svg" />
              <span>Active Fire</span>
            </span>
          )}
          {show('suppression') && (
            <span className="legend-entry">
              <WideIcon src="_periduntilfullsuppression.svg" />
              <span>Period between suppression of the main fronts and full suppression</span>
            </span>
          )}
          {show('flood') && (
            <span className="legend-entry">
              <WideIcon src="_flood.svg" />
              <span>Flood and extreme rainfall</span>
            </span>
          )}
        </div>
      )}

      {/* Row 2: Legislation, elections, events */}
      {(show('legislation') || show('forestry-policy') || show('election') || show('major-political-event')) && (
        <div className="legend-row">
          {show('legislation') && (
            <span className="legend-entry">
              <Icon src="_legislationchanges.svg" />
              <span>Legislation changes</span>
            </span>
          )}
          {show('forestry-policy') && (
            <span className="legend-entry">
              <Icon src="_legislationchangesforestmanagement.svg" />
              <span>Legislation changes about forest management</span>
            </span>
          )}
          {show('election') && (
            <span className="legend-entry">
              <Icon src="_generalelections.svg" />
              <span>Elections</span>
            </span>
          )}
          {show('major-political-event') && (
            <span className="legend-entry">
              <Icon src="_majorpoliticalevent.svg" />
              <span>Event</span>
            </span>
          )}
        </div>
      )}

      {/* Row 3: section header */}
      {(show('civil-society-action', 'protest') || show('reconstruction-governance') ||
        show('municipal-action') || show('state-agency-action') ||
        show('private-actor') || show('forestry-works') || show('contract', 'donation')) && (
        <div className="legend-row legend-section-label">
          Announcements-Events-Meetings-Works by
        </div>
      )}

      {/* Rows 4–9: dual-symbol entries (1-day point + multi-day duration) */}
      {show('civil-society-action', 'protest') && (
        <div className="legend-row">
          <span className="legend-entry">
            <Icon src="_civilsociety.svg" />
            {!hideDuration && <WideIcon src="_civilsocitey-morethan1day.svg" />}
            <span>civil society</span>
          </span>
        </div>
      )}
      {show('reconstruction-governance') && (
        <div className="legend-row">
          <span className="legend-entry">
            <Icon src="_centralgreekgovernment1dayevent.svg" />
            {!hideDuration && <WideIcon src="_centralgreekgovernment-morethan1day.svg" />}
            <span>central greek government</span>
          </span>
        </div>
      )}
      {show('municipal-action') && (
        <div className="legend-row">
          <span className="legend-entry">
            <Icon src="_regionalgovernmentandlocalmunicipalites1dayevent.svg" />
            {!hideDuration && <WideIcon src="_regionalgovernmentlocalmunicipalities-morethan1day.svg" />}
            <span>regional government &amp; local municipalities</span>
          </span>
        </div>
      )}
      {show('state-agency-action') && (
        <div className="legend-row">
          <span className="legend-entry">
            <Icon src="_otherstateagencies1dayevent.svg" />
            {!hideDuration && <WideIcon src="_otherstateagencies-morethanoneday.svg" />}
            <span>other official state agencies</span>
          </span>
        </div>
      )}
      {show('reconstruction-governance') && (
        <div className="legend-row">
          <span className="legend-entry">
            <Icon src="_diazomaevents1dayevent.svg" />
            {!hideDuration && <WideIcon src="_diazomaevents-morethan1day.svg" />}
            <span>&lsquo;DIAZOMA&rsquo;</span>
          </span>
        </div>
      )}
      {show('forestry-works') && (
        <div className="legend-row">
          <span className="legend-entry">
            <Icon src="_forestryserviceworks1dayevent.svg" />
            {!hideDuration && <WideIcon src="_forestryserviceworks.svg" />}
            <span>Forestry Service</span>
          </span>
        </div>
      )}
      {show('contract', 'donation') && (
        <div className="legend-row">
          <span className="legend-entry">
            <Icon src="_contractdiazoma1dayevent.svg" />
            {!hideDuration && <WideIcon src="_contractssigningduration.svg" />}
            <span>Contracts signed between &lsquo;DIAZOMA&rsquo;, donors &amp; consultant agencies</span>
          </span>
        </div>
      )}

      {/* Row 10 */}
      {show('private-actor') && (
        <div className="legend-row">
          <span className="legend-entry">
            <Icon src="_announcementprivateentities1dayevent.svg" />
            <span>Announcements-Events-Actions by private entities</span>
          </span>
        </div>
      )}

      {/* Row 11 – Spatial Planning Phases */}
      {show('spatial-planning') && !hideDuration && (
        <div className="legend-row">
          <span className="legend-entry">
            <WideIcon src="_spatialplanning-phase1.svg" />
            <WideIcon src="_spatialplanning-phase2.svg" />
            <WideIcon src="_spatialplanning-completed.svg" />
            <span>Spatial Planning Phases</span>
          </span>
        </div>
      )}
    </section>
  );
}