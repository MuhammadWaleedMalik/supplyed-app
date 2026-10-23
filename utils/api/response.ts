export type FieldErrors = Record<string, string[]>;

export type ParsedApiReply = {
  envelope: boolean;
  hasData: boolean;
  data: unknown;
  message?: string | string[];
  code?: string;
  success?: boolean;
  requestId?: string;
  fieldErrors?: FieldErrors;
};

function stringArray(value: unknown): string[] | undefined {
  if (typeof value === 'string') return [value];
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter(
    (item): item is string => typeof item === 'string',
  );
  return strings.length ? strings : undefined;
}

function parseFieldErrors(value: unknown): FieldErrors | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const result: FieldErrors = {};
  for (const [field, error] of Object.entries(value)) {
    const messages = stringArray(error);
    if (messages) result[field] = messages;
  }
  return Object.keys(result).length ? result : undefined;
}

/**
 * Backend deployments in the handoff return either the standard SupplyEd
 * envelope or the endpoint's payload directly. Keep that distinction in one
 * place so feature adapters never unwrap a response twice.
 */
export function parseApiReply(value: unknown): ParsedApiReply {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      envelope: false,
      hasData: true,
      data: value,
    };
  }

  const record = value as Record<string, unknown>;
  const envelope =
    typeof record.success === 'boolean' ||
    ('data' in record &&
      (typeof record.statusCode === 'number' ||
        typeof record.message === 'string' ||
        Array.isArray(record.message) ||
        'meta' in record));
  const meta =
    record.meta && typeof record.meta === 'object' && !Array.isArray(record.meta)
      ? (record.meta as Record<string, unknown>)
      : undefined;

  return {
    envelope,
    hasData: envelope ? 'data' in record : true,
    data: envelope ? record.data : value,
    success:
      typeof record.success === 'boolean' ? record.success : undefined,
    message:
      typeof record.message === 'string'
        ? record.message
        : stringArray(record.message),
    code: typeof record.code === 'string' ? record.code : undefined,
    requestId:
      typeof meta?.requestId === 'string'
        ? meta.requestId
        : typeof record.requestId === 'string'
        ? record.requestId
        : undefined,
    fieldErrors: parseFieldErrors(record.fieldErrors),
  };
}

export function apiErrorMessage(reply: ParsedApiReply) {
  return Array.isArray(reply.message)
    ? reply.message.join(', ')
    : reply.message || 'Something went wrong. Please try again.';
}

export function joinApiPath(baseUrl: string, path: string) {
  if (!path.startsWith('/') || path.startsWith('//'))
    throw new Error('API paths must start with one slash.');
  return baseUrl.replace(/\/+$/, '') + path;
}
