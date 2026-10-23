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
    const timer = setInterval(run, milliseconds);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') run();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [enabled, milliseconds]);
  useEffect(() => {
    if (enabled && revision && AppState.currentState === 'active')
      callback.current();
  }, [enabled, revision]);
}
