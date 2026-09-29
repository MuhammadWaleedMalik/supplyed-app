import React from 'react';
import { View } from 'react-native';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import { jobStyles } from './jobStyles';

type Props = {
  search: string;
  onSearch: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
};

export default function JobFilterBar({ search, onSearch, status, onStatus }: Props) {
  return (
    <View style={jobStyles.wizard}>
      <Input label="SEARCH POSTED JOBS" required={false} value={search}
        placeholder="Title, subject, or city" onChangeText={onSearch} />
      <Select label="STATUS" value={status} placeholder="All jobs"
        options={['ALL', 'ACTIVE', 'INACTIVE']} onChange={onStatus} />
    </View>
  );
}