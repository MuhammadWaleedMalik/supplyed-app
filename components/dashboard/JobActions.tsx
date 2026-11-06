import { useAppDispatch } from '../../store/hooks';
import { refreshMarketplace } from '../../feature/dashboard/shared/store/navigationSlice';
import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import { protectedRequest } from '../../utils/api/request';
import Button from '../Ui/Button';
import ConfirmDialog from '../Ui/ConfirmDialog';
export default function JobActions({
  job,
  onChanged,
}: {
  job: Job;
  onChanged: () => void;
}) {
  const dispatch = useAppDispatch();
  const [confirmation, setConfirmation] = useState<'close' | 'delete'>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function change(action: 'close' | 'delete') {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await protectedRequest(
        '/jobs/' + encodeURIComponent(job.id),
        action === 'delete' ? 'DELETE' : 'PATCH',
        action === 'close' ? { status: 'CLOSED' } : undefined,
      );
      dispatch(refreshMarketplace());
      onChanged();
      return true;
    } catch (problem) {
      const message =
        problem instanceof Error
          ? problem.message
          : 'Unable to update the job.';
      setError(message);
      throw new Error(message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <View>
      {['DRAFT', 'ACTIVE', 'RESERVED', 'EXPIRED'].includes(job.status || '') ? (
        <Button
          title="Close job"
          variant="outline"
          disabled={busy}
          onPress={() => setConfirmation('close')}
        />
      ) : null}
      {job.canDelete ? (
        <Button
          title="Delete draft"
          variant="link"
          disabled={busy}
          onPress={() => setConfirmation('delete')}
        />
      ) : null}
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      {confirmation ? (
        <ConfirmDialog
          visible
          key={confirmation}
          title={
            confirmation === 'close' ? 'Close this role?' : 'Delete this draft?'
          }
          context={job.title}
          description={
            confirmation === 'close'
              ? 'This removes the public listing, rejects active applications and withdraws pending invitations. People affected will be notified. All history remains available.'
              : 'This permanently removes an unused draft that has never been published. This cannot be undone.'
          }
          confirmLabel={confirmation === 'close' ? 'Close job' : 'Delete draft'}
          destructive
          onClose={() => setConfirmation(undefined)}
          onConfirm={() => change(confirmation)}
        />
      ) : null}
    </View>
  );
}
