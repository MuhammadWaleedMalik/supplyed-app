import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, MessageCircle, ArrowRight } from 'lucide-react-native';
import type { SchoolApplication } from '../../feature/dashboard/school/store/schoolSlice';
import { displayDate, displayPay } from '../../utils/ui/marketplaceLabels';
import Button from '../Ui/Button';
import RichText from '../Ui/RichText';
import ConfirmDialog from '../Ui/ConfirmDialog';
import { InfoGrid, RecordSection, StatusBadge } from '../Ui/RecordLayout';
import { createThemedStyles, useTheme } from '../Ui/theme';
import TeacherProfileSummary from './TeacherProfileSummary';
import ApplicationTimeline from './ApplicationTimeline';

type Props = {
  application: SchoolApplication;
  onBack: () => void;
  onStatus: (id: string, status: string) => Promise<boolean | void> | void;
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
  const { colors } = useTheme();
  const [tab, setTab] = useState('Application');
  const [confirm, setConfirm] = useState('');
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
  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.top}>
          <Text style={styles.eyebrow}>CANDIDATE REVIEW</Text>
          <StatusBadge status={application.status} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {application.job.title}
        </Text>
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
                disabled={busy}
                onPress={() => setConfirm('HIRED')}
              />
            ) : null}
          </>
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
            <InfoGrid
              items={[
                {
                  label: 'Starts',
                  value: displayDate(application.job.startDate),
                },
                { label: 'Ends', value: displayDate(application.job.endDate) },
                {
                  label: 'Agreed pay',
                  value: displayPay(
                    application.job.payAmount,
                    application.job.payType,
                  ),
                },
                {
                  label: 'Location',
                  value: [
                    application.job.address,
                    application.job.city,
                    application.job.postalCode,
                  ]
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
            disabled={busy}
            onPress={() => setConfirm('REJECTED')}
          />
        </View>
      ) : null}
      {confirm ? (
        <ConfirmDialog
          key={confirm}
          visible
          title={
            confirm === 'HIRED'
              ? 'Confirm this hire'
              : 'Reject this application?'
          }
          context={application.job.title}
          description={
            confirm === 'HIRED'
              ? 'Hiring creates a confirmed booking for this teacher and closes the role to other applicants. Continue only when you are ready to book this placement.'
              : 'The teacher will be notified and this application will close. You can still read its history.'
          }
          confirmLabel={
            confirm === 'HIRED' ? 'Confirm hire' : 'Reject application'
          }
          destructive={confirm === 'REJECTED'}
          onClose={() => setConfirm('')}
          onConfirm={() => onStatus(application.id, confirm)}
        />
      ) : null}
    </View>
  );
}
const useStyles = createThemedStyles(colors => ({
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
  progress: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  stage: { flex: 1, alignItems: 'center', gap: 8 },
  stageCircle: {
    height: 30,
    width: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  stageDone: { backgroundColor: colors.brandDark },
  stageNumber: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  white: { color: '#fff' },
  stageLabel: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  currentLabel: { color: colors.brandDark, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: '#e9eef2',
    padding: 4,
    gap: 3,
  },
  tab: {
    flex: 1,
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
}));
