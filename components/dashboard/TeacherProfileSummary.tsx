import React from 'react';
import { useLimitedProfile } from '../../feature/dashboard/shared/hooks/useLimitedProfile';
import { EmptyState, RecordSkeleton } from '../Ui/RecordLayout';
import ProfileContent from './ProfileContent';

export default function TeacherProfileSummary({ teacherId, compact = false }: { teacherId: string; compact?: boolean }) {
  const state = useLimitedProfile('teacher', teacherId);
  if (state.loading) return <RecordSkeleton />;
  if (!state.profile) return <EmptyState title="Teacher profile unavailable" description={state.error || 'Please reopen this profile to try again.'} />;
  return <ProfileContent profile={state.profile} compact={compact} reviews={!compact} />;
}
