import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import Input from '../../../components/Ui/Input';
import { styles } from '../../../components/dashboard/dashboardStyles';
import { useTwoFactorSettings } from '../hooks/useTwoFactorSettings';

type Props = { onBack: () => void };

export default function SecurityScreen({ onBack }: Props) {
  const security = useTwoFactorSettings();
  const enabled = security.status?.enabled;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Supply<Text style={styles.brandBlue}>ED</Text></Text>
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Security</Text>
          <Text style={styles.subtitle}>{enabled ? 'Two-factor is enabled.' : 'Two-factor is off.'}</Text>
          {security.setup ? <Text style={styles.cardBody}>Secret: {security.setup.secret}</Text> : null}
          <Input label="2FA OR RECOVERY CODE" value={security.code}
            onChangeText={security.setCode} />
          {security.error ? <Text style={styles.cardBody}>{security.error}</Text> : null}
          <Button title="Start 2FA setup" onPress={security.startSetup} />
          <Button title="Enable 2FA" variant="social" onPress={security.enable} />
          <Button title="New recovery codes" variant="social" onPress={security.regenerate} />
          <Button title="Disable 2FA" variant="text" onPress={security.disable} />
          {security.recoveryCodes.map(code => (
            <Text key={code} style={styles.metricDetail}>{code}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
