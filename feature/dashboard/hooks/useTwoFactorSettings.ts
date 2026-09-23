import { useEffect, useState } from 'react';
import {
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorStatus,
  regenerateRecoveryCodes,
  startTwoFactorSetup,
  TwoFactorSetup,
  TwoFactorStatus,
} from '../apis/twoFactorApi';

export function useTwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus>();
  const [setup, setSetup] = useState<TwoFactorSetup>();
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try { setStatus(await getTwoFactorStatus()); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to load security.'); }
  }

  async function startSetup() {
    try { setSetup(await startTwoFactorSetup()); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to start setup.'); }
  }

  async function enable() {
    try {
      const reply = await enableTwoFactor(code);
      setRecoveryCodes(reply.recoveryCodes || []);
      await load();
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to enable 2FA.'); }
  }

  async function regenerate() {
    try { setRecoveryCodes((await regenerateRecoveryCodes(code)).recoveryCodes || []); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to create codes.'); }
  }

  async function disable() {
    try { setStatus(await disableTwoFactor(code)); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to disable 2FA.'); }
  }

  useEffect(() => { load(); }, []);

  return { status, setup, code, setCode, recoveryCodes, error, startSetup, enable, regenerate, disable };
}
