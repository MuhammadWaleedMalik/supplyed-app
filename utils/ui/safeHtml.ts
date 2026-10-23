/* eslint-disable no-control-regex -- Reject invisible control characters in user input. */
import { Parser } from 'htmlparser2';
import { hasRichTextMarkup, ignoredRichTextTags } from './richText';

export const editorFonts = ['Arial', 'Georgia', 'Times New Roman'];
export const editorSizes = ['12px', '14px', '16px', '18px', '20px', '24px'];
export const editorColors = [
  '#17211c',
  '#227557',
  '#315ca8',
  '#7a4a9e',
  '#a1483f',
];
const tags = [
  'a',
  'b',
  'br',
  'em',
  'i',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'u',
  'ul',
];

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeLink(value: string) {
  const text = value.trim();
  if (/[\s<>"'\u0000-\u001f]/.test(text)) return '';
  const url =
    /^[^@]+@[^@]+\.[^@]+$/.test(text) && !text.includes(':')
      ? 'mailto:' + text
      : !text.includes(':')
      ? 'https://' + text
      : text;
  if (/^mailto:[^@]+@[^@]+\.[^@]+$/i.test(url)) return url;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) &&
      parsed.hostname.includes('.')
      ? parsed.href
      : '';
  } catch {
    return '';
  }
}

function safeStyle(value: string) {
  const result: string[] = [];
  for (const declaration of value.split(';')) {
    const [property, raw = ''] = declaration.split(':');
    let text = raw.trim().replace(/["']/g, '');
    const key = property.trim().toLowerCase();
    if (key === 'color') {
      const rgb = text.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
      if (rgb)
        text =
          '#' +
          rgb
            .slice(1)
            .map(channel => Number(channel).toString(16).padStart(2, '0'))
            .join('');
      if (editorColors.includes(text.toLowerCase()))
        result.push('color:' + text.toLowerCase());
    }
    if (key === 'font-family' && editorFonts.includes(text))
      result.push('font-family:' + text);
    if (key === 'font-size' && editorSizes.includes(text))
      result.push('font-size:' + text);
    // WebKit's styleWithCSS represents these as span styles.
    if (key === 'font-weight' && ['bold', '700'].includes(text))
      result.push('font-weight:bold');
    if (key === 'font-style' && text === 'italic')
      result.push('font-style:italic');
    if (key === 'text-decoration' && text.includes('underline'))
      result.push('text-decoration:underline');
  }
  return result.join(';');
}

export function sanitizeHtml(value: string) {
  let html = '';
  let ignored = 0;
  const stack: string[] = [];
  const parser = new Parser(
    {
      onopentag(tag, attributes) {
        if (ignored || ignoredRichTextTags.includes(tag)) {
          ignored++;
          stack.push('');
          return;
        }
        const name = tag === 'div' ? 'p' : tag;
        if (!tags.includes(name)) {
          stack.push('');
          return;
        }
        stack.push(name === 'br' ? '' : name);
        const href = name === 'a' ? safeLink(attributes.href || '') : '';
        const style = safeStyle(attributes.style || '');
        html +=
          '<' +
          name +
          (href ? ' href="' + escapeHtml(href) + '"' : '') +
          (style ? ' style="' + escapeHtml(style) + '"' : '') +
          '>';
      },
      ontext(text) {
        if (!ignored) html += escapeHtml(text);
      },
      onclosetag() {
        const name = stack.pop();
        if (ignored) {
          ignored--;
          return;
        }
        if (name) html += '</' + name + '>';
      },
    },
    { decodeEntities: true },
  );
  parser.end(value);
  return html;
}

export function editorHtml(value: string) {
  if (hasRichTextMarkup(value)) return sanitizeHtml(value);
  return value
    .split('\n')
    .map(line => {
      const text = escapeHtml(line).replace(
        /\*\*(.+?)\*\*/g,
        '<strong>$1</strong>',
      );
      if (/^[-*] /.test(line)) return '<ul><li>' + text.slice(2) + '</li></ul>';
      if (/^#{1,3} /.test(line))
        return '<p><strong>' + text.replace(/^#{1,3} /, '') + '</strong></p>';
      return '<p>' + (text || '<br>') + '</p>';
    })
    .join('');
}
