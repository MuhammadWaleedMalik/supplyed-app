import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import PayoutAccountCard from '../../../../components/dashboard/PayoutAccountCard';
import ChoiceField from '../../../../components/dashboard/ChoiceField';
import EarningsSummaryCard from '../../../../components/dashboard/EarningsSummaryCard';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import BillingScreen from '../../shared/screens/BillingScreen';
export default function TeacherBillingScreen() {
  const styles = useStyles();
  const [page, setPage] = useState('Invoices');
  const header = <><Text style={styles.title}>Earnings</Text><ChoiceField hideLabel label="View earnings" value={page} options={['Invoices', 'Payouts']} onChange={setPage} /><EarningsSummaryCard /></>;
  return <View style={styles.scroll}>{page === 'Invoices' ? <BillingScreen role="INSTRUCTOR" header={header} /> : <ScrollView contentContainerStyle={styles.page}>{header}<PayoutAccountCard /></ScrollView>}</View>;
}
