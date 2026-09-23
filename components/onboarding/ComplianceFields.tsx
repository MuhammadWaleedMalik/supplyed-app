import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Checkbox from '../Ui/Checkbox';
import Input from '../Ui/Input';
import { colors, common } from '../Ui/theme';
import { OnboardingData } from '../../utils/onboarding/onboardingData';

type Props = {
  data: OnboardingData;
  wide: boolean;
  attempted: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function ComplianceFields({
  data,
  wide,
  attempted,
  update,
}: Props) {
  return (
    <View style={styles.fields}>
      <View style={[styles.row, wide && styles.wide]}>
        <Input
          label="COMPLIANCE LEAD"
          placeholder="Name of safeguarding lead"
          value={data.complianceLead}
          required={false}
          half={wide}
          onChangeText={value => update('complianceLead', value)}
        />
        <Input
          label="COMPLIANCE EMAIL"
          placeholder="safeguarding@school.org.uk"
          value={data.complianceEmail}
          email
          required={false}
          half={wide}
          onChangeText={value => update('complianceEmail', value)}
        />
      </View>
      <View style={styles.notice}>
        <Text style={styles.title}>Safeguarding responsibility</Text>
        <Text style={common.body}>
          SupplyED can verify teacher documents, but schools remain responsible
          for local safeguarding and booking approvals.
        </Text>
        <Checkbox
          label="I confirm this workspace will be managed by authorised school staff."
          checked={data.confirmed}
          onChange={value => update('confirmed', value)}
        />
        {attempted && !data.confirmed && (
          <Text style={styles.error}>Please confirm before continuing.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 24 },
  row: { gap: 12 },
  wide: { flexDirection: 'row', alignItems: 'flex-start' },
  notice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.soft,
    padding: 16,
    gap: 10,
  },
  title: { ...common.bold, fontSize: 15 },
  error: { color: '#c93251', fontSize: 12 },
});
