import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AccountType,
  OnboardingData,
} from '../../utils/onboarding/onboardingData';
import AccountFields from './AccountFields';
import RoleSelection from './RoleSelection';
import TeacherFields from './TeacherFields';

type Props = {
  type: AccountType | null;
  data: OnboardingData;
  attempted: boolean;
  wide: boolean;
  onSelect: (type: AccountType) => void;
  update: (field: string, value: string | boolean) => void;
};

export default function AccountStep({
  type,
  data,
  attempted,
  wide,
  onSelect,
  update,
}: Props) {
  return (
    <View style={styles.fields}>
      <RoleSelection
        type={type}
        onSelect={onSelect}
        attempted={attempted}
        wide={wide}
      />
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
