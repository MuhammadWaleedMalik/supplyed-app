import React from 'react';
import DashboardEmpty from '../../../../components/dashboard/DashboardEmpty';
import { useAppSelector } from '../../../../store/hooks';

type Props = {
  role: 'school' | 'teacher';
};

export default function MessagesScreen({ role }: Props) {
  const recipientId = useAppSelector(
    state => state.dashboardNavigation.messageRecipientId,
  );

  let description =
    role === 'school'
      ? 'Messages with teachers will appear here.'
      : 'Messages with schools will appear here.';

  if (role === 'school' && recipientId) {
    description = 'The selected teacher conversation is ready.';
  }

  return <DashboardEmpty title="Messages" description={description} />;
}
