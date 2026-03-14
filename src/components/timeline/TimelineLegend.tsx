import type { TimelineEvent } from '@/lib/timeline/types';

type TimelineLegendProps = {
  events: TimelineEvent[];
};

// Colours matching the design system
const C = {
  red: '#c74949',
  redMuted: '#b85f5c',
  blue: '#23349d',
  blueMid: '#3f4fa1',
  blueDark: '#273891',
  blueLight: '#7376c6',
  green: '#5a8a5a',
  greenLight: '#7fb07f',
  grey: '#9ca4b4',
  greyLight: '#b4b4b4',
  textBlue: '#1f2f8f',
};

/** Small inline SVG icon builder – all 16×16 viewBox */
function FilledSquare({ color }: { color: string }) {
  return (
    <svg className="legend-icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" fill={color} />
    </svg>
  );
}

function StrokeSquare({ color }: { color: string }) {
  return (
    <svg className="legend-icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function FilledCircle({ color }: { color: string }) {
  return (
    <svg className="legend-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="5" fill={color} />
    </svg>
  );
}

function StrokeCircle({ color }: { color: string }) {
  return (
    <svg className="legend-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="4.5" fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function TargetCircle({ color }: { color: string }) {
  return (
    <svg className="legend-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="8" cy="8" r="3" fill={color} />
    </svg>
  );
}

function HatchedRect({ color }: { color: string }) {
  return (
    <svg className="legend-icon-wide" viewBox="0 0 24 14" aria-hidden="true">
      <defs>
        <pattern id={`hatch-${color.replace('#','')}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke={color} strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect x="0.5" y="0.5" width="23" height="13" fill={`url(#hatch-${color.replace('#','')})`} stroke={color} strokeWidth="0.5" />
    </svg>
  );
}

function HashSymbol({ color }: { color: string }) {
  return (
    <svg className="legend-icon" viewBox="0 0 16 16" aria-hidden="true">
      <text x="8" y="13" textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="sans-serif">#</text>
    </svg>
  );
}

function AtSymbol({ color }: { color: string }) {
  return (
    <svg className="legend-icon" viewBox="0 0 16 16" aria-hidden="true">
      <text x="8" y="13" textAnchor="middle" fill={color} fontSize="13" fontWeight="400" fontFamily="sans-serif">@</text>
    </svg>
  );
}

export default function TimelineLegend({ events: _events }: TimelineLegendProps) {
  return (
    <section className="legend-panel" aria-label="Timeline legend">
      {/* Row 1 */}
      <div className="legend-row">
        <span className="legend-entry">
          <FilledSquare color={C.red} />
          <span>Active Fire</span>
        </span>
        <span className="legend-entry">
          <HatchedRect color={C.redMuted} />
          <span>Period between suppression of the main fronts and full suppression</span>
        </span>
        <span className="legend-entry">
          <FilledSquare color={C.blue} />
          <span>Flood and extreme rainfall</span>
        </span>
        <span className="legend-entry">
          <HatchedRect color={C.greyLight} />
          <span>Forestry Service works</span>
        </span>
      </div>

      {/* Row 2 */}
      <div className="legend-row">
        <span className="legend-entry">
          <HashSymbol color={C.blueDark} />
          <span>Legislation changes</span>
        </span>
        <span className="legend-entry">
          <HashSymbol color={C.green} />
          <span>Legislation changes about forest management</span>
        </span>
        <span className="legend-entry">
          <TargetCircle color={C.textBlue} />
          <span>Elections</span>
        </span>
      </div>

      {/* Row 3: section header */}
      <div className="legend-row legend-section-label">
        Announcements-Events-Meetings organised by
      </div>

      {/* Rows 4–9: dual-symbol entries */}
      <div className="legend-row">
        <span className="legend-entry">
          <FilledSquare color={C.greenLight} />
          <StrokeCircle color={C.greenLight} />
          <span>civil society</span>
        </span>
      </div>
      <div className="legend-row">
        <span className="legend-entry">
          <FilledSquare color={C.blueMid} />
          <FilledCircle color={C.blueMid} />
          <span>central greek government</span>
        </span>
      </div>
      <div className="legend-row">
        <span className="legend-entry">
          <FilledSquare color={C.blueDark} />
          <FilledCircle color={C.blueDark} />
          <span>regional government &amp; local municipalities</span>
        </span>
      </div>
      <div className="legend-row">
        <span className="legend-entry">
          <StrokeSquare color={C.textBlue} />
          <StrokeCircle color={C.textBlue} />
          <span>other official state agencies</span>
        </span>
      </div>
      <div className="legend-row">
        <span className="legend-entry">
          <FilledSquare color={C.blueLight} />
          <FilledCircle color={C.blueLight} />
          <span>Meetings-Events organised by &lsquo;DIAZOMA&rsquo;</span>
        </span>
      </div>
      <div className="legend-row">
        <span className="legend-entry">
          <HatchedRect color={C.blueLight} />
          <FilledCircle color={C.grey} />
          <span>Contracts signed between &lsquo;DIAZOMA&rsquo;, donors &amp; consultant agencies</span>
        </span>
      </div>

      {/* Row 10 */}
      <div className="legend-row">
        <span className="legend-entry">
          <AtSymbol color={C.textBlue} />
          <span>Announcements-Events-Actions by private entities</span>
        </span>
      </div>

      {/* Row 11 */}
      <div className="legend-row">
        <span className="legend-entry">
          <HatchedRect color={C.grey} />
          <span>Spatial Planning Phases</span>
        </span>
      </div>
    </section>
  );
}
