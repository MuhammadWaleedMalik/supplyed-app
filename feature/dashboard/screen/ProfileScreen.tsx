import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import Input from '../../../components/Ui/Input';
import { styles } from '../../../components/dashboard/dashboardStyles';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import { useProfileSettings } from '../hooks/useProfileSettings';

type Props = { type: AccountType; onBack: () => void };

export default function ProfileScreen({ type, onBack }: Props) {
  const form = useProfileSettings(type);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Supply<Text style={styles.brandBlue}>ED</Text></Text>
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Workspace profile</Text>
          <Input label="NAME" value={form.fields.name}
            onChangeText={value => form.change('name', value)} />
          <Input label="PHONE" value={form.fields.phone}
            onChangeText={value => form.change('phone', value)} />
          <Input label="CITY" value={form.fields.city}
            onChangeText={value => form.change('city', value)} />
          <Input label="POSTAL CODE" value={form.fields.postalCode}
            onChangeText={value => form.change('postalCode', value)} />
          {form.error ? <Text style={styles.cardBody}>{form.error}</Text> : null}
          <Button title={form.loading ? 'Saving...' : 'Save profile'} onPress={form.save} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
