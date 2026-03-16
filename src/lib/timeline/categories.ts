import { categoryValues } from '@/lib/data/schemas';
import type { TimelineEvent } from './types';

const categoryPalette: Partial<Record<TimelineEvent['category'], string>> = {
  wildfire: '#c54644',
  'fire-season': '#c54644',
  suppression: '#b85f5c',
  evacuation: '#d7b9a4',
  weather: '#4f60ad',
  flood: '#5f72ba',
  'forestry-policy': '#84b87b',
  legislation: '#334496',
  'spatial-planning':     { point: '_spatialplanning-phase1.svg',                         duration: '_spatialplanning-phase1.svg' },
  'major-political-event': { point: '_majorpoliticalevent.svg',                            duration: '_majorpoliticalevent-morethan1day.svg' },
  'forestry-works':         { point: '_forestryserviceworks1dayevent.svg',                   duration: '_forestryserviceworks.svg' },
  'reconstruction-governance': '#8a95bf',
  contract: '#7376c6',
  donation: '#aab1c4',
  'municipal-action': '#273891',
  'state-agency-action': '#646f93',
  'civil-society-action': '#84b87b',
  protest: '#84b87b',
  election: '#5867a8',
  'private-actor': '#98a0b8',
  'study-report': '#a3abc0',
  infrastructure: '#6d78a8',
  'major-political-event': '#334496',
  'forestry-works': '#84b87b'
};

const categoryNameMap: Record<TimelineEvent['category'], string> = {
  wildfire: 'Fire',
  'fire-season': 'Fire Season',
  suppression: 'Suppression',
  evacuation: 'Evacuation',
  weather: 'Weather',
  flood: 'Flood',
  'forestry-policy': 'Forestry Policy',
  legislation: 'Legislation',
  'spatial-planning':     { point: '_spatialplanning-phase1.svg',                         duration: '_spatialplanning-phase1.svg' },
  'major-political-event': { point: '_majorpoliticalevent.svg',                            duration: '_majorpoliticalevent-morethan1day.svg' },
  'forestry-works':         { point: '_forestryserviceworks1dayevent.svg',                   duration: '_forestryserviceworks.svg' },
  'reconstruction-governance': 'Reconstruction Governance',
  contract: 'Contract',
  donation: 'Donation',
  'municipal-action': 'Municipal Action',
  'state-agency-action': 'State Agency Action',
  'civil-society-action': 'Civil Society Action',
  protest: 'Protest',
  election: 'Election',
  'private-actor': 'Private Actor',
  'study-report': 'Study Report',
  infrastructure: 'Infrastructure',
  'major-political-event': 'Major Political Event',
  'forestry-works': 'Forestry Service Works'
};

// Maps each category to its legend SVG files:
// point = single-day event icon (16×16), duration = multi-day bar icon (24×14)
const symbolSvgMap: Partial<Record<TimelineEvent['category'], { point: string; duration: string }>> = {
  wildfire:               { point: '_activefire.svg',                                    duration: '_activefire.svg' },
  suppression:            { point: '_periduntilfullsuppression.svg',                     duration: '_periduntilfullsuppression.svg' },
  flood:                  { point: '_flood.svg',                                         duration: '_flood.svg' },
  'forestry-policy':      { point: '_legislationchangesforestmanagement.svg',            duration: '_legislationchangesforestmanagement.svg' },
  legislation:            { point: '_legislationchanges.svg',                             duration: '_legislationchanges.svg' },
  election:               { point: '_generalelections.svg',                               duration: '_generalelections.svg' },
  'civil-society-action': { point: '_civilsociety.svg',                                   duration: '_civilsocitey-morethan1day.svg' },
  protest:                { point: '_civilsociety.svg',                                   duration: '_civilsocitey-morethan1day.svg' },
  'state-agency-action':  { point: '_otherstateagencies1dayevent.svg',                    duration: '_otherstateagencies-morethanoneday.svg' },
  'reconstruction-governance': { point: '_centralgreekgovernment1dayevent.svg',           duration: '_centralgreekgovernment-morethan1day.svg' },
  'municipal-action':     { point: '_regionalgovernmentandlocalmunicipalites1dayevent.svg', duration: '_regionalgovernmentlocalmunicipalities-morethan1day.svg' },
  contract:               { point: '_contractdiazoma1dayevent.svg',                       duration: '_contractssigningduration.svg' },
  donation:               { point: '_contractdiazoma1dayevent.svg',                       duration: '_contractssigningduration.svg' },
  'private-actor':        { point: '_announcementprivateentities1dayevent.svg',            duration: '_announcementprivateentities1dayevent.svg' },
  'spatial-planning':     { point: '_spatialplanning-phase1.svg',                         duration: '_spatialplanning-phase1.svg' },
  'major-political-event': { point: '_majorpoliticalevent.svg',                            duration: '_majorpoliticalevent-morethan1day.svg' },
  'forestry-works':         { point: '_forestryserviceworks1dayevent.svg',                   duration: '_forestryserviceworks.svg' },
};

