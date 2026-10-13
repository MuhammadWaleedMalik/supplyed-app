import { useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';
import {
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorStatus,
  regenerateRecoveryCodes,
  startTwoFactorSetup,
  TwoFactorSetup,
  TwoFactorStatus,
} from '../apis/twoFactorApi';

function validAuthenticatorCode(value: string) {
  return /^\d{6}$/.test(value.trim());
}

function validSecurityCode(value: string) {
  return /^(?:\d{6}|[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3})$/i.test(value.trim());
}

export function useTwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus>();
  const [setup, setSetup] = useState<TwoFactorSetup>();
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);

  async function load() {
    try { setStatus(await getTwoFactorStatus()); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to load security.'); }
  }

  async function startSetup() {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    try { setSetup(await startTwoFactorSetup()); await load(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to start setup.'); }
    working.current = false;
    setBusy(false);
  }

  async function enable() {
    if (working.current) return;
    if (!validAuthenticatorCode(code)) { setError('Enter the current 6 digit authenticator code.'); return; }
    working.current = true;
    setBusy(true);
    setError('');
    try {
      const reply = await enableTwoFactor(code);
      setRecoveryCodes(reply.recoveryCodes || []);
      setSetup(undefined);
      setCode('');
      await load();
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to enable 2FA.'); }
    working.current = false;
    setBusy(false);
  }

  async function regenerate() {
    if (working.current) return;
    if (!validSecurityCode(code)) { setError('Enter a valid authenticator or recovery code.'); return; }
    working.current = true;
    setBusy(true);
    setError('');
    try {
      setRecoveryCodes((await regenerateRecoveryCodes(code)).recoveryCodes || []);
      setCode('');
      await load();
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to create codes.'); }
    working.current = false;
    setBusy(false);
  }

  async function disable() {
    if (working.current) return;
    if (!validSecurityCode(code)) { setError('Enter a valid authenticator or recovery code.'); return; }
    working.current = true;
    setBusy(true);
    setError('');
    try {
      const reply = await disableTwoFactor(code);
      setStatus({ enabled: reply.enabled, setupPending: false, recoveryCodesRemaining: 0 });
      setSetup(undefined);
      setCode('');
      setRecoveryCodes([]);
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to disable 2FA.'); }
    working.current = false;
    setBusy(false);
  }

  async function downloadCodes() {
    try {
      if (recoveryCodes.length)
        await Share.share({ title: 'SupplyED recovery codes', message: recoveryCodes.join('\n') });
    } catch {
      setError('Unable to share recovery codes. Please try again.');
    }
  }

  useEffect(() => { load(); }, []);

  return {
    status, setup, code, setCode, recoveryCodes, error, busy,
    startSetup, enable, regenerate, disable, downloadCodes,
  };
}
