import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../../components/Ui/Button';
import AdminPayoutLookup from '../../../../components/dashboard/AdminPayoutLookup';
import AdminUsersPanel from '../../../../components/dashboard/AdminUsersPanel';
import PhoneVerificationCard from '../../../../components/auth/PhoneVerificationCard';
import { styles } from '../../../../components/dashboard/dashboardStyles';
import BillingScreen from '../../shared/screens/BillingScreen';
import { getCurrentUser } from '../../../auth/apis/authApi';
import { getCurrentSessionUser } from '../../../../utils/api/session';

type Props = {
  email: string;
  onSecurity: () => void;
  onLogout: () => void;
};

export default function AdminPaymentsScreen({
  email,
  onSecurity,
  onLogout,
}: Props) {
  const [page, setPage] = useState('Payments');
  const [user, setUser] = useState(getCurrentSessionUser());
  const [error, setError] = useState('');

  useEffect(() => {
    if (page !== 'Account') return;
    setError('');
    getCurrentUser()
      .then(setUser)
      .catch(problem => {
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to load your account.',
        );
      });
  }, [page]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>
          Supply<Text style={styles.brandBlue}>ED</Text>
        </Text>
        <View style={styles.userArea}>
          <Button
            title="Security"
            variant="link"
            compact
            onPress={onSecurity}
          />
          <Button title="Log out" variant="link" compact onPress={onLogout} />
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.title}>Admin workspace</Text>
          <Text style={styles.subtitle}>{email}</Text>
        </View>
        <View style={styles.topActions}>
          {['Payments', 'Users', 'Account'].map(item => (
            <Button
              key={item}
              title={item}
              variant={page === item ? 'primary' : 'social'}
              onPress={() => setPage(item)}
              compact
            />
          ))}
        </View>
        {page === 'Payments' ? (
          <>
            <AdminPayoutLookup />
            <BillingScreen role="ADMIN" />
          </>
        ) : null}
        {page === 'Users' ? <AdminUsersPanel /> : null}
        {page === 'Account' ? (
          <View style={styles.card}>
            <PhoneVerificationCard user={user} editable onVerified={setUser} />
            {error ? <Text style={styles.cardBody}>{error}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
