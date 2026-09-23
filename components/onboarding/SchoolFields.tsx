import React from 'react';
import { StyleSheet, View } from 'react-native';
import { OnboardingData } from '../../utils/onboarding/onboardingData';
import SchoolDetailsFields from './SchoolDetailsFields';
import SchoolAddressFields from './SchoolAddressFields';

type Props = {
  data: OnboardingData;
  wide: boolean;
  attempted: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function SchoolFields({ data, wide, attempted, update }: Props) {
  return (
    <View style={styles.fields}>
      <SchoolDetailsFields
        data={data}
        wide={wide}
        attempted={attempted}
        update={update}
      />
      <SchoolAddressFields
        data={data}
        wide={wide}
        attempted={attempted}
        update={update}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 16 },
});
