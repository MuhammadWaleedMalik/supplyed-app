import { combineReducers, configureStore, createAction } from '@reduxjs/toolkit';
import { getSessionVersion, onSessionChanged } from '../utils/api/session';
import schoolDashboard from '../feature/dashboard/school/store/schoolSlice';
import dashboardNavigation from '../feature/dashboard/shared/store/navigationSlice';
import teacherDashboard from '../feature/dashboard/teacher/store/teacherSlice';
import conversations from '../feature/dashboard/shared/store/conversationsSlice';
import notifications from '../feature/dashboard/shared/store/notificationsSlice';

const resetSessionState = createAction('session/resetState');
const appReducer = combineReducers({
    conversations,
    notifications,
    dashboardNavigation,
    schoolDashboard,
    teacherDashboard,
});

export const store = configureStore({
  reducer: (state: ReturnType<typeof appReducer> | undefined, action) =>
    appReducer(resetSessionState.match(action) ? undefined : state, action),
});

let sessionVersion = getSessionVersion();
onSessionChanged(() => {
  const nextVersion = getSessionVersion();
  if (nextVersion !== sessionVersion) {
    sessionVersion = nextVersion;
    store.dispatch(resetSessionState());
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
