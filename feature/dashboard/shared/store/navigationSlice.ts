import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DashboardPage =
  | 'Dashboard'
  | 'Jobs'
  | 'Applications'
  | 'Bookings'
  | 'Billing'
  | 'Messages'
  | 'Notifications'
  | 'History';

type NavigationState = {
  page: DashboardPage;
  messageApplicationId: string;
  notificationJobId: string;
  notificationApplicationId: string;
  notificationApplicationJobId: string;
};

const initialState: NavigationState = {
  page: 'Dashboard',
  messageApplicationId: '',
  notificationJobId: '',
  notificationApplicationId: '',
  notificationApplicationJobId: '',
};

const navigationSlice = createSlice({
  name: 'dashboardNavigation',
  initialState,
  reducers: {
    clearMessageApplication(state) {
      state.messageApplicationId = '';
    },
    showPage(state, action: PayloadAction<DashboardPage>) {
      state.page = action.payload;
      state.notificationJobId = '';
      state.notificationApplicationId = '';
      state.notificationApplicationJobId = '';

      if (action.payload !== 'Messages') {
        state.messageApplicationId = '';
      }
    },
    openMessages(state, action: PayloadAction<string>) {
      state.page = 'Messages';
      state.messageApplicationId = action.payload;
    },
    openNotificationJob(state, action: PayloadAction<string>) {
      state.page = 'Jobs';
      state.notificationJobId = action.payload;
    },
    openNotificationApplications(
      state,
      action: PayloadAction<{ applicationId?: string; jobId?: string }>,
    ) {
      state.page = 'Applications';
      state.notificationApplicationId = action.payload.applicationId || '';
      state.notificationApplicationJobId = action.payload.jobId || '';
    },
    resetDashboardNavigation() {
      return initialState;
    },
  },
});

export const { showPage, openMessages, openNotificationJob, openNotificationApplications, resetDashboardNavigation } =
  navigationSlice.actions;
export const { clearMessageApplication } = navigationSlice.actions;

export default navigationSlice.reducer;
