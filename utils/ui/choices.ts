// Forms keep text values so their existing onChange props stay simple.
// JSON preserves names containing commas; older comma-separated forms still load.
export function readChoices(value: string): string[] {
  if (!value.trim()) return [];
  if (value.startsWith('[')) {
    try {
      const list = JSON.parse(value);
      if (Array.isArray(list))
        return list.filter(item => typeof item === 'string');
    } catch {
      /* Read older saved text below. */
    }
  }
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

export function writeChoices(values: string[]) {
  return values.length ? JSON.stringify(values) : '';
}

export function choiceText(value: string) {
  return readChoices(value).join(', ');
}
