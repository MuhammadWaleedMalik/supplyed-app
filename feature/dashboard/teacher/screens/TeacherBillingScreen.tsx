import React from 'react';
import PayoutAccountCard from '../../../../components/dashboard/PayoutAccountCard';
import BillingScreen from '../../shared/screens/BillingScreen';

export default function TeacherBillingScreen() {
  return (
    <>
      <PayoutAccountCard />
      <BillingScreen role="INSTRUCTOR" />
    </>
  );
}
