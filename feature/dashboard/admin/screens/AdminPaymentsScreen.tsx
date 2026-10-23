import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../../components/Ui/Button';
import { ThemeSettingsCard } from '../../../../components/Ui/ThemePicker';
import AdminPayoutLookup from '../../../../components/dashboard/AdminPayoutLookup';
import AdminUsersPanel from '../../../../components/dashboard/AdminUsersPanel';
import PhoneVerificationCard from '../../../../components/auth/PhoneVerificationCard';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
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
  const styles = useStyles();

  const [page, setPage] = useState('Invoices');
  const [user, setUser] = useState(getCurrentSessionUser());
  const [error, setError] = useState('');

  useEffect(() => {
    if (page !== 'Account') return;
    let active = true;
    setError('');
    getCurrentUser()
      .then(value => {
        if (active) setUser(value);
      })
      .catch(problem => {
        if (!active) return;
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to load your account.',
        );
      });
    return () => {
      active = false;
    };
  }, [page]);

  const heading = (
    <>
      <View style={styles.section}>
        <Text style={styles.title}>Admin workspace</Text>
        <Text style={styles.subtitle}>{email}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.topActions}>
          {['Invoices', 'Payouts', 'Users', 'Account', 'Settings'].map(item => (
            <Button
              key={item}
              title={item}
              variant={page === item ? 'primary' : 'social'}
              onPress={() => setPage(item)}
              compact
            />
          ))}
        </View>
      </ScrollView>
    </>
  );

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
      {page === 'Invoices' ? (
        <BillingScreen role="ADMIN" header={heading} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
        >
          {heading}
          {page === 'Payouts' ? <AdminPayoutLookup /> : null}
          {page === 'Users' ? <AdminUsersPanel /> : null}
          {page === 'Settings' ? <ThemeSettingsCard /> : null}
          {page === 'Account' ? (
            <View style={styles.card}>
              <PhoneVerificationCard
                user={user}
                editable
                onVerified={setUser}
              />
              {error ? <Text style={styles.cardBody}>{error}</Text> : null}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
