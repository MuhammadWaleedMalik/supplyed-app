import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import PayoutAccountCard from '../../../../components/dashboard/PayoutAccountCard';
import ChoiceField from '../../../../components/dashboard/ChoiceField';
import EarningsSummaryCard from '../../../../components/dashboard/EarningsSummaryCard';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import BillingScreen from '../../shared/screens/BillingScreen';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setBillingView } from '../../shared/store/navigationSlice';
export default function TeacherBillingScreen() {
  const styles = useStyles();
  const page = useAppSelector(state => state.dashboardNavigation.billingView);
  const dispatch = useAppDispatch();
  const header = (
    <>
      <Text style={styles.title}>Earnings</Text>
      <ChoiceField
        hideLabel
        label="View earnings"
        value={page}
        options={['Invoices', 'Payouts']}
        onChange={value =>
          dispatch(setBillingView(value === 'Payouts' ? 'Payouts' : 'Invoices'))
        }
      />
      <EarningsSummaryCard />
    </>
  );
  return (
    <View style={styles.scroll}>
      {page === 'Invoices' ? (
        <BillingScreen role="INSTRUCTOR" header={header} />
      ) : (
        <ScrollView contentContainerStyle={styles.page}>
          {header}
          <PayoutAccountCard />
        </ScrollView>
      )}
    </View>
  );
}
