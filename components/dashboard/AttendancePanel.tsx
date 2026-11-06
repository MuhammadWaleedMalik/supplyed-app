import React, { useState } from 'react';
import { Text, View } from 'react-native';
import {
  activateAttendance,
  AttendanceShift,
  Booking,
  correctAttendance,
  recordAttendance,
  reviewAttendanceCorrection,
} from '../../feature/dashboard/shared/apis/bookingsApi';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import { useStyles } from './dashboardStyles';

type Props = {
  booking: Booking;
  disabled: boolean;
  onRun: (action: () => Promise<unknown>) => Promise<boolean>;
};

function when(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : value;
}

function statusLabel(status: string) {
  return status.toLowerCase().replace(/_/g, ' ');
}

export default function AttendancePanel({ booking, disabled, onRun }: Props) {
  const styles = useStyles();
  const [editing, setEditing] = useState('');
  const [reason, setReason] = useState('');

  async function run(action: () => Promise<unknown>) {
    if (await onRun(action)) {
      setEditing('');
      setReason('');
    }
  }

  function shiftActions(shift: AttendanceShift) {
    const correcting = editing === 'correct:' + shift.id;
    if (shift.status === 'AWAITING_CONFIRMATION') {
      return (
        <View style={styles.quickButtons}>
          <Button
            title="Confirm present"
            compact
            disabled={disabled}
            onPress={() => run(() => recordAttendance(booking.id, shift.id, 'PRESENT'))}
          />
          <Button
            title="Record absent"
            variant="social"
            compact
            disabled={disabled}
            onPress={() => run(() => recordAttendance(booking.id, shift.id, 'ABSENT'))}
          />
        </View>
      );
    }
    return correcting ? (
      <View style={styles.quickButtons}>
        <Input
          label="CORRECTION REASON"
          multiline
          maxLength={1000}
          value={reason}
          disabled={disabled}
          onChangeText={setReason}
        />
        <Button
          title={shift.status === 'PRESENT' ? 'Correct to absent' : 'Correct to present'}
          disabled={disabled || reason.trim().length < 3}
          onPress={() =>
            run(() =>
              correctAttendance(
                booking.id,
                shift.id,
                shift.status === 'PRESENT' ? 'ABSENT' : 'PRESENT',
                reason,
              ),
            )
          }
        />
        <Button title="Cancel correction" variant="link" onPress={() => setEditing('')} />
      </View>
    ) : (
      <Button
        title="Correct attendance"
        variant="link"
        compact
        disabled={disabled}
        onPress={() => {
          setEditing('correct:' + shift.id);
          setReason('');
        }}
      />
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>ATTENDANCE</Text>
      {!booking.attendancePolicyEffectiveAt ? (
        <>
          <Text style={styles.cardBody}>
            Start tracking to create the scheduled shifts for this booking. Only completed shifts can be decided.
          </Text>
          <Button
            title="Start attendance tracking"
            variant="social"
            disabled={disabled}
            onPress={() => run(() => activateAttendance(booking.id))}
          />
        </>
      ) : null}
      {(booking.attendanceShifts || []).map(shift => {
        const pending = (shift.correctionRequests || []).find(
          request => request.status === 'PENDING',
        );
        const reviewing = pending && editing === 'review:' + pending.id;
        return (
          <View key={shift.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {when(shift.scheduledStart)}–{when(shift.scheduledEnd)}
            </Text>
            <Text style={styles.cardBody}>
              {statusLabel(shift.status)}
              {shift.reason ? ' · ' + shift.reason : ''}
            </Text>
            {shiftActions(shift)}
            {pending ? (
              <View style={styles.quickButtons}>
                <Text style={styles.cardBody}>
                  Correction requested: {statusLabel(pending.requestedStatus)} · {pending.reason}
                </Text>
                {reviewing ? (
                  <>
                    <Input
                      label="DECISION REASON"
                      multiline
                      maxLength={1000}
                      value={reason}
                      onChangeText={setReason}
                      disabled={disabled}
                    />
                    <Button
                      title="Approve correction"
                      disabled={disabled || reason.trim().length < 3}
                      onPress={() => run(() => reviewAttendanceCorrection(booking.id, pending.id, 'APPROVED', reason))}
                    />
                    <Button
                      title="Reject correction"
                      variant="danger"
                      disabled={disabled || reason.trim().length < 3}
                      onPress={() => run(() => reviewAttendanceCorrection(booking.id, pending.id, 'REJECTED', reason))}
                    />
                    <Button title="Cancel" variant="link" onPress={() => setEditing('')} />
                  </>
                ) : (
                  <Button
                    title="Review correction request"
                    variant="social"
                    disabled={disabled}
                    onPress={() => {
                      setEditing('review:' + pending.id);
                      setReason('');
                    }}
                  />
                )}
              </View>
            ) : null}
          </View>
        );
      })}
      {booking.attendancePolicyEffectiveAt && !(booking.attendanceShifts || []).length ? (
        <Text style={styles.cardBody}>No eligible attendance shifts are available yet.</Text>
      ) : null}
    </View>
  );
}
