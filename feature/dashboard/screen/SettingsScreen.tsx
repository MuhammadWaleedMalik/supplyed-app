import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import { styles } from '../../../components/dashboard/dashboardStyles';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import { useProfileSettings } from '../hooks/useProfileSettings';

type Props = { type: AccountType; onBack: () => void };

export default function SettingsScreen({ type, onBack }: Props) {
  const settings = useProfileSettings(type);
  const user = settings.settings?.user;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Supply<Text style={styles.brandBlue}>ED</Text></Text>
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.card}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.cardTitle}>{user?.email || 'Account'}</Text>
          <Text style={styles.cardBody}>Role: {user?.role || type}</Text>
          <Text style={styles.cardBody}>Profile type: {type}</Text>
          {settings.error ? <Text style={styles.cardBody}>{settings.error}</Text> : null}
          <Button title="Reload settings" onPress={settings.load} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
