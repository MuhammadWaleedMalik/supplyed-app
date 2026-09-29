import React from 'react';
import { Text, View } from 'react-native';
import type { TeacherApplication } from '../../feature/dashboard/teacher/store/teacherSlice';
import ApplicationFilterBar from './ApplicationFilterBar';
import { jobStyles } from './jobStyles';
import MyApplicationsList from './MyApplicationsList';

type Props = {
  applications: TeacherApplication[];
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onPoster: (id: string) => void;
};

export default function TeacherApplicationsPanel(props: Props) {
  return (
    <View style={jobStyles.shell}>
      <View style={jobStyles.progressCopy}>
        <Text style={jobStyles.listTitle}>My applications</Text>
        <Text style={jobStyles.modeBody}>
          Track every role from submission to outcome.
        </Text>
      </View>

      <ApplicationFilterBar
        search={props.search}
        status={props.status}
        onSearch={props.onSearch}
        onStatus={props.onStatus}
      />

      <MyApplicationsList
        applications={props.applications}
        onPoster={props.onPoster}
      />
    </View>
  );
}
