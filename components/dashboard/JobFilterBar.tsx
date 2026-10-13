import React from 'react';
import { View } from 'react-native';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import { useJobStyles } from './jobStyles';

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
  const jobStyles = useJobStyles();

  return (
    <View style={jobStyles.wizard}>
      <Input
        label="SEARCH POSTED JOBS"
        required={false}
        value={search}
        placeholder="Title, subject, or city"
        onChangeText={onSearch}
      />
      <Select
        label="STATUS"
        value={status}
        placeholder="All jobs"
        options={[...statuses]}
        onChange={onStatus}
      />
    </View>
  );
}
