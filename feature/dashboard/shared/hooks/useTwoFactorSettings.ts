import { useCallback, useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';
import { getSessionVersion } from '../../../../utils/api/session';
import { useAuthAttempt } from '../../../../utils/auth/useAuthAttempt';
import {
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorStatus,
  regenerateRecoveryCodes,
  startTwoFactorSetup,
  TwoFactorSetup,
  TwoFactorStatus,
} from '../apis/twoFactorApi';

function validSecurityCode(value: string) {
  return /^(?:\d{6}|[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3})$/i.test(
    value.trim(),
  );
}

export function useTwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus>();
  const [setup, setSetup] = useState<TwoFactorSetup>();
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const mounted = useRef(true);
  const attempt = useAuthAttempt();

  const load = useCallback(async () => {
    const version = getSessionVersion();
    const active = () => mounted.current && version === getSessionVersion();
    setBusy(true);
    setError('');
    try {
      const next = await getTwoFactorStatus();
      if (active()) setStatus(next);
    } catch (problem) {
      if (active())
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to load security.',
        );
    } finally {
      if (active()) setBusy(false);
    }
  }, []);

  async function startSetup() {
    if (busy || !status || status.enabled) return;
    const active = attempt.begin();
    if (!active) return;
    setBusy(true);
    setError('');
    try {
      const next = await startTwoFactorSetup();
      if (!active()) return;
      setSetup(next);
      setCode('');
      setStatus({
        enabled: false,
        setupPending: true,
        recoveryCodesRemaining: 0,
      });
    } catch (problem) {
      if (active())
        setError(
          problem instanceof Error ? problem.message : 'Unable to start setup.',
        );
    } finally {
      attempt.finish();
      if (active()) setBusy(false);
    }
  }

  async function enable() {
    if (busy || !setup) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the current six-digit authenticator code.');
      return;
    }
    const active = attempt.begin();
    if (!active) return;
    setBusy(true);
    setError('');
    try {
      const reply = await enableTwoFactor(code);
      if (!active()) return;
      setRecoveryCodes(reply.recoveryCodes);
      setSetup(undefined);
      setCode('');
      setStatus({
        enabled: true,
        setupPending: false,
        recoveryCodesRemaining: reply.recoveryCodes.length,
      });
    } catch (problem) {
      if (active())
        setError(
          problem instanceof Error ? problem.message : 'Unable to enable 2FA.',
        );
    } finally {
      attempt.finish();
      if (active()) setBusy(false);
    }
  }

  async function regenerate() {
    if (busy || !status?.enabled) return;
    if (!validSecurityCode(code)) {
      setError(
        'Enter a current authenticator or recovery code before generating new codes.',
      );
      return;
    }
    const active = attempt.begin();
    if (!active) return;
    setBusy(true);
    setError('');
    try {
      const reply = await regenerateRecoveryCodes(code);
      if (!active()) return;
      setRecoveryCodes(reply.recoveryCodes);
      setCode('');
      setStatus({
        enabled: true,
        setupPending: false,
        recoveryCodesRemaining: reply.recoveryCodes.length,
      });
    } catch (problem) {
      if (active())
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to create codes.',
        );
    } finally {
      attempt.finish();
      if (active()) setBusy(false);
    }
  }

  async function disable() {
    if (busy || !status?.enabled) return;
    if (!validSecurityCode(code)) {
      setError('Enter a valid authenticator or recovery code.');
      return;
    }
    const active = attempt.begin();
    if (!active) return;
    setBusy(true);
    setError('');
    try {
      const reply = await disableTwoFactor(code);
      if (!active()) return;
      setStatus({
        enabled: reply.enabled,
        setupPending: false,
        recoveryCodesRemaining: 0,
      });
      setSetup(undefined);
      setCode('');
      setRecoveryCodes([]);
    } catch (problem) {
      if (active())
        setError(
          problem instanceof Error ? problem.message : 'Unable to disable 2FA.',
        );
    } finally {
      attempt.finish();
      if (active()) setBusy(false);
    }
  }

  async function downloadCodes() {
    try {
      if (recoveryCodes.length)
        await Share.share({
          title: 'SupplyED recovery codes',
          message: recoveryCodes.join('\n'),
        });
    } catch {
      if (mounted.current)
        setError('Unable to share recovery codes. Please try again.');
    }
  }

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return {
    status,
    setup,
    code,
    setCode,
    recoveryCodes,
    error,
    busy,
    startSetup,
    enable,
    regenerate,
    disable,
    downloadCodes,
    retry: load,
  };
}
