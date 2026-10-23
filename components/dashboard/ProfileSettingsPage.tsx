import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AccountType } from '../../utils/onboarding/onboardingData';
import { useProfileSettings } from '../../feature/dashboard/shared/hooks/useProfileSettings';
import Button from '../Ui/Button';
import { ThemeSettingsCard } from '../Ui/ThemePicker';
import AccountSettingsCard from './AccountSettingsCard';
import ProfileSettingsCard from './ProfileSettingsCard';
import ProfileHistory from './ProfileHistory';
import SettingsStatusCard from './SettingsStatusCard';
import PayoutAccountCard from './PayoutAccountCard';
import NotificationSettingsCard from './NotificationSettingsCard';
import { useStyles } from './dashboardStyles';
import { useSettingsStyles } from './settingsStyles';

type Props = { type: AccountType; title: string; onBack: () => void };
type Section = 'account' | 'profile' | 'preferences' | 'history';

export default function ProfileSettingsPage({ type, title, onBack }: Props) {
  const styles = useStyles();
  const settingsStyles = useSettingsStyles();
  const form = useProfileSettings(type);
  const settingsPage = title === 'Settings';
  const [section, setSection] = useState<Section>(
    settingsPage ? 'preferences' : 'profile',
  );
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const { width, fontScale } = useWindowDimensions();
  const wide = width / fontScale >= 850;
  const editable = section === 'account' || section === 'profile';
  const sections: { value: Section; label: string }[] = settingsPage
    ? [
        { value: 'preferences', label: 'Preferences' },
        { value: 'account', label: 'Account' },
      ]
    : [
        { value: 'profile', label: type === 'teacher' ? 'Teaching' : 'School' },
        { value: 'account', label: 'Account' },
        { value: 'history', label: 'History' },
      ];
  const hints: Record<Section, string> = {
    account: 'Your photo, name, email and phone verification.',
    profile:
      type === 'teacher'
        ? 'Help schools understand your subjects, experience and availability.'
        : 'Keep your school details, staffing needs and compliance contacts current.',
    preferences: 'Appearance, notifications and payment preferences.',
    history: 'Your work, applications, reviews and verification status.',
  };

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [section]);

  useEffect(() => {
    if (!form.error) return;
    if (form.fieldErrors.accountName || form.fieldErrors.phone)
      setSection('account');
    else if (form.fieldErrors.profileName && !settingsPage)
      setSection('profile');
    scroll.current?.scrollTo({ y: 0, animated: true });
  }, [form.error, form.fieldErrors, settingsPage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>{title}</Text>
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
      <KeyboardAvoidingView
        style={settingsStyles.screenBody}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={settingsStyles.sectionTabs}>
          {sections.map(item => (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: section === item.value }}
              onPress={() => setSection(item.value)}
              style={[
                settingsStyles.sectionTab,
                section === item.value && settingsStyles.sectionTabActive,
              ]}
            >
              <Text
                style={[
                  settingsStyles.sectionTabText,
                  section === item.value && settingsStyles.sectionTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <ScrollView
          ref={scroll}
          contentContainerStyle={settingsStyles.page}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={settingsStyles.subtitle}>{hints[section]}</Text>
          {form.error ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              style={settingsStyles.error}
            >
              {form.error}
            </Text>
          ) : null}
          {!form.settings && form.loading ? (
            <ActivityIndicator accessibilityLabel="Loading account" />
          ) : null}
          {!form.settings && form.error && !form.loading ? (
            <Button title="Retry loading settings" onPress={form.retry} />
          ) : null}
          {section === 'account' && form.settings ? (
            <AccountSettingsCard
              settings={form.settings}
              fields={form.fields}
              fieldErrors={form.fieldErrors}
              imageUrl={form.imageUrl}
              loading={form.loading}
              wide={wide}
              onChange={form.change}
              onImage={form.changeImage}
              onPhoneVerified={form.updateUser}
            />
          ) : null}
          {section === 'profile' && form.settings ? (
            <ProfileSettingsCard
              type={type}
              fields={form.fields}
              fieldErrors={form.fieldErrors}
              wide={wide}
              onChange={form.change}
            />
          ) : null}
          {section === 'preferences' ? (
            <>
              <ThemeSettingsCard />
              <NotificationSettingsCard type={type} />
              {type === 'teacher' ? (
                <PayoutAccountCard showBalance={false} />
              ) : null}
            </>
          ) : null}
          {section === 'history' && form.settings ? (
            <>
              <SettingsStatusCard settings={form.settings} />
              {typeof form.settings.profile.id === 'string' ? (
                <ProfileHistory
                  role={type}
                  profileId={form.settings.profile.id}
                />
              ) : null}
            </>
          ) : null}
        </ScrollView>
        {editable ? (
          <View style={settingsStyles.saveBar}>
            {form.saved ? (
              <Text
                accessibilityLiveRegion="polite"
                style={settingsStyles.success}
              >
                {form.saved}
              </Text>
            ) : null}
            <Button
              title={form.loading ? 'Saving...' : 'Save changes'}
              disabled={form.loading || !form.settings}
              onPress={() =>
                form.save(section === 'account' ? 'account' : 'profile')
              }
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
