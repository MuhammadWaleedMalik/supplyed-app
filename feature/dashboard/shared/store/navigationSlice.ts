import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DashboardPage =
  | 'Dashboard'
  | 'Jobs'
  | 'Applications'
  | 'Bookings'
  | 'Billing'
  | 'Messages'
  | 'Interviews';

type NavigationState = {
  page: DashboardPage;
  messageRecipientId: string;
};

const initialState: NavigationState = {
  page: 'Dashboard',
  messageRecipientId: '',
};

const navigationSlice = createSlice({
  name: 'dashboardNavigation',
  initialState,
  reducers: {
    showPage(state, action: PayloadAction<DashboardPage>) {
      state.page = action.payload;

      if (action.payload !== 'Messages') {
        state.messageRecipientId = '';
      }
    },
    openMessages(state, action: PayloadAction<string>) {
      state.page = 'Messages';
      state.messageRecipientId = action.payload;
    },
    resetDashboardNavigation() {
      return initialState;
    },
  },
});

export const {
  showPage,
  openMessages,
  resetDashboardNavigation,
} = navigationSlice.actions;

export default navigationSlice.reducer;
