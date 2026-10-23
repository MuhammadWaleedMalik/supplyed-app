import React from 'react';
import { Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  goBackToSource,
  showPage,
} from '../../feature/dashboard/shared/store/navigationSlice';
import Button from '../Ui/Button';
import DetailHeader from '../Ui/DetailHeader';
import { useStyles } from './dashboardStyles';

export default function NavigationContext() {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const nav = useAppSelector(state => state.dashboardNavigation);
  if (!nav.returnPage || nav.page === 'Notifications') return null;
  const focused = Boolean(
    nav.notificationJobId ||
      nav.notificationApplicationId ||
      nav.notificationApplicationJobId ||
      nav.notificationBookingId,
  );
  return (
    <View style={styles.detailHeader}>
      {nav.notificationOrigin ? (
        <Text style={styles.teacherMeta}>
          {focused
            ? 'Showing the record linked from your notification.'
            : 'Opened from your notifications.'}
        </Text>
      ) : null}
      <DetailHeader title={nav.page} subtitle="Linked record" backLabel={`Return to ${nav.returnPage}`} onBack={() => dispatch(goBackToSource())} />
      {focused && nav.page !== 'Messages' ? (
        <Button
          title={`Show all ${nav.page.toLowerCase()}`}
          variant="link"
          compact
          onPress={() => dispatch(showPage(nav.page))}
        />
      ) : null}
    </View>
  );
}
