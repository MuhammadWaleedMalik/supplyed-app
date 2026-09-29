import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Application } from '../../shared/apis/applicationsApi';
import type { Job } from '../../shared/apis/jobsApi';

export type TeacherApplication = Application & {
  job?: Job;
};

type TeacherDashboardState = {
  jobs: Job[];
  applications: TeacherApplication[];
  loading: boolean;
  error: string;
};

const initialState: TeacherDashboardState = {
  jobs: [],
  applications: [],
  loading: false,
  error: '',
};

const teacherSlice = createSlice({
  name: 'teacherDashboard',
  initialState,
  reducers: {
    startTeacherLoading(state) {
      state.loading = true;
      state.error = '';
    },
    setTeacherData(
      state,
      action: PayloadAction<{
        jobs: Job[];
        applications: TeacherApplication[];
      }>,
    ) {
      state.jobs = action.payload.jobs;
      state.applications = action.payload.applications;
      state.loading = false;
      state.error = '';
    },
    setTeacherApplications(state, action: PayloadAction<TeacherApplication[]>) {
      state.applications = action.payload;
      state.loading = false;
      state.error = '';
    },
    setTeacherError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  startTeacherLoading,
  setTeacherData,
  setTeacherApplications,
  setTeacherError,
} = teacherSlice.actions;

export default teacherSlice.reducer;
