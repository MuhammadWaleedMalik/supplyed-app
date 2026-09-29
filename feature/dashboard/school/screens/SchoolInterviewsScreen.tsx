import React from 'react';
import { Text, View } from 'react-native';
import SchoolApplicationList from '../../../../components/dashboard/SchoolApplicationList';
import { jobStyles } from '../../../../components/dashboard/jobStyles';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { showPage } from '../../shared/store/navigationSlice';
import { selectSchoolApplication } from '../store/schoolSlice';

export default function SchoolInterviewsScreen() {
  const dispatch = useAppDispatch();
  const applications = useAppSelector(state =>
    state.schoolDashboard.applications.filter(
      application => application.status === 'INTERVIEW',
    ),
  );

  function openApplication(id: string) {
    dispatch(selectSchoolApplication(id));
    dispatch(showPage('Applications'));
  }

  return (
    <View style={jobStyles.shell}>
      <View style={jobStyles.progressCopy}>
        <Text style={jobStyles.listTitle}>Interviews</Text>
        <Text style={jobStyles.modeBody}>
          Teacher applications currently at interview stage.
        </Text>
      </View>
      <SchoolApplicationList
        applications={applications}
        onOpen={openApplication}
      />
    </View>
  );
}
