import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, MessageCircle, ArrowRight } from 'lucide-react-native';
import type { SchoolApplication } from '../../feature/dashboard/school/store/schoolSlice';
import { displayDate, displayPay } from '../../utils/ui/marketplaceLabels';
import { plannedLabel } from '../../utils/jobs/workSchedule';
import Button from '../Ui/Button';
import RichText from '../Ui/RichText';
import ContentPreview from '../Ui/ContentPreview';
import ConfirmDialog from '../Ui/ConfirmDialog';
import { InfoGrid, RecordSection, StatusBadge } from '../Ui/RecordLayout';
import { createThemedStyles, useTheme } from '../Ui/theme';
import TeacherProfileSummary from './TeacherProfileSummary';
import ApplicationTimeline from './ApplicationTimeline';
import { useAppSelector } from '../../store/hooks';
import type { HirePaymentTerms } from '../../feature/dashboard/shared/apis/applicationsApi';
import Checkbox from '../Ui/Checkbox';
import Input from '../Ui/Input';
import ChoiceField from './ChoiceField';
import Select from '../Ui/Select';

type Props = {
  application: SchoolApplication;
  onBack: () => void;
  onStatus: (
    id: string,
    status: string,
    paymentTerms?: HirePaymentTerms,
  ) => Promise<boolean | void> | void;
  onMessage: (applicationId: string) => void;
  busy?: boolean;
};
const stages = ['APPLIED', 'VIEWED', 'SHORTLISTED', 'HIRED'];
const labels = ['Applied', 'Reviewed', 'Shortlisted', 'Hired'];
export default function SchoolApplicationDetail({
  application,
  onStatus,
  onMessage,
  busy,
}: Props) {
  const styles = useStyles();
  const schoolActive = useAppSelector(
    state => state.schoolDashboard.profileStatus === 'ACTIVE',
  );
  const terms = application.agreedTerms;
  const canHire =
    schoolActive && application.job.status === 'ACTIVE' && !!terms;
  const { colors } = useTheme();
  const [tab, setTab] = useState('Application');
  const [confirm, setConfirm] = useState('');
  const [useNegotiatedTerms, setUseNegotiatedTerms] = useState(false);
  const [payType, setPayType] = useState(
    application.agreedTerms?.payType || 'daily',
  );
  const [payAmount, setPayAmount] = useState(
    application.agreedTerms?.payAmount == null
      ? ''
      : String(application.agreedTerms.payAmount),
  );
  const [paymentFrequency, setPaymentFrequency] = useState(
    application.agreedTerms?.paymentFrequency ||
      (application.agreedTerms?.payType === 'fixed'
        ? 'completion'
        : application.agreedTerms?.payType === 'hourly'
        ? 'hourly'
        : 'daily'),
  );
  const [periodAnchor, setPeriodAnchor] = useState(
    application.agreedTerms?.periodAnchor || 'ASSIGNMENT_START',
  );
  const [hours, setHours] = useState(
    application.agreedTerms?.hours == null
      ? ''
      : String(application.agreedTerms.hours),
  );
  const [days, setDays] = useState(
    application.agreedTerms?.days == null
      ? ''
      : String(application.agreedTerms.days),
  );
  const [hireError, setHireError] = useState('');
  const terminal = ['REJECTED', 'HIRED'].includes(application.status);
  const current = stages.indexOf(application.status);
  const nextStatus =
    application.status === 'APPLIED'
      ? 'VIEWED'
      : application.status === 'VIEWED'
      ? 'SHORTLISTED'
      : 'HIRED';
  const nextLabel =
    nextStatus === 'VIEWED'
      ? 'Mark as reviewed'
      : nextStatus === 'SHORTLISTED'
      ? 'Shortlist teacher'
      : 'Hire teacher';

  function changePayType(value: string) {
    setPayType(value);
    setPaymentFrequency(
      value === 'fixed' ? 'completion' : 'daily',
    );
    if (value !== 'hourly') setHours('');
    if (value !== 'daily') setDays('');
    setHireError('');
  }

  async function confirmHire() {
    if (!useNegotiatedTerms) {
      try {
        await onStatus(application.id, 'HIRED');
        setConfirm('');
      } catch {
        // The parent keeps the backend error visible and the hire form open.
      }
      return;
    }
    const amount = Number(payAmount);
    if (!/^\d+(?:\.\d{1,2})?$/.test(payAmount.trim()) || amount <= 0) {
      setHireError('Enter a positive GBP amount with up to two decimal places.');
      return;
    }
    const scheduleSetsUnits = Boolean(application.agreedTerms?.schedule);
    const unit = payType === 'hourly' ? Number(hours) : Number(days);
    if (
      !scheduleSetsUnits &&
      payType !== 'fixed' &&
      (!Number.isInteger(unit) || unit < 1)
    ) {
      setHireError(
        `Enter planned ${payType === 'hourly' ? 'hours' : 'days'} as a positive whole number.`,
      );
      return;
    }
    const bookingPaymentTerms: HirePaymentTerms = {
      payAmount: amount,
      payType: payType as HirePaymentTerms['payType'],
      paymentFrequency:
        paymentFrequency as HirePaymentTerms['paymentFrequency'],
      ...(['weekly', 'monthly'].includes(paymentFrequency)
        ? {
            periodAnchor:
              periodAnchor as HirePaymentTerms['periodAnchor'],
          }
        : {}),
      ...(!scheduleSetsUnits && payType === 'hourly' ? { hours: unit } : {}),
      ...(!scheduleSetsUnits && payType === 'daily' ? { days: unit } : {}),
    };
    try {
      await onStatus(application.id, 'HIRED', bookingPaymentTerms);
      setConfirm('');
    } catch {
      // The parent keeps the backend error visible and the hire form open.
    }
  }
  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.top}>
          <Text style={styles.eyebrow}>CANDIDATE REVIEW</Text>
          <StatusBadge status={application.status} />
        </View>
        <ContentPreview accessibilityRole="header" title="Applied role" text={terms?.title || application.jobName || 'Teaching role'} style={styles.title} lines={3} />
        <Text style={styles.subtitle}>
          Received {displayDate(application.createdAt)}
        </Text>
        <View style={styles.identity}>
          <TeacherProfileSummary teacherId={application.instructorId} compact />
        </View>
        <Button
          title="Message teacher"
          icon={<MessageCircle size={17} color={colors.brandDark} />}
          variant="outline"
          onPress={() => onMessage(application.id)}
        />
        {application.scheduleConflict ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            Availability changed: {application.scheduleConflict.conflicts.length}{' '}
            required{' '}
            {application.scheduleConflict.conflicts.length === 1
              ? 'shift now conflicts'
              : 'shifts now conflict'}
            . Recheck before hiring.
          </Text>
        ) : null}
      </View>
      <RecordSection
        title="Application progress"
        subtitle={
          application.status === 'REJECTED'
            ? 'This application is closed. Its history is still available.'
            : application.status === 'HIRED'
            ? 'The teacher is hired. Manage the placement in Bookings.'
            : 'Review the proposal and profile, then choose your next step.'
        }
      >
        <View style={styles.progress}>
          {stages.map((stage, index) => (
            <View style={styles.stage} key={stage}>
              <View
                style={[
                  styles.stageCircle,
                  index <= current && styles.stageDone,
                ]}
              >
                {index < current ? (
                  <Check size={15} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.stageNumber,
                      index <= current && styles.white,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stageLabel,
                  index === current && styles.currentLabel,
                ]}
              >
                {labels[index]}
              </Text>
            </View>
          ))}
        </View>
        {!terminal ? (
          <>
            <Button
              loading={busy}
              disabled={
                busy || !schoolActive || (nextStatus === 'HIRED' && !canHire)
              }
              title={nextLabel}
              icon={<ArrowRight size={17} color="#fff" />}
              onPress={() =>
                nextStatus === 'HIRED'
                  ? setConfirm('HIRED')
                  : onStatus(application.id, nextStatus)
              }
            />
            {nextStatus !== 'HIRED' ? (
              <Button
                title="Ready to hire? Hire teacher"
                variant="link"
                disabled={busy || !canHire}
                onPress={() => setConfirm('HIRED')}
              />
            ) : null}
          </>
        ) : null}
        {!terminal && !canHire ? (
          <Text style={styles.subtitle}>
            {!terms
              ? 'This older application has no recorded offer. Send an invitation for explicit acceptance before hiring.'
              : 'Hiring requires an active school and an active, unreserved job.'}
          </Text>
        ) : null}
      </RecordSection>
      <View style={styles.tabs}>
        {['Application', 'Teacher profile', 'Activity'].map(value => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === value }}
            onPress={() => setTab(value)}
            style={[styles.tab, tab === value && styles.selectedTab]}
          >
            <Text
              style={[styles.tabText, tab === value && styles.selectedText]}
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'Application' ? (
        <>
          <RecordSection
            title="Application proposal"
            subtitle="The teacher's introduction and relevant experience."
          >
            <RichText
              value={application.coverLetter}
              emptyText="The teacher applied without a cover letter. You can ask a question in Messages."
            />
          </RecordSection>
          <RecordSection title="Placement overview">
            {terms?.description ? <RichText value={terms.description} /> : null}
            <InfoGrid
              items={[
                {
                  label: 'Planned work',
                  value: terms ? plannedLabel(terms) : 'Not recorded',
                },
                {
                  label: 'Subjects / key stages',
                  value:
                    [
                      ...(terms?.subjects || []),
                      ...(terms?.keyStages || []),
                    ].join(' · ') || 'Not recorded',
                },
                {
                  label: 'Starts',
                  value: displayDate(terms?.startDate),
                },
                { label: 'Ends', value: displayDate(terms?.endDate) },
                {
                  label: 'Agreed pay',
                  value: displayPay(terms?.payAmount, terms?.payType),
                },
                {
                  label: 'Location',
                  value: [terms?.address, terms?.city, terms?.postalCode]
                    .filter(Boolean)
                    .join(', '),
                },
              ]}
            />
          </RecordSection>
        </>
      ) : tab === 'Teacher profile' ? (
        <TeacherProfileSummary teacherId={application.instructorId} />
      ) : (
        <RecordSection title="Application activity">
          <ApplicationTimeline
            key={application.status}
            applicationId={application.id}
            initiallyOpen
          />
        </RecordSection>
      )}
      {!terminal ? (
        <View style={styles.decision}>
          <Text style={styles.subtitle}>Not the right fit for this role?</Text>
          <Button
            title="Reject application"
            variant="link"
            disabled={busy || !schoolActive}
            onPress={() => setConfirm('REJECTED')}
          />
        </View>
      ) : null}
      {confirm === 'HIRED' ? (
        <RecordSection
          title="Hire and create booking"
          subtitle="The original application terms stay unchanged. Optional negotiated payment terms apply only to the booking."
        >
          <Checkbox
            label="Use negotiated payment terms for this booking"
            checked={useNegotiatedTerms}
            disabled={busy}
            onChange={setUseNegotiatedTerms}
          />
          {useNegotiatedTerms ? (
            <View style={styles.negotiatedTerms}>
              <ChoiceField
                label="RATE BASIS"
                value={payType}
                options={['hourly', 'daily', 'fixed']}
                onChange={changePayType}
              />
              <Input
                label="RATE AMOUNT (£)"
                number
                value={payAmount}
                onChangeText={setPayAmount}
              />
              <Select
                label="CURRENCY"
                value="GBP"
                placeholder="Currency"
                options={[{ value: 'GBP', label: 'GBP — British pound' }]}
                disabled
                onChange={() => {}}
              />
              <Select
                label="PAYMENT FREQUENCY"
                value={paymentFrequency}
                placeholder="Choose payment frequency"
                options={
                  payType === 'fixed'
                    ? [{ value: 'completion', label: 'After completion' }]
                    : payType === 'daily'
                    ? ['daily', 'weekly', 'monthly']
                    : ['daily', 'weekly', 'monthly']
                }
                onChange={setPaymentFrequency}
              />
              {['weekly', 'monthly'].includes(paymentFrequency) ? (
                <Select
                  label="PAYMENT PERIOD BOUNDARY"
                  value={periodAnchor}
                  placeholder="Choose period boundary"
                  options={[
                    { value: 'ASSIGNMENT_START', label: 'Assignment start' },
                    { value: 'CALENDAR', label: 'Calendar periods' },
                  ]}
                  onChange={value =>
                    setPeriodAnchor(
                      value as 'ASSIGNMENT_START' | 'CALENDAR',
                    )
                  }
                />
              ) : null}
              {!application.agreedTerms?.schedule && payType === 'hourly' ? (
                <Input
                  label="PLANNED HOURS"
                  number
                  value={hours}
                  onChangeText={setHours}
                />
              ) : null}
              {!application.agreedTerms?.schedule && payType === 'daily' ? (
                <Input
                  label="PLANNED DAYS"
                  number
                  value={days}
                  onChangeText={setDays}
                />
              ) : null}
            </View>
          ) : null}
          {hireError ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {hireError}
            </Text>
          ) : null}
          <Button
            title="Hire & create booking"
            disabled={busy}
            loading={busy}
            onPress={confirmHire}
          />
          <Button
            title="Cancel"
            variant="link"
            disabled={busy}
            onPress={() => setConfirm('')}
          />
        </RecordSection>
      ) : null}
      {confirm === 'REJECTED' ? (
        <ConfirmDialog
          key={confirm}
          visible
          title="Reject this application?"
          context={application.job.title}
          description="The teacher will be notified and this application will close. You can still read its history."
          confirmLabel="Reject application"
          destructive
          onClose={() => setConfirm('')}
          onConfirm={() => onStatus(application.id, 'REJECTED')}
        />
      ) : null}
    </View>
  );
}
const useStyles = createThemedStyles((colors, _common, layout) => ({
  page: { gap: 18 },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eyebrow: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 22 },
  identity: {
    marginVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 18,
  },
  progress: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  stage: { flexGrow: 1, flexBasis: layout.compact ? '45%' : 0, minWidth: 0, alignItems: 'center', gap: 8 },
  stageCircle: {
    minHeight: 30,
    minWidth: 30,
    padding: 4,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  stageDone: { backgroundColor: colors.brandDark },
  stageNumber: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  white: { color: '#fff' },
  stageLabel: { maxWidth: '100%', color: colors.muted, fontSize: 10, textAlign: 'center' },
  currentLabel: { color: colors.brandDark, fontWeight: '700' },
  tabs: {
    flexDirection: layout.compact ? 'column' : 'row',
    borderRadius: 14,
    backgroundColor: '#e9eef2',
    padding: 4,
    gap: 3,
  },
  tab: {
    flex: layout.compact ? 0 : 1,
    minHeight: 44,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  selectedTab: { backgroundColor: '#fff' },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedText: { color: colors.brandDark },
  decision: { alignItems: 'center', paddingVertical: 12 },
  errorText: { color: '#b42318', fontSize: 12, lineHeight: 19 },
  negotiatedTerms: { gap: 12 },
}));
