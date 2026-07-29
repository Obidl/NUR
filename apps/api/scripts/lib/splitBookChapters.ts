export type ChapterMarker = {
  /** Display title in the reader. */
  title: string;
  /** Latin slug unique within the book. */
  slug: string;
  /**
   * Marker text as it appears in the PDF (usually ALL-CAPS).
   * Whitespace (including newlines) is flexible between tokens.
   */
  match: string;
  /** 1-based occurrence when the same match appears more than once. Default 1. */
  occurrence?: number;
};

export type SplitChapter = {
  title: string;
  slug: string;
  order: number;
  body: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function markerRegex(match: string): RegExp {
  const parts = match.trim().split(/\s+/).map(escapeRegExp);
  return new RegExp(parts.join('\\s+'), 'g');
}

function findOccurrence(haystack: string, match: string, occurrence: number): number {
  const re = markerRegex(match);
  let found = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(haystack)) !== null) {
    found += 1;
    if (found === occurrence) return m.index;
  }
  return -1;
}

/**
 * Split cleaned book text by ordered chapter markers.
 * Skips empty section headers by merging into the next chapter title.
 */
export function splitByMarkers(text: string, markers: ChapterMarker[]): SplitChapter[] {
  type Hit = ChapterMarker & { index: number; matchLength: number };

  const hits: Hit[] = [];
  for (const marker of markers) {
    const occurrence = marker.occurrence ?? 1;
    const index = findOccurrence(text, marker.match, occurrence);
    if (index < 0) {
      throw new Error(`Chapter marker not found (occurrence ${occurrence}): ${marker.match}`);
    }
    const re = markerRegex(marker.match);
    re.lastIndex = index;
    const m = re.exec(text);
    hits.push({ ...marker, index, matchLength: m?.[0].length ?? marker.match.length });
  }

  hits.sort((a, b) => a.index - b.index);

  // Drop overlapping earlier shorter hits that land on the same start.
  const unique: Hit[] = [];
  for (const hit of hits) {
    const prev = unique[unique.length - 1];
    if (prev && hit.index < prev.index + prev.matchLength) {
      throw new Error(`Overlapping markers: "${prev.match}" vs "${hit.match}"`);
    }
    unique.push(hit);
  }

  const raw: SplitChapter[] = [];
  for (let i = 0; i < unique.length; i += 1) {
    const hit = unique[i]!;
    const start = hit.index + hit.matchLength;
    const end = i + 1 < unique.length ? unique[i + 1]!.index : text.length;
    const body = text.slice(start, end).trim();
    raw.push({
      title: hit.title,
      slug: hit.slug,
      order: i + 1,
      body,
    });
  }

  // Merge near-empty section headers into the next chapter.
  const merged: SplitChapter[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i]!;
    if (ch.body.length < 120 && i + 1 < raw.length) {
      const next = raw[i + 1]!;
      next.title = `${ch.title} — ${next.title}`;
      continue;
    }
    merged.push(ch);
  }

  return merged.map((ch, idx) => ({ ...ch, order: idx + 1 }));
}
