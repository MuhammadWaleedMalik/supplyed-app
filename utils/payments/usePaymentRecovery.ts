import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import {
  getAccessToken,
  getCurrentSessionUser,
  getSessionVersion,
  onSessionChanged,
} from '../api/session';
import {
  getPendingPaymentFlows,
  reconcilePaymentFlow,
  reconcilePendingPayments,
  savePaymentFlow,
} from './flowCoordinator';
import { paymentReturnFromLink, type PaymentReturn } from './paymentLinks';
import { store } from '../../store';
import { refreshMarketplace } from '../../feature/dashboard/shared/store/navigationSlice';
import {
  syncBookingTip,
  syncSchoolBilling,
} from '../../feature/dashboard/shared/apis/paymentsApi';
import { syncInvoice } from '../../constants/paymentSessionsApi';

type QueuedReturn = { callback: PaymentReturn; ownerId?: string };

// Lives above screens: unresolved provider references survive navigation and process death.
export function usePaymentRecovery() {
  const pendingReturns = useRef<QueuedReturn[]>([]);
  const [returnDestination, setReturnDestination] = useState<
    PaymentReturn['kind'] | null
  >(null);

  useEffect(() => {
    let mounted = true;
    let generation = 0;
    let running: Promise<void> | undefined;
    let rerun = false;
    let activeUser = '';
    const handledLinks = new Set<string>();

    async function recover() {
      if (
        !mounted ||
        AppState.currentState !== 'active' ||
        !getAccessToken() ||
        !getCurrentSessionUser()?.id
      )
        return;
      if (running) {
        rerun = true;
        return;
      }
      const version = getSessionVersion();
      const thisGeneration = generation;
      const valid = () =>
        mounted &&
        version === getSessionVersion() &&
        generation === thisGeneration;
      running = (async () => {
        const userId = getCurrentSessionUser()!.id;
        const callbacks = pendingReturns.current.filter(
          item => !item.ownerId || item.ownerId === userId,
        );
        for (const queued of callbacks) {
          const callback = queued.callback;
          try {
            const flows = await getPendingPaymentFlows();
            if (!valid()) return;
            let flow = flows.find(
              item =>
                item.kind === callback.kind &&
                (item.kind === 'school-card'
                  ? !callback.sessionId || item.sessionId === callback.sessionId
                  : item.kind === 'tip'
                  ? item.tipId === callback.tipId &&
                    (!callback.sessionId ||
                      item.sessionId === callback.sessionId)
                  : item.kind === 'invoice'
                  ? item.invoiceId === callback.invoiceId
                  : true),
            );
            // Validate ownership with the API before persisting references lost during reinstall.
            if (
              !flow &&
              callback.kind === 'school-card' &&
              callback.sessionId
            ) {
              const billing = await syncSchoolBilling(callback.sessionId);
              if (!valid()) return;
              if (
                billing.setupStatus !== 'FAILED' &&
                !(
                  billing.setupStatus === 'READY' &&
                  billing.automaticPaymentsEnabled
                )
              )
                flow = await savePaymentFlow({
                  kind: 'school-card',
                  sessionId: callback.sessionId,
                  expiresAt: null,
                });
            }
            if (!flow && callback.kind === 'invoice' && callback.invoiceId) {
              const invoice = await syncInvoice(callback.invoiceId);
              if (!valid()) return;
              if (!['PAID', 'VOID'].includes(invoice.status))
                flow = await savePaymentFlow({
                  kind: 'invoice',
                  invoiceId: callback.invoiceId,
                });
            }
            if (!flow && callback.kind === 'teacher-onboarding')
              flow = await savePaymentFlow({ kind: 'teacher-onboarding' });
            // An authenticated sync can recover a tip even if reinstall lost its booking reference.
            if (
              !flow &&
              callback.kind === 'tip' &&
              callback.tipId &&
              callback.sessionId
            ) {
              await syncBookingTip(callback.tipId, callback.sessionId);
            }
            if (!valid()) return;
            if (flow) {
              const result = await reconcilePaymentFlow(flow);
              if (result.state === 'needs-login' || result.state === 'failed')
                throw Object.assign(
                  new Error(
                    result.error || 'Sign in to check the original payment.',
                  ),
                  { status: result.status },
                );
            }
            if (!valid()) return;
            setReturnDestination(callback.kind);
            pendingReturns.current = pendingReturns.current.filter(
              item => item !== queued,
            );
          } catch (error) {
            if (!valid()) return;
            const status =
              typeof error === 'object' && error !== null && 'status' in error
                ? Number(error.status)
                : 0;
            // Reject invalid/foreign callback references without deleting any saved owned flow.
            if ([400, 403, 404].includes(status)) {
              pendingReturns.current = pendingReturns.current.filter(
                item => item !== queued,
              );
            }
          }
        }
        const results = await reconcilePendingPayments(valid);
        if (valid() && results.length) store.dispatch(refreshMarketplace());
        if (valid() && callbacks.length) store.dispatch(refreshMarketplace());
      })()
        .catch(() => {
          // References remain durable; existing payment screens provide retry/status controls.
        })
        .finally(() => {
          running = undefined;
          if (rerun && mounted) {
            rerun = false;
            recover();
          }
        });
      await running;
    }

    function handleLink(url: string | null | undefined) {
      if (!url || handledLinks.has(url)) return;
      const callback = paymentReturnFromLink(url);
      if (!callback) return;
      if (handledLinks.size >= 50) handledLinks.clear();
      handledLinks.add(url);
      if (pendingReturns.current.length >= 50) pendingReturns.current.shift();
      pendingReturns.current.push({
        callback,
        ownerId: getCurrentSessionUser()?.id,
      });
      recover();
    }
    Linking.getInitialURL()
      .then(handleLink)
      .catch(() => {});
    const links = Linking.addEventListener('url', event =>
      handleLink(event.url),
    );
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') recover();
      else generation++;
    });
    const unsubscribe = onSessionChanged(() => {
      const userId = getCurrentSessionUser()?.id || '';
      if (userId === activeUser) return;
      activeUser = userId;
      generation++;
      setReturnDestination(null);
      if (userId) recover();
    });
    recover();
    return () => {
      mounted = false;
      generation++;
      links.remove();
      appState.remove();
      unsubscribe();
    };
  }, []);

  const clearPaymentReturn = useCallback(() => setReturnDestination(null), []);
  return { returnDestination, clearPaymentReturn };
}
