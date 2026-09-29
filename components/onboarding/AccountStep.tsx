import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AccountType,
  OnboardingData,
} from '../../utils/onboarding/onboardingData';
import AccountFields from './AccountFields';
import TeacherFields from './TeacherFields';

type Props = {
  type: AccountType;
  data: OnboardingData;
  attempted: boolean;
  wide: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function AccountStep({
  type,
  data,
  attempted,
  wide,
  update,
}: Props) {
  return (
    <View style={styles.fields}>
      <AccountFields
        type={type}
        data={data}
        update={update}
        attempted={attempted}
        wide={wide}
      />
      {type === 'teacher' ? (
        <TeacherFields data={data} update={update} wide={wide} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ fields: { gap: 20 } });
