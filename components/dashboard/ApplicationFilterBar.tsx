import React from 'react';
import { View } from 'react-native';
import { applicationStatuses } from '../../constants/jobOptions';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import { jobStyles } from './jobStyles';

type Props = { search: string; status: string; onSearch: (value: string) => void;
  onStatus: (value: string) => void };

export default function ApplicationFilterBar({ search, status, onSearch, onStatus }: Props) {
  return (
    <View style={jobStyles.wizard}>
      <Input label="SEARCH APPLICATIONS" required={false} value={search}
        placeholder="Job title or status" onChangeText={onSearch} />
      <Select label="STATUS" value={status} placeholder="All statuses"
        options={['ALL', ...applicationStatuses]} onChange={onStatus} />
    </View>
  );
}
