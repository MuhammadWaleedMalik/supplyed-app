import { Parser } from 'htmlparser2';

export const ignoredRichTextTags = [
  'head',
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'img',
  'video',
  'audio',
];

const blockTags = new Set([
  'p',
  'div',
  'li',
  'ul',
  'ol',
  'blockquote',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'tr',
]);

export function hasRichTextMarkup(value: string) {
  return /<\/?[a-z][a-z0-9-]*[\s/>]/i.test(value);
}

// Parse before decoding entities so literal encoded angle brackets stay text.
export function richTextToPlainText(value?: string | null): string {
  if (!value) return '';
  let text = '';
  let ignoredDepth = 0;
  const parser = new Parser(
    {
      onopentag(name) {
        if (ignoredDepth || ignoredRichTextTags.includes(name)) {
          ignoredDepth += 1;
          return;
        }
        if (name === 'br' || blockTags.has(name)) text += '\n';
        if (name === 'td' || name === 'th') text += ' ';
      },
      ontext(content) {
        if (!ignoredDepth) text += content;
      },
      onclosetag(name) {
        if (ignoredDepth) {
          ignoredDepth -= 1;
          return;
        }
        if (blockTags.has(name)) text += '\n';
      },
    },
    { decodeEntities: true },
  );
  parser.end(value);
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
