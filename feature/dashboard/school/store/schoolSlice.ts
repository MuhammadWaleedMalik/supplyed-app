import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Application } from '../../shared/apis/applicationsApi';
import type { Job } from '../../shared/apis/jobsApi';

export type SchoolApplication = Application & {
  job: Job;
};

type SchoolDashboardState = {
  jobs: Job[];
  applications: SchoolApplication[];
  selectedJobId: string;
  selectedApplicationId: string;
  loading: boolean;
  error: string;
};

const initialState: SchoolDashboardState = {
  jobs: [],
  applications: [],
  selectedJobId: '',
  selectedApplicationId: '',
  loading: false,
  error: '',
};

const schoolSlice = createSlice({
  name: 'schoolDashboard',
  initialState,
  reducers: {
    upsertSchoolApplication(state, action: PayloadAction<SchoolApplication>) {
      const index = state.applications.findIndex(
        item => item.id === action.payload.id,
      );
      if (index < 0) state.applications.push(action.payload);
      else state.applications[index] = action.payload;
    },
    upsertSchoolJob(state, action: PayloadAction<Job>) {
      const index = state.jobs.findIndex(job => job.id === action.payload.id);
      if (index < 0) state.jobs.unshift(action.payload);
      else state.jobs[index] = action.payload;
    },
    startSchoolLoading(state) {
      state.loading = true;
      state.error = '';
    },
    setSchoolData(
      state,
      action: PayloadAction<{
        jobs: Job[];
        applications: SchoolApplication[];
      }>,
    ) {
      state.jobs = action.payload.jobs;
      state.applications = action.payload.applications;
      state.loading = false;
      state.error = '';
    },
    setSchoolError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    selectSchoolJob(state, action: PayloadAction<string>) {
      state.selectedJobId = action.payload;
      state.selectedApplicationId = '';
    },
    clearSchoolJobSelection(state) {
      state.selectedJobId = '';
      state.selectedApplicationId = '';
    },
    selectSchoolApplication(state, action: PayloadAction<string>) {
      state.selectedApplicationId = action.payload;
    },
    clearSchoolApplicationSelection(state) {
      state.selectedApplicationId = '';
    },
  },
});

export const {
  upsertSchoolApplication,
  upsertSchoolJob,
  startSchoolLoading,
  setSchoolData,
  setSchoolError,
  selectSchoolJob,
  clearSchoolJobSelection,
  selectSchoolApplication,
  clearSchoolApplicationSelection,
} = schoolSlice.actions;

export default schoolSlice.reducer;
