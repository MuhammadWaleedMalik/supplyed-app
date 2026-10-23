import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCurrentSessionUser,
  getSessionVersion,
  setCurrentSessionUser,
} from '../../../../utils/api/session';
import {
  AdminUser,
  AdminUserFields,
  adminUserFields,
  createAdminUser,
  getAdminUsers,
  PhoneVerificationFilter,
  updateAdminUser,
} from '../apis/adminUsersApi';

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [phoneFilter, setPhoneFilter] =
    useState<PhoneVerificationFilter>('All');
  const [selectedUser, setSelectedUser] = useState<AdminUser>();
  const [fields, setFields] = useState(adminUserFields());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const saving = useRef(false);
  const mounted = useRef(true);
  const requestId = useRef(0);
  const session = useRef(getSessionVersion()).current;
  const active = useCallback(
    () => mounted.current && getSessionVersion() === session,
    [session],
  );

  const refresh = useCallback(async () => {
    if (!active()) return;
    const request = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await getAdminUsers(page, phoneFilter);
      if (!active() || request !== requestId.current) return;
      setUsers(result.users);
      setTotal(result.pagination.total);
      setHasNextPage(result.pagination.hasNextPage);
    } catch (problem) {
      if (!active() || request !== requestId.current) return;
      setError(
        problem instanceof Error ? problem.message : 'Unable to load users.',
      );
    } finally {
      if (active() && request === requestId.current) setLoading(false);
    }
  }, [page, phoneFilter, active]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
      requestId.current += 1;
    };
  }, [refresh]);

  function changeFilter(value: string) {
    if (loading || busy) return;
    if (value !== 'All' && value !== 'Verified' && value !== 'Not verified')
      return;
    setPhoneFilter(value);
    setPage(1);
    setNotice('');
  }

  function selectUser(user: AdminUser) {
    if (busy) return;
    setSelectedUser(user);
    setFields(adminUserFields(user));
    setError('');
    setNotice('');
  }

  function newUser() {
    if (busy) return;
    setSelectedUser(undefined);
    setFields(adminUserFields());
    setError('');
    setNotice('');
  }

  function change(name: keyof AdminUserFields, value: string | boolean) {
    if (busy) return;
    setNotice('');
    setFields(current => ({
      ...current,
      [name]: value,
      ...(name === 'phone' ? { phoneVerified: false } : {}),
    }));
  }

  async function save() {
    if (!active() || saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const savedUser = selectedUser
        ? await updateAdminUser(selectedUser, fields)
        : await createAdminUser(fields);
      if (!active()) return;
      if (savedUser.id === getCurrentSessionUser()?.id) {
        setCurrentSessionUser(savedUser);
      }
      setSelectedUser(savedUser);
      setFields(adminUserFields(savedUser));
      await refresh();
      if (!active()) return;
      setNotice(selectedUser ? 'User updated.' : 'User created.');
    } catch (problem) {
      if (!active()) return;
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to save this user.',
      );
    } finally {
      saving.current = false;
      if (active()) setBusy(false);
    }
  }

  function previousPage() {
    if (!loading && !busy && page > 1) setPage(page - 1);
  }

  function nextPage() {
    if (!loading && !busy && hasNextPage) setPage(page + 1);
  }

  return {
    users,
    page,
    total,
    hasNextPage,
    phoneFilter,
    selectedUser,
    fields,
    loading,
    busy,
    error,
    notice,
    refresh,
    changeFilter,
    selectUser,
    newUser,
    change,
    save,
    previousPage,
    nextPage,
  };
}
