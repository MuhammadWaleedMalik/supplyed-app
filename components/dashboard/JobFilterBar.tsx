import React, { useState } from 'react';
import { Text, View } from 'react-native';
import SearchField from '../Ui/SearchField';
import FilterButton from '../Ui/FilterButton';
import FilterSheet from '../Ui/FilterSheet';
import { statusLabel } from '../../utils/ui/marketplaceLabels';
import { useStyles } from './dashboardStyles';

import DynamicSelect from '../Ui/DynamicSelect';

type Props = {
  search: string;
  onSearch: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  statuses?: readonly string[];
};

export default function JobFilterBar({
  search,
  onSearch,
  status,
  onStatus,
  statuses = ['ALL', 'ACTIVE', 'DRAFT', 'CLOSED', 'EXPIRED', 'SUSPENDED'],
}: Props) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(status);

  return (
    <View style={styles.section}>
      <SearchField
        value={search}
        placeholder="Title, subject, or city"
        onChangeText={onSearch}
      />
      <View style={styles.sectionHead}>
        <Text style={styles.cardBody}>
          {status === 'ALL' ? 'All jobs' : statusLabel(status)}
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
        title="Filter jobs"
        onClose={() => setOpen(false)}
        onReset={() => setDraft('ALL')}
        onApply={() => {
          onStatus(draft);
          setOpen(false);
        }}
      >
        <DynamicSelect
          name="jobStatus"
          label="Status"
          value={draft === 'ALL' ? '' : draft}
          placeholder="All jobs"
          onChange={value => setDraft(value || 'ALL')}
          allowed={statuses.filter(value => value !== 'ALL') as string[]}
        />
      </FilterSheet>
    </View>
  );
}
