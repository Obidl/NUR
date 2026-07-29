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
    if (/^\d{1,3}$/.test(t)) continue;
    if (/^Саҳифа\s*\d+/i.test(t)) continue;
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

/** Plain chapter text → sanitized-friendly HTML paragraphs. */
export function textToChapterHtml(body: string): string {
  const normalized = body
    .replace(/\t+/g, ' ')
    .replace(/[ \u00a0]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!normalized) {
    return '<p></p>';
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return `<p>${escapeHtml(normalized)}</p>`;
  }

  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
}