const fallbackColor = '#8a92a5';

export const categoryOrder: TimelineEvent['category'][] = [...categoryValues];
export type CategorySymbol = 'circle' | 'square' | 'diamond' | 'triangle';

const symbolCycle: CategorySymbol[] = ['circle', 'square', 'diamond', 'triangle'];
const categorySymbolMap: Record<TimelineEvent['category'], CategorySymbol> = Object.fromEntries(
  categoryOrder.map((category, index) => [category, symbolCycle[index % symbolCycle.length]])
) as Record<TimelineEvent['category'], CategorySymbol>;

export function getCategoryColor(category: TimelineEvent['category']): string {
  return categoryPalette[category] ?? fallbackColor;
}

export function getCategoryLabel(category: TimelineEvent['category']): string {
  return categoryNameMap[category] ?? category;
}

export function getCategorySymbol(category: TimelineEvent['category']): CategorySymbol {
  return categorySymbolMap[category] ?? 'circle';
}

/**
 * Returns the SVG icon path for a given category.
 * `isDuration` selects between the point (1-day) and duration (multi-day) variant.
 */
export function getCategorySvgIcon(category: TimelineEvent['category'], isDuration: boolean): string {
  const entry = symbolSvgMap[category];
  if (!entry) return '_otherstateagencies1dayevent.svg';
  return isDuration ? entry.duration : entry.point;
}

const spatialPlanningIcons: Record<string, string> = {
  'phase-i': '_spatialplanning-phase1.svg',
  'phase-ii': '_spatialplanning-phase2.svg',
  'phase-iii': '_spatialplanning-completed.svg',
};

/**
 * Resolves the correct SVG icon for an event, applying per-event overrides
 * for forestry service, spatial planning, Diazoma, and civil society events.
 */
export function resolveEventIcon(event: TimelineEvent, hasDuration: boolean): string {
  if (event.slug === 'works-by-the-forestry-service')
    return hasDuration ? '_forestryserviceworks.svg' : '_forestryserviceworks1dayevent.svg';
  if (event.summary.includes('Special Urban Planning'))
    return spatialPlanningIcons[event.slug] ?? '_spatialplanning-phase1.svg';
  if (event.id === 'evia-2021-announcement-meeting-event-by-local-municipalities-1')
    return hasDuration ? '_civilsocitey-morethan1day.svg' : '_civilsociety.svg';
  if (event.slug === 'announcements-events-meetings-works-by-diazoma'
    || (event.slug === 'open-meeting' && event.actors.includes('actor-diazoma')))
    return hasDuration ? '_diazomaevents-morethan1day.svg' : '_diazomaevents1dayevent.svg';
  return getCategorySvgIcon(event.category, hasDuration);
}