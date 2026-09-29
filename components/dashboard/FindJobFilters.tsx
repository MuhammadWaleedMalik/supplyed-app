import React from 'react';
import { Text, View } from 'react-native';
import { findJobTypes, jobKeyStages, jobSubjects } from '../../constants/jobOptions';
import Select from '../Ui/Select';
import { styles } from './dashboardStyles';

type Props = {
  roleType: string;
  keyStage: string;
  subject: string;
  onRoleType: (value: string) => void;
  onKeyStage: (value: string) => void;
  onSubject: (value: string) => void;
};

export default function FindJobFilters({ roleType, keyStage, subject, onRoleType, onKeyStage, onSubject }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>FILTERS</Text>
      <Select label="ROLE TYPE" value={roleType} placeholder="Role type"
        options={findJobTypes} onChange={onRoleType} />
      <Select label="KEY STAGE" value={keyStage} placeholder="Key stage"
        options={['All stages', ...jobKeyStages]} onChange={onKeyStage} />
      <Select label="SUBJECT" value={subject} placeholder="Subject"
        options={['All subjects', ...jobSubjects]} onChange={onSubject} />
    </View>
  );
}
