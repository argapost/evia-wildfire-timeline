/**
 * Pure layout engine for the Evia Meta reconstruction presentation deck.
 * Each slide is a function that takes projects + viewport dimensions
 * and returns position/style data for every bar.
 */

import type { EvoiaMetaProject } from './schema';
import {
  CATEGORY_LABELS,
  CATEGORY_SHADES,
  COLUMN_CATEGORY_ORDER,
  FONT_DISPLAY,
  LABEL_CHAR_HEIGHT_FACTOR
} from './presentation-constants';

export type BarLayout = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  tag: string;
  tagX: number;
  tagY: number;
  title: string;
  titleX: number;
  titleY: number;
  titleVisible: boolean;
  tagFontSize: number;
  titleFontSize: number;
};

export type CategoryLabelLayout = {
  category: string;
  label: string;
  x: number;
  y: number;
  height: number;
  fontSize: number;
};

export type SlideLayout = {
  bars: BarLayout[];
  categoryLabels: CategoryLabelLayout[];
  titleText: string;
  titleFontFamily: string;
  titleFontSize: number;
  titleX: number;
  titleY: number;
};

function compareTags(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function truncateTitle(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, Math.max(1, maxChars - 1))}\u2026`;
}

/** Compute the vertical extent of a rotated label at the given font size */
function labelVerticalExtent(label: string, fontSize: number): number {
  return label.length * fontSize * LABEL_CHAR_HEIGHT_FACTOR;
}

/**
 * For a given label font size, compute the total height needed by each column.
 * Each category group's height = max(barsHeight, labelHeight).
 * Returns [col0Height, col1Height, col2Height].
 */
function computeColumnHeights(
  grouped: Map<string, EvoiaMetaProject[]>,
  labelFontSize: number,
  barHeight: number,
  barGap: number,
  categoryGap: number
): number[] {
  const heights: number[] = [];

  for (const categories of COLUMN_CATEGORY_ORDER) {
    let colHeight = 0;
    let visibleCount = 0;

    for (const category of categories) {
      const count = grouped.get(category)?.length ?? 0;
      if (count === 0) continue;

      if (visibleCount > 0) colHeight += categoryGap;

      const barsHeight = count * barHeight + (count - 1) * barGap;
      const label = CATEGORY_LABELS[category] ?? category.toUpperCase();
      const lblHeight = labelVerticalExtent(label, labelFontSize);
      colHeight += Math.max(barsHeight, lblHeight);
      visibleCount++;
    }

    heights.push(colHeight);
  }

  return heights;
}

export function computeSlide1Layout(
  projects: EvoiaMetaProject[],
  viewportWidth: number,
  viewportHeight: number
): SlideLayout {
  // --- Filter: only A-tagged projects (exclude B-tagged) ---
  const filtered = projects.filter((p) => !p.tag.startsWith('B'));

  // --- Margins and title area ---
  const marginX = Math.round(viewportWidth * 0.05);
  const marginTop = Math.round(viewportHeight * 0.035);
  const marginBottom = Math.round(viewportHeight * 0.03);

  const titleFontSize = Math.max(20, Math.min(48, Math.round(viewportWidth * 0.022)));
  const titleAreaHeight = titleFontSize + Math.round(viewportHeight * 0.025);

  const contentTop = marginTop + titleAreaHeight;
  const contentHeight = viewportHeight - contentTop - marginBottom;
  const contentWidth = viewportWidth - marginX * 2;

  const columnGap = Math.round(contentWidth * 0.025);
  const numColumns = 3;
  const totalColumnWidth = contentWidth - columnGap * (numColumns - 1);
  const columnWidth = totalColumnWidth / numColumns;

  // --- Group projects by category, sort by tag within each group ---
  const grouped = new Map<string, EvoiaMetaProject[]>();
  for (const project of filtered) {
    const list = grouped.get(project.category) ?? [];
    list.push(project);
    grouped.set(project.category, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => compareTags(a.tag, b.tag));
  }

  // --- Tag and label sizing (independent of bar height) ---
  const tagWidth = Math.max(28, Math.round(columnWidth * 0.08));
  const tagGap = Math.max(4, Math.round(columnWidth * 0.015));
  const categoryLabelWidth = Math.max(20, Math.round(columnWidth * 0.06));
  const barWidth = columnWidth - tagWidth - tagGap - categoryLabelWidth;

  const categoryGap = Math.round(contentHeight * 0.018);
  const barGap = Math.max(1, Math.round(contentHeight * 0.003));

  // --- Find label font size and bar height that fit contentHeight ---
  // Strategy: try a label font size, compute resulting bar height from tallest column.
  // The tallest column's height is driven by the sum of group heights where each
  // group = max(barsHeight, labelHeight). We solve for barHeight such that the
  // tallest column fits exactly in contentHeight.

  const labelFontSize = Math.max(16, Math.min(44, Math.round(contentHeight * 0.032)));

  // Binary-search for barHeight that makes the tallest column fit contentHeight
  let barHeightLow = 6;
  let barHeightHigh = 40;
  let barHeight = 20;

  for (let i = 0; i < 20; i++) {
    barHeight = (barHeightLow + barHeightHigh) / 2;
    const colHeights = computeColumnHeights(grouped, labelFontSize, barHeight, barGap, categoryGap);
    const maxColHeight = Math.max(...colHeights);

    if (maxColHeight > contentHeight) {
      barHeightHigh = barHeight;
    } else {
      barHeightLow = barHeight;
    }
  }

  barHeight = Math.floor(barHeightLow);
  barHeight = Math.max(6, Math.min(30, barHeight));

  const tagFontSize = Math.max(8, Math.min(16, Math.round(barHeight * 0.75)));
  const titleFontSizeBar = Math.max(7, Math.min(14, Math.round(barHeight * 0.62)));

  // Approximate characters that fit inside the bar
  const charWidth = titleFontSizeBar * 0.48;
  const barPaddingX = Math.max(4, Math.round(barWidth * 0.015));
  const maxTitleChars = Math.max(0, Math.floor((barWidth - barPaddingX * 2) / charWidth));

  // --- Place bars ---
  const bars: BarLayout[] = [];
  const categoryLabels: CategoryLabelLayout[] = [];

  for (let colIndex = 0; colIndex < numColumns; colIndex++) {
    const colX = marginX + colIndex * (columnWidth + columnGap);
    const categories = COLUMN_CATEGORY_ORDER[colIndex];
    let yOffset = contentTop;
    let visibleCatIdx = 0;

    for (const category of categories) {
      const catProjects = grouped.get(category) ?? [];
      if (catProjects.length === 0) continue;

      if (visibleCatIdx > 0) {
        yOffset += categoryGap;
      }

      const groupStartY = yOffset;
      const shade = CATEGORY_SHADES[category] ?? '#e4e7ed';

      // Compute group height (bars vs label)
      const barsHeight = catProjects.length * barHeight + (catProjects.length - 1) * barGap;
      const label = CATEGORY_LABELS[category] ?? category.toUpperCase();
      const lblHeight = labelVerticalExtent(label, labelFontSize);
      const groupHeight = Math.max(barsHeight, lblHeight);

      // Center bars vertically within the group if label is taller
      const barsOffsetY = (groupHeight - barsHeight) / 2;

      for (let i = 0; i < catProjects.length; i++) {
        const project = catProjects[i];
        const barX = colX + tagWidth + tagGap;
        const barY = yOffset + barsOffsetY + i * (barHeight + barGap);

        bars.push({
          id: project.id,
          x: barX,
          y: barY,
          width: barWidth,
          height: barHeight,
          fill: shade,
          tag: project.tag,
          tagX: colX + tagWidth,
          tagY: barY + barHeight / 2,
          title: truncateTitle(project.displayTitle, maxTitleChars),
          titleX: barX + barPaddingX,
          titleY: barY + barHeight / 2,
          titleVisible: maxTitleChars >= 4,
          tagFontSize,
          titleFontSize: titleFontSizeBar
        });
      }

      // Category label: rotated 90° CW, centered on group
      const labelX = colX + tagWidth + tagGap + barWidth + categoryLabelWidth / 2;
      const labelY = groupStartY + groupHeight / 2;

      categoryLabels.push({
        category,
        label,
        x: labelX,
        y: labelY,
        height: groupHeight,
        fontSize: labelFontSize
      });

      yOffset += groupHeight;
      visibleCatIdx++;
    }
  }

  return {
    bars,
    categoryLabels,
    titleText: 'ANNOUNCED PROJECTS',
    titleFontFamily: FONT_DISPLAY,
    titleFontSize,
    titleX: marginX,
    titleY: marginTop + titleFontSize * 0.88
  };
}

export function computeSlideLayout(
  projects: EvoiaMetaProject[],
  viewportWidth: number,
  viewportHeight: number,
  slideIndex: number
): SlideLayout {
  // Only Slide 1 implemented for now; future slides will be added here.
  return computeSlide1Layout(projects, viewportWidth, viewportHeight);
}
