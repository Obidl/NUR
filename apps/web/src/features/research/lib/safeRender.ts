import DOMPurify from 'dompurify';

export function renderSafeResearchHtml(body: string, bodyFormat: 'html' | 'markdown'): string {
  if (bodyFormat === 'markdown') {
    const escaped = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped
      .split(/\n\n+/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
      .join('');
  }

  return DOMPurify.sanitize(body, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  });
}
