import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAppSelector } from '../../../../store/hooks';

export function useForegroundRefresh(
  refresh: () => unknown,
  enabled = true,
  milliseconds = 30000,
) {
  const callback = useRef(refresh);
  callback.current = refresh;
  const revision = useAppSelector(
    state => state.dashboardNavigation.dataRevision,
  );
  useEffect(() => {
    if (!enabled) return;
    const run = () => {
      if (AppState.currentState === 'active') callback.current();
    };
    const timer = milliseconds > 0 ? setInterval(run, milliseconds) : undefined;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') run();
    });
    return () => {
      if (timer) clearInterval(timer);
      subscription.remove();
    };
  }, [enabled, milliseconds]);
  useEffect(() => {
    if (enabled && revision && AppState.currentState === 'active')
      callback.current();
  }, [enabled, revision]);
}
