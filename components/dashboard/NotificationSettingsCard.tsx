import { Bell } from 'lucide-react-native';
import React from 'react';
import { Switch, Text, View } from 'react-native';
import type { NotificationPreferences } from '../../feature/dashboard/shared/apis/notificationsApi';
import { useNotificationPreferences } from '../../feature/dashboard/shared/hooks/useNotificationPreferences';
import type { AccountType } from '../../utils/onboarding/onboardingData';
import Button from '../Ui/Button';
import { useTheme } from '../Ui/theme';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';

export default function NotificationSettingsCard({
  type,
}: {
  type: AccountType;
}) {
  const { colors } = useTheme();
  const settingsStyles = useSettingsStyles();

  const form = useNotificationPreferences();
  const options: { key: keyof NotificationPreferences; label: string }[] = [
    { key: 'emailMessages', label: 'Unread messages' },
    {
      key: 'emailUpdates',
      label: type === 'teacher' ? 'Applications and bookings' : 'Bookings',
    },
  ];
  if (type === 'teacher')
    options.unshift({ key: 'emailJobMatches', label: 'Job matches' });

  const disabled = !form.preferences || form.loading || form.saving;

  return (
    <View style={settingsStyles.card}>
      <SettingsCardHeader
        icon={Bell}
        title="EMAIL NOTIFICATIONS"
        note="Choose which optional emails you receive. Changes save automatically."
      />
      {options.map(option => (
        <View key={option.key} style={settingsStyles.notificationRow}>
          <Text style={[settingsStyles.recordValue, settingsStyles.field]}>
            {option.label}
          </Text>
          <Switch
            accessibilityLabel={`${option.label} emails`}
            value={form.preferences?.[option.key] ?? false}
            disabled={disabled}
            trackColor={{ true: colors.brand }}
            onValueChange={value => form.change(option.key, value)}
          />
        </View>
      ))}
      {form.loading ? (
        <Text style={settingsStyles.cardNote}>
          Loading email preferences...
        </Text>
      ) : null}
      {form.saving ? (
        <Text style={settingsStyles.cardNote}>Saving email preferences...</Text>
      ) : null}
      {form.error ? (
        <View style={settingsStyles.actions}>
          <Text accessibilityRole="alert" style={settingsStyles.error}>
            {form.error}
          </Text>
          {!form.preferences ? (
            <Button
              title="Retry"
              variant="link"
              compact
              disabled={form.loading}
              onPress={form.retry}
            />
          ) : null}
        </View>
      ) : null}
      <Text style={settingsStyles.cardNote}>
        In-app notifications are always enabled. Payment and account emails are
        always sent to verified email addresses.
      </Text>
    </View>
  );
}
