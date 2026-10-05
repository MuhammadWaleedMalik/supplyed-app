import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AccountType } from '../../utils/onboarding/onboardingData';
import { useProfileSettings } from '../../feature/dashboard/shared/hooks/useProfileSettings';
import Button from '../Ui/Button';
import AccountSettingsCard from './AccountSettingsCard';
import ProfileSettingsCard from './ProfileSettingsCard';
import SettingsStatusCard from './SettingsStatusCard';
import PayoutAccountCard from './PayoutAccountCard';
import { styles } from './dashboardStyles';
import { settingsStyles } from './settingsStyles';

type Props = { type: AccountType; title: string; onBack: () => void };

export default function ProfileSettingsPage({ type, title, onBack }: Props) {
  const form = useProfileSettings(type);
  const { width, fontScale } = useWindowDimensions();
  const wide = width / fontScale >= 850;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>
          Supply<Text style={styles.brandBlue}>ED</Text>
        </Text>
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
      <ScrollView
        contentContainerStyle={settingsStyles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={settingsStyles.heading}>
          <Text style={settingsStyles.title}>{title}</Text>
          <Text style={settingsStyles.subtitle}>
            Manage account, profile, and marketplace information.
          </Text>
        </View>
        <View
          style={[settingsStyles.layout, wide && settingsStyles.wideLayout]}
        >
          <View style={settingsStyles.main}>
            <AccountSettingsCard
              settings={form.settings}
              fields={form.fields}
              imageUrl={form.imageUrl}
              loading={form.loading}
              wide={wide}
              onChange={form.change}
              onImage={form.changeImage}
              onPhoneVerified={form.updateUser}
            />
            <ProfileSettingsCard
              type={type}
              fields={form.fields}
              wide={wide}
              onChange={form.change}
            />
            {type === 'teacher' && title === 'Settings' ? (
              <PayoutAccountCard showBalance={false} />
            ) : null}
            {form.error ? (
              <Text style={settingsStyles.error}>{form.error}</Text>
            ) : null}
            {form.saved ? (
              <Text style={settingsStyles.success}>{form.saved}</Text>
            ) : null}
            <View style={settingsStyles.actions}>
              <Button
                title={form.loading ? 'Saving...' : 'Save settings'}
                disabled={form.loading}
                onPress={form.save}
              />
              <Button title="Cancel" variant="link" compact onPress={onBack} />
            </View>
          </View>
          <View
            style={[settingsStyles.aside, wide && settingsStyles.wideAside]}
          >
            <SettingsStatusCard settings={form.settings} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
