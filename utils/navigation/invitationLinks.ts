export function invitationIdFromLink(value: string) {
  const match = value.match(
    /^supplyed:\/\/job-invitations\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i,
  );
  return match?.[1] || '';
}

export function invitationIdFromMessage(value: string) {
  return (
    invitationMessageParts(value).find(part => part.invitationId)
      ?.invitationId || ''
  );
}

export function invitationMessageParts(value: string) {
  const pattern =
    /(^|[\s(])\/job-invitations\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?=$|[\s)]|[.,!?](?=\s|$))/gi;
  const result: { text: string; invitationId?: string }[] = [];
  let offset = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    const start = match.index + match[1].length;
    if (start > offset) result.push({ text: value.slice(offset, start) });
    result.push({ text: 'View invitation', invitationId: match[2] });
    offset = pattern.lastIndex;
  }
  if (offset < value.length) result.push({ text: value.slice(offset) });
  return result;
}
