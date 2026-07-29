import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse') as {
  PDFParse: new (opts: { data: Buffer }) => {
    getText: () => Promise<{ text: string }>;
    destroy: () => Promise<void>;
  };
};

/** Collapse spaced ALL-CAPS like "У Ч И Н Ч И" → "УЧИНЧИ". */
export function collapseSpacedCaps(text: string): string {
  return text.replace(/\b([А-ЯЁЎҚҒҲA-Z])\s+(?=[А-ЯЁЎҚҒҲA-Z]\b)/g, '$1');
}

/** Drop common OCR/PDF noise: page footers, ziyouz stamps, lone page numbers. */
export function cleanExtractedText(raw: string): string {
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, ' ').trimEnd());
  const kept: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      kept.push('');
      continue;
    }
    if (/^https?:\/\//i.test(t)) continue;
    if (/ziyouz\.com/i.test(t)) continue;
    if (/^–\s*\d+\s*–$/.test(t)) continue;
    if (/^--\s*\d+\s*(of|из)\s*\d+\s*--$/i.test(t)) continue;
    if (/^\d{1,3}$/.test(t)) continue;
    if (/^Саҳифа\s*\d+/i.test(t)) continue;
    if (/^Shamoili Muhammadiy\.\s*Muhammad at-Termiziy$/i.test(t)) continue;
    if (/^www\.ziyouz\.com\s+kutubxonasi\s+\d*$/i.test(t)) continue;
    kept.push(line);
  }
  let text = collapseSpacedCaps(kept.join('\n').replace(/\n{3,}/g, '\n\n'));
  // Spaced single-letter titles collapse into one token — restore known phrases.
  text = text.replace(/УЧИНЧИБОСҚИЧ/g, 'УЧИНЧИ БОСҚИЧ');
  return text;
}

export async function extractPdfText(pdfPath: string): Promise<string> {
  const data = readFileSync(pdfPath);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return cleanExtractedText(result.text ?? '');
  } finally {
    await parser.destroy();
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Join PDF soft-wrapped lines into logical paragraphs.
 *
 * PDF extractors break every ~80 chars with `\n`, but real paragraph
 * boundaries only appear after sentence-ending punctuation (. » ! ? :)
 * followed by a newline where the next line starts a new sentence
 * (capital Cyrillic/Latin letter, digit, or quote).
 */
function joinSoftWraps(text: string): string {
  const lines = text.split('\n');
  const paragraphs: string[] = [];
  let buffer = '';

  for (const raw of lines) {
    const line = raw.replace(/\t+/g, ' ').replace(/[ \u00a0]{2,}/g, ' ').trim();

    if (!line) {
      if (buffer) {
        paragraphs.push(buffer);
        buffer = '';
      }
      continue;
    }

    if (!buffer) {
      buffer = line;
      continue;
    }

    const endsWithSentence = /[.!?»;:]\s*\d*\s*$/.test(buffer);
    const startsNewSentence = /^[A-ZА-ЯЁЎҚҒҲ«"\d]/.test(line);

    if (endsWithSentence && startsNewSentence) {
      paragraphs.push(buffer);
      buffer = line;
    } else {
      buffer += ' ' + line;
    }
  }
  if (buffer) paragraphs.push(buffer);

  return paragraphs.join('\n\n');
}

/** Strip footnote numbers like `70 .` or `70.` embedded in text. */
function cleanFootnotes(text: string): string {
  return text.replace(/(\S)\s*\d{1,3}\s*\.\s*(?=[А-ЯЁЎҚҒҲA-Z«])/g, '$1. ');
}

/** Plain chapter text → sanitized-friendly HTML paragraphs. */
export function textToChapterHtml(body: string): string {
  let normalized = cleanFootnotes(body.trim());
  normalized = joinSoftWraps(normalized);

  if (!normalized) {
    return '<p></p>';
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return `<p>${escapeHtml(normalized)}</p>`;
  }

  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
}
