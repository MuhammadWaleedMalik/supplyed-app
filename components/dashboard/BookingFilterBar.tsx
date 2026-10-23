import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { BookingFilters } from '../../feature/dashboard/shared/hooks/useBookings';
import FilterButton from '../Ui/FilterButton';
import FilterSheet from '../Ui/FilterSheet';
import SearchField from '../Ui/SearchField';
import DateField from '../Ui/DateField';
import DynamicSelect from '../Ui/DynamicSelect';
import ChoiceField from './ChoiceField';
import { statusLabel } from '../../utils/ui/marketplaceLabels';
import { useStyles } from './dashboardStyles';

type Props = {
  filters: BookingFilters;
  onChange: <K extends keyof BookingFilters>(
    key: K,
    value: BookingFilters[K],
  ) => void;
};

export default function BookingFilterBar({ filters, onChange }: Props) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState('');
  const count = [
    filters.status !== 'ALL',
    !!filters.from,
    !!filters.to,
    filters.invoice !== 'ALL',
  ].filter(Boolean).length;

  function apply() {
    if (draft.from && draft.to && draft.from > draft.to) {
      setError('Choose an end date on or after the start date.');
      return;
    }
    onChange('status', draft.status);
    onChange('from', draft.from);
    onChange('to', draft.to);
    onChange('invoice', draft.invoice);
    setOpen(false);
  }

  return (
    <View style={styles.section}>
      <ChoiceField
        hideLabel
        label="View bookings"
        value={filters.agenda}
        options={['All', 'Today', 'Upcoming', 'Past']}
        onChange={value =>
          onChange('agenda', value as BookingFilters['agenda'])
        }
      />
      <SearchField
        value={filters.search}
        onChangeText={value => onChange('search', value.slice(0, 100))}
        placeholder="Search job, teacher or school"
      />
      <View style={styles.sectionHead}>
        <Text style={styles.cardBody}>{filters.status === 'ALL' ? 'All bookings' : statusLabel(filters.status)} · Latest scheduled first</Text>
        <FilterButton
          count={count}
          onPress={() => {
            setDraft(filters);
            setError('');
            setOpen(true);
          }}
        />
      </View>
      <FilterSheet
        visible={open}
        title="Filter bookings"
        onClose={() => setOpen(false)}
        onApply={apply}
        onReset={() => {
          setDraft({
            ...filters,
            status: 'CONFIRMED',
            from: '',
            to: '',
            invoice: 'ALL',
          });
          setError('');
        }}
      >
        <DynamicSelect
          name="bookingStatus"
          label="Status"
          placeholder="All statuses"
          value={draft.status === 'ALL' ? '' : draft.status}
          onChange={value =>
            setDraft({
              ...draft,
              status: (value || 'ALL') as BookingFilters['status'],
            })
          }
        />
        <DateField
          label="From date"
          value={draft.from}
          onChange={value => {
            setDraft({ ...draft, from: value });
            setError('');
          }}
        />
        <DateField
          label="To date"
          value={draft.to}
          onChange={value => {
            setDraft({ ...draft, to: value });
            setError('');
          }}
        />
        <DynamicSelect
          name="bookingInvoiceState"
          label="Invoice"
          placeholder="All invoice states"
          value={draft.invoice === 'ALL' ? '' : draft.invoice}
          onChange={value =>
            setDraft({
              ...draft,
              invoice: (value || 'ALL') as BookingFilters['invoice'],
            })
          }
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.cardBody}>
            {error}
          </Text>
        ) : null}
      </FilterSheet>
    </View>
  );
}
