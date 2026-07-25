import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'a',
  'span',
];

export function sanitizeChapterBody(body: string, bodyFormat: 'html' | 'markdown'): string {
  if (bodyFormat === 'markdown') {
    // Keep markdown source; strip any embedded HTML tags.
    return sanitizeHtml(body, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  return sanitizeHtml(body, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      span: ['dir', 'lang'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  });
}
