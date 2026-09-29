import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../../components/Ui/Button';
import RecoveryCodesCard from '../../../../components/dashboard/RecoveryCodesCard';
import TwoFactorSetupCard from '../../../../components/dashboard/TwoFactorSetupCard';
import { styles } from '../../../../components/dashboard/dashboardStyles';
import { securityStyles } from '../../../../components/dashboard/securityStyles';
import { useTwoFactorSettings } from '../hooks/useTwoFactorSettings';

type Props = { onBack: () => void };

export default function SecurityScreen({ onBack }: Props) {
  const security = useTwoFactorSettings();
  const { width, fontScale } = useWindowDimensions();
  const wide = width / fontScale >= 850;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Supply<Text style={styles.brandBlue}>ED</Text></Text>
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
      <ScrollView contentContainerStyle={securityStyles.page} keyboardShouldPersistTaps="handled">
        <View style={securityStyles.heading}>
          <Text style={securityStyles.title}>Security</Text>
          <Text style={securityStyles.subtitle}>Protect your account with an authenticator app and recovery codes.</Text>
        </View>
        <View style={[securityStyles.layout, wide && securityStyles.wideLayout]}>
          <View style={securityStyles.main}>
            <TwoFactorSetupCard status={security.status} setup={security.setup}
              code={security.code} busy={security.busy} wide={wide}
              onCode={security.setCode} onStart={security.startSetup}
              onEnable={security.enable} onDisable={security.disable} />
            {security.error ? <Text style={securityStyles.error}>{security.error}</Text> : null}
          </View>
          <View style={[securityStyles.aside, wide && securityStyles.wideAside]}>
            <RecoveryCodesCard status={security.status} codes={security.recoveryCodes}
              busy={security.busy} onRegenerate={security.regenerate}
              onDownload={security.downloadCodes} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}