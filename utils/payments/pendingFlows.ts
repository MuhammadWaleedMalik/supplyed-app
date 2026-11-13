import * as Keychain from 'react-native-keychain';

export type PaymentFlowInput =
  | {
      kind: 'school-card';
      sessionId: string;
      expiresAt: number | string | null;
      replacingCard?: boolean;
    }
  | { kind: 'tip'; bookingId: string; tipId: string; sessionId: string }
  | { kind: 'invoice'; invoiceId: string }
  | { kind: 'teacher-onboarding' };

export type PendingPaymentFlow = PaymentFlowInput & {
  version: 1;
  flowId: string;
  userId: string;
  createdAt: string;
};

let storageQueue: Promise<unknown> = Promise.resolve();
const listeners = new Set<() => void>();

export function onPaymentFlowsChanged(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function changed() {
  listeners.forEach(listener => listener());
}
function service(userId: string) {
  return 'com.supplyed.payment-flows.' + encodeURIComponent(userId);
}

function reference(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 300 &&
    /^[a-zA-Z0-9_-]+$/.test(value)
  );
}

// Explicitly copy references only. Checkout URLs and client secrets never enter storage.
export function paymentFlowReferences(
  input: PaymentFlowInput,
): PaymentFlowInput {
  switch (input.kind) {
    case 'school-card': {
      if (!reference(input.sessionId)) break;
      const expiry = input.expiresAt;
      if (
        expiry !== null &&
        (typeof expiry !== 'number' || !Number.isFinite(expiry))
      ) {
        if (typeof expiry !== 'string' || !Number.isFinite(Date.parse(expiry)))
          break;
      }
      return {
        kind: input.kind,
        sessionId: input.sessionId,
        expiresAt: expiry,
        ...(input.replacingCard ? { replacingCard: true } : {}),
      };
    }
    case 'tip':
      if (
        reference(input.bookingId) &&
        reference(input.tipId) &&
        reference(input.sessionId)
      )
        return {
          kind: input.kind,
          bookingId: input.bookingId,
          tipId: input.tipId,
          sessionId: input.sessionId,
        };
      break;
    case 'invoice':
      if (reference(input.invoiceId))
        return { kind: input.kind, invoiceId: input.invoiceId };
      break;
    case 'teacher-onboarding':
      return { kind: input.kind };
  }
  throw new Error(
    'The payment reference is invalid. Refresh before trying again.',
  );
}

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageQueue.catch(() => {}).then(operation);
  storageQueue = result;
  return result;
}

async function read(userId: string): Promise<PendingPaymentFlow[]> {
  const saved = await Keychain.getGenericPassword({ service: service(userId) });
  if (!saved) return [];
  const parsed: unknown = JSON.parse(saved.password);
  if (!Array.isArray(parsed))
    throw new Error('Saved payment recovery data could not be read.');
  return parsed.map((item: PendingPaymentFlow) => {
    if (
      !item ||
      item.version !== 1 ||
      item.userId !== userId ||
      !reference(item.flowId) ||
      !Number.isFinite(Date.parse(item.createdAt))
    )
      throw new Error('Saved payment recovery data could not be read.');
    return {
      ...paymentFlowReferences(item),
      version: 1,
      userId,
      flowId: item.flowId,
      createdAt: item.createdAt,
    };
  });
}

async function write(userId: string, flows: PendingPaymentFlow[]) {
  const result = await Keychain.setGenericPassword(
    'payment-references',
    JSON.stringify(flows),
    {
      service: service(userId),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
  if (!result)
    throw new Error(
      'Payment recovery could not be saved. Please try again before opening Stripe.',
    );
  changed();
}

export function loadPaymentFlows(userId: string) {
  return serialize(() => read(userId));
}

export function persistPaymentFlow(flow: PendingPaymentFlow) {
  return serialize(async () => {
    const flows = await read(flow.userId);
    const existing = flows.find(
      item =>
        item.kind === flow.kind &&
        (item.kind === 'school-card' && flow.kind === 'school-card'
          ? item.sessionId === flow.sessionId
          : item.kind === 'tip' && flow.kind === 'tip'
          ? item.tipId === flow.tipId && item.sessionId === flow.sessionId
          : item.kind === 'invoice' && flow.kind === 'invoice'
          ? item.invoiceId === flow.invoiceId
          : item.kind === 'teacher-onboarding' &&
            flow.kind === 'teacher-onboarding'),
    );
    if (existing) return existing;
    await write(flow.userId, [
      ...flows.filter(item => item.flowId !== flow.flowId),
      flow,
    ]);
    return flow;
  });
}

export function removePaymentFlow(userId: string, flowId: string) {
  return serialize(async () => {
    const flows = await read(userId);
    if (flows.some(item => item.flowId === flowId))
      await write(
        userId,
        flows.filter(item => item.flowId !== flowId),
      );
  });
}
