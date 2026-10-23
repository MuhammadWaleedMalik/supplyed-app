import { useAppDispatch } from '../../store/hooks';
import { refreshMarketplace } from '../../feature/dashboard/shared/store/navigationSlice';
import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import { protectedRequest } from '../../utils/api/request';
import Button from '../Ui/Button';
import ConfirmDialog from '../Ui/ConfirmDialog';
export default function JobActions({ job, onChanged }: { job: Job; onChanged: () => void }) {
  const dispatch = useAppDispatch();
  const [confirmation, setConfirmation] = useState<'close' | 'delete'>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function change(action: 'close' | 'delete') {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError('');
    try { await protectedRequest('/jobs/' + encodeURIComponent(job.id), action === 'delete' ? 'DELETE' : 'PATCH', action === 'close' ? { status: 'CLOSED' } : undefined); dispatch(refreshMarketplace()); onChanged(); return true; }
    catch (problem) { const message = problem instanceof Error ? problem.message : 'Unable to update the job.'; setError(message); throw new Error(message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <View>
    {['DRAFT', 'ACTIVE'].includes(job.status || '') ? <Button title="Close job" variant="outline" disabled={busy} onPress={() => setConfirmation('close')} /> : null}
    <Button title="Delete job" variant="link" disabled={busy} onPress={() => setConfirmation('delete')} />
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    {confirmation ? <ConfirmDialog visible key={confirmation} title={confirmation === 'close' ? 'Close this role?' : 'Delete this role?'} context={job.title} description={confirmation === 'close' ? 'Teachers will no longer be able to apply. Existing application and booking records remain available.' : 'This permanently removes the job. Jobs with linked records may need to be closed instead.'} confirmLabel={confirmation === 'close' ? 'Close job' : 'Delete job'} destructive onClose={() => setConfirmation(undefined)} onConfirm={() => change(confirmation)} /> : null}
  </View>;
}
