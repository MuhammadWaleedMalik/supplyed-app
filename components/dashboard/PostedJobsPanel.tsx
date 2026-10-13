import { Plus } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import Button from '../Ui/Button';
import JobFilterBar from './JobFilterBar';
import { useJobStyles } from './jobStyles';
import SchoolJobList from './SchoolJobList';

type Props = {
  jobs: Job[];
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onPost: () => void;
  onSelect: (id: string) => void;
};

export default function PostedJobsPanel(props: Props) {
  const jobStyles = useJobStyles();

  return (
    <View style={jobStyles.shell}>
      <View style={jobStyles.listHeader}>
        <View style={jobStyles.titleCopy}>
          <Text style={jobStyles.listTitle}>My posted jobs</Text>
          <Text style={jobStyles.modeBody}>
            Manage your jobs and review their applications.
          </Text>
        </View>
        <Button
          title="Post a job"
          compact
          icon={<Plus color="#ffffff" size={18} />}
          onPress={props.onPost}
        />
      </View>
      <JobFilterBar
        search={props.search}
        onSearch={props.onSearch}
        status={props.status}
        onStatus={props.onStatus}
        statuses={['ALL', 'ACTIVE', 'DRAFT']}
      />
      <SchoolJobList jobs={props.jobs} onSelect={props.onSelect} />
    </View>
  );
}
