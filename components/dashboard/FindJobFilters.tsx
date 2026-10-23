import React, { useState } from 'react';
import { Text, View } from 'react-native';
import FilterSheet from '../Ui/FilterSheet';
import FilterButton from '../Ui/FilterButton';
import DynamicSelect from '../Ui/DynamicSelect';
import { useStyles } from './dashboardStyles';

type Props = {
  roleType: string;
  keyStage: string;
  subject: string;
  onRoleType: (value: string) => void;
  onKeyStage: (value: string) => void;
  onSubject: (value: string) => void;
};

export default function FindJobFilters({
  roleType,
  keyStage,
  subject,
  onRoleType,
  onKeyStage,
  onSubject,
}: Props) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ roleType, keyStage, subject });
  const count = [
    roleType !== 'All jobs' && roleType,
    keyStage !== 'All stages' && keyStage,
    subject !== 'All subjects' && subject,
  ].filter(Boolean).length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.cardBody}>
          {count ? `${count} filters applied` : 'All teaching opportunities'}
        </Text>
        <FilterButton
          count={count}
          onPress={() => {
            setDraft({ roleType, keyStage, subject });
            setOpen(true);
          }}
        />
      </View>
      <FilterSheet
        visible={open}
        title="Filter jobs"
        onClose={() => setOpen(false)}
        onReset={() => setDraft({ roleType: '', keyStage: '', subject: '' })}
        onApply={() => {
          onRoleType(draft.roleType || 'All jobs');
          onKeyStage(draft.keyStage || 'All stages');
          onSubject(draft.subject || 'All subjects');
          setOpen(false);
        }}
      >
        <DynamicSelect
          label="Urgency"
          value={draft.roleType === 'All jobs' ? '' : draft.roleType}
          placeholder="All jobs"
          name="discoveryUrgency"
          onChange={value => setDraft({ ...draft, roleType: value })}
        />
        <DynamicSelect
          label="Key stage"
          value={draft.keyStage === 'All stages' ? '' : draft.keyStage}
          placeholder="All key stages"
          name="keyStage"
          onChange={value => setDraft({ ...draft, keyStage: value })}
        />
        <DynamicSelect
          label="Subject"
          value={draft.subject === 'All subjects' ? '' : draft.subject}
          placeholder="All subjects"
          name="subject"
          exclude={['Other']}
          onChange={value => setDraft({ ...draft, subject: value })}
        />
      </FilterSheet>
    </View>
  );
}
