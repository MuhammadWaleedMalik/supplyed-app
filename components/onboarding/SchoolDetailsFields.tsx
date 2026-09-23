import React from 'react';
import { StyleSheet, View } from 'react-native';
import Input from '../Ui/Input';
import { OnboardingData } from '../../utils/onboarding/onboardingData';
import { requiredError } from '../../utils/onboarding/onboardingUtils';

type Props = {
  data: OnboardingData;
  wide: boolean;
  attempted: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function SchoolDetailsFields({
  data,
  wide,
  attempted,
  update,
}: Props) {
  return (
    <View style={styles.fields}>
      <View style={[styles.row, wide && styles.wide]}>
        <Input
          label="SCHOOL OR MAT NAME"
          placeholder="Greenfield Primary School"
          value={data.schoolName}
          onChangeText={value => update('schoolName', value)}
          error={requiredError(data.schoolName, attempted)}
          half={wide}
        />
        <Input
          label="YOUR ROLE"
          placeholder="Headteacher, HR lead, cover manager"
          value={data.schoolRole}
          onChangeText={value => update('schoolRole', value)}
          required={false}
          half={wide}
        />
      </View>
      <View style={[styles.row, wide && styles.wide]}>
        <Input
          label="SCHOOL / TRUST DOMAIN"
          placeholder="greenfield.ac.uk"
          value={data.domain}
          onChangeText={value => update('domain', value)}
          error={requiredError(data.domain, attempted)}
          half={wide}
        />
        <Input
          label="REGISTRATION ID"
          placeholder="URN, company number, or trust ID"
          value={data.registrationId}
          onChangeText={value => update('registrationId', value)}
          required={false}
          half={wide}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 16 },
  row: { gap: 12 },
  wide: { flexDirection: 'row', alignItems: 'flex-start' },
});
