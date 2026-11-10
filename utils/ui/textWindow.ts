// Bound native text layout work even when an API returns an oversized field.
export const TEXT_PAGE_SIZE = 8000;
export const RICH_TEXT_LIMIT = 100000;

function boundary(text: string, offset: number) {
  const position = Math.min(text.length, Math.max(0, offset));
  const current = text.charCodeAt(position);
  const previous = text.charCodeAt(position - 1);
  return current >= 0xdc00 && current <= 0xdfff && previous >= 0xd800 && previous <= 0xdbff
    ? position - 1
    : position;
}

export function textPreview(text: string, limit = 600) {
  return text.length > limit ? text.slice(0, boundary(text, limit)) + '…' : text;
}

export function textPage(text: string, requestedPage: number) {
  const count = Math.max(1, Math.ceil(text.length / TEXT_PAGE_SIZE));
  const page = Math.max(0, Math.min(count - 1, Math.floor(requestedPage) || 0));
  return {
    page,
    count,
    text: text.slice(boundary(text, page * TEXT_PAGE_SIZE), boundary(text, (page + 1) * TEXT_PAGE_SIZE)),
  };
}
