import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  Dropdown,
  DropdownName,
  getDropdown,
} from '../apis/dropdownsApi';
import { onDropdownRefresh } from '../../../utils/api/dropdownEvents';

export function useDropdown(name: DropdownName) {
  const [data, setData] = useState<Dropdown>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getDropdown(name, attempt > 0)
      .then(result => {
        if (active) setData(result);
      })
      .catch(problem => {
        if (active)
          setError(
            problem instanceof Error
              ? problem.message
              : 'Choices are unavailable.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [name, attempt]);

  useEffect(() => {
    const refresh = () => setAttempt(value => value + 1);
    const unsubscribe = onDropdownRefresh(refresh);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  // A reused field can switch collections without showing the previous menu.
  const currentData = data?.name === name ? data : undefined;
  return {
    data: currentData,
    options: currentData?.options.filter(option => option.isActive) || [],
    loading,
    error,
    retry: () => setAttempt(value => value + 1),
  };
}
