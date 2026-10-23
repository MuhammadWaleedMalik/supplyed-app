import React, { useState } from 'react';
import { Text, View } from 'react-native';
import SearchField from '../Ui/SearchField';
import FilterButton from '../Ui/FilterButton';
import FilterSheet from '../Ui/FilterSheet';
import { statusLabel } from '../../utils/ui/marketplaceLabels';
import ApplicationStatusField from './ApplicationStatusField';
import { useStyles } from './dashboardStyles';

type Props = {
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
};

export default function ApplicationFilterBar({
  search,
  status,
  onSearch,
  onStatus,
}: Props) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(status);

  return (
    <View style={styles.section}>
      <SearchField
        value={search}
        placeholder="Job title or status"
        onChangeText={onSearch}
      />
      <View style={styles.sectionHead}>
        <Text style={styles.cardBody}>
          {status === 'ALL' ? 'All applications' : statusLabel(status)} · Newest first
        </Text>
        <FilterButton
          count={status === 'ALL' ? 0 : 1}
          onPress={() => {
            setDraft(status);
            setOpen(true);
          }}
        />
      </View>
      <FilterSheet
        visible={open}
        title="Filter applications"
        onClose={() => setOpen(false)}
        onReset={() => setDraft('APPLIED')}
        onApply={() => {
          onStatus(draft);
          setOpen(false);
        }}
      >
        <ApplicationStatusField value={draft} onChange={setDraft} />
      </FilterSheet>
    </View>
  );
}
