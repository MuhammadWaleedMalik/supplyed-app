import { configureStore } from '@reduxjs/toolkit';
import schoolDashboard from '../feature/dashboard/school/store/schoolSlice';
import dashboardNavigation from '../feature/dashboard/shared/store/navigationSlice';
import teacherDashboard from '../feature/dashboard/teacher/store/teacherSlice';

export const store = configureStore({
  reducer: {
    dashboardNavigation,
    schoolDashboard,
    teacherDashboard,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
