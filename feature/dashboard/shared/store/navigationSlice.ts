import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DashboardPage =
  | 'Dashboard'
  | 'Jobs'
  | 'Applications'
  | 'Bookings'
  | 'Billing'
  | 'Messages'
  | 'Notifications'
  | 'History'
  | 'Invitations'
  | 'Teachers';

type NavigationState = {
  dataRevision: number;
  invitationId: string;
  conversationId: string;
  duplicateJobId: string;
  returnPage: DashboardPage | null;
  notificationOrigin: boolean;
  notificationBookingId: string;
  page: DashboardPage;
  messageApplicationId: string;
  messageBookingId: string;
  notificationJobId: string;
  notificationApplicationId: string;
  notificationApplicationJobId: string;
};

const initialState: NavigationState = {
  dataRevision: 0,
  invitationId: '',
  conversationId: '',
  duplicateJobId: '',
  returnPage: null,
  notificationOrigin: false,
  notificationBookingId: '',
  page: 'Dashboard',
  messageApplicationId: '',
  messageBookingId: '',
  notificationJobId: '',
  notificationApplicationId: '',
  notificationApplicationJobId: '',
};

const navigationSlice = createSlice({
  name: 'dashboardNavigation',
  initialState,
  reducers: {
    refreshMarketplace(state) {
      state.dataRevision += 1;
    },
    openInvitation(state, action: PayloadAction<string>) {
      if (state.page === 'Notifications') state.notificationOrigin = true;
      state.returnPage =
        state.page === 'Invitations' ? state.returnPage : state.page;
      state.invitationId = action.payload;
      state.page = 'Invitations';
    },
    openConversation(state, action: PayloadAction<string>) {
      if (state.page !== 'Messages') state.returnPage = state.page;
      if (state.page === 'Notifications') state.notificationOrigin = true;
      state.page = 'Messages';
      state.messageApplicationId = '';
      state.messageBookingId = '';
      state.conversationId = action.payload;
    },
    clearMessageApplication(state) {
      state.messageApplicationId = '';
      state.messageBookingId = '';
      state.conversationId = '';
    },
    showPage(state, action: PayloadAction<DashboardPage>) {
      state.invitationId = '';
      state.conversationId = '';
      state.duplicateJobId = '';
      state.returnPage = null;
      state.notificationOrigin = false;
      state.notificationBookingId = '';
      state.page = action.payload;
      state.notificationJobId = '';
      state.notificationApplicationId = '';
      state.notificationApplicationJobId = '';

      if (action.payload !== 'Messages') {
        state.messageApplicationId = '';
        state.messageBookingId = '';
      }
    },
    openMessages(state, action: PayloadAction<string>) {
      state.conversationId = '';
      state.messageBookingId = '';
      if (state.page !== 'Messages') state.returnPage = state.page;
      if (state.page === 'Notifications') state.notificationOrigin = true;
      state.page = 'Messages';
      state.messageApplicationId = action.payload;
    },
    openBookingMessages(state, action: PayloadAction<string>) {
      state.conversationId = '';
      state.messageApplicationId = '';
      if (state.page !== 'Messages') state.returnPage = state.page;
      if (state.page === 'Notifications') state.notificationOrigin = true;
      state.page = 'Messages';
      state.messageBookingId = action.payload;
    },
    openNotificationJob(state, action: PayloadAction<string>) {
      state.notificationOrigin = true;
      state.returnPage = 'Notifications';
      state.page = 'Jobs';
      state.notificationJobId = action.payload;
    },
    openJob(state, action: PayloadAction<string>) {
      if (state.page !== 'Jobs') state.returnPage = state.page;
      state.notificationJobId = action.payload;
      state.page = 'Jobs';
    },
    openNotificationApplications(
      state,
      action: PayloadAction<{ applicationId?: string; jobId?: string }>,
    ) {
      state.notificationOrigin = true;
      state.returnPage = 'Notifications';
      state.page = 'Applications';
      state.notificationApplicationId = action.payload.applicationId || '';
      state.notificationApplicationJobId = action.payload.jobId || '';
    },
    openNotificationBooking(state, action: PayloadAction<string | undefined>) {
      state.page = 'Bookings';
      state.notificationBookingId = action.payload || '';
      state.notificationOrigin = true;
      state.returnPage = 'Notifications';
    },
    openBooking(state, action: PayloadAction<string>) {
      if (state.page !== 'Bookings') state.returnPage = state.page;
      state.notificationBookingId = action.payload;
      state.page = 'Bookings';
    },
    startJobCopy(state, action: PayloadAction<string>) {
      state.returnPage = state.page;
      state.page = 'Jobs';
      state.duplicateJobId = action.payload;
    },
    clearJobCopy(state) {
      state.duplicateJobId = '';
    },
    openNotificationPage(state, action: PayloadAction<DashboardPage>) {
      state.page = action.payload;
      state.notificationOrigin = true;
      state.returnPage = 'Notifications';
    },
    goBackToSource(state) {
      state.conversationId = '';
      state.invitationId = '';
      state.page = state.returnPage || 'Notifications';
      state.messageApplicationId = '';
      state.messageBookingId = '';
      state.returnPage =
        state.page === 'Notifications'
          ? null
          : state.notificationOrigin
          ? 'Notifications'
          : null;
      if (state.page === 'Notifications') {
        state.notificationOrigin = false;
        state.notificationBookingId = '';
        state.notificationJobId = '';
        state.notificationApplicationId = '';
        state.notificationApplicationJobId = '';
      }
    },
    resetDashboardNavigation() {
      return initialState;
    },
  },
});

export const {
  refreshMarketplace,
  openInvitation,
  openBooking,
  openConversation,
  showPage,
  openMessages,
  openBookingMessages,
  openNotificationJob,
  openJob,
  openNotificationApplications,
  resetDashboardNavigation,
} = navigationSlice.actions;
export const { clearMessageApplication } = navigationSlice.actions;
export const { goBackToSource, openNotificationBooking, openNotificationPage } =
  navigationSlice.actions;
export const { startJobCopy, clearJobCopy } = navigationSlice.actions;

export default navigationSlice.reducer;
