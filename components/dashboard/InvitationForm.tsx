import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { changeSchedule, listingInstant, validateDateWindow } from '../../utils/jobs/workSchedule';
import { richTextToPlainText } from '../../utils/ui/richText';
import { zonedToIso } from '../../utils/jobs/londonTime';
import { getSessionVersion } from '../../utils/api/session';
import { checkDropdown } from '../../feature/dropdowns/apis/dropdownsApi';
import {
  cleanJob,
  getMyJob,
  getMyJobs,
  Job,
  JobForm,
} from '../../feature/dashboard/shared/apis/jobsApi';
import {
  InvitationRequest,
  newRequestId,
  PendingInvitation,
  readPendingInvitation,
  sendInvitation,
} from '../../feature/dashboard/shared/apis/invitationsApi';
import { useAppDispatch } from '../../store/hooks';
import {
  openConversation,
  refreshMarketplace,
} from '../../feature/dashboard/shared/store/navigationSlice';
import { saveConversation } from '../../feature/dashboard/shared/store/conversationsSlice';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import DynamicSelect from '../Ui/DynamicSelect';
import WorkDateField from '../Ui/WorkDateField';
import { createThemedStyles, useTheme } from '../Ui/theme';
import JobDetailsStep from './JobDetailsStep';
import ChoiceField from './ChoiceField';
import InvitationReview, {
  invitationDate,
  InvitationTerms,
} from './InvitationReview';

const emptyJob: JobForm = {
  addressMode: 'different',
  hours: '',
  days: '',
  mode: 'brief',
  title: '',
  description: '',
  subject: '',
  requiredSkills: '',
  keyStages: '',
  address: '',
  city: '',
  county: '',
  postalCode: '',
  countryCode: 'GB',
  startDate: '',
  endDate: '',
  payAmount: '',
  payType: 'daily',
  status: 'DRAFT',
  minExperienceYears: '',
  parkingInfo: '',
  liveFrom: '',
  expiresAt: '',
  qts: 'no',
  urgent: 'no',
};

type Review = {
  job: InvitationTerms;
  request: Omit<InvitationRequest, 'requestId'>;
};

function jobCanBeInvited(job: Job) {
  return (
    ['DRAFT', 'ACTIVE'].includes(job.status || '') &&
    (!job.expiresAt || listingInstant(job.expiresAt, true) > Date.now()) &&
    Date.parse(job.startDate || '') > Date.now() &&
    Date.parse(job.endDate || '') > Date.parse(job.startDate || '') &&
    (job.payAmount || 0) > 0 &&
    ['daily', 'hourly', 'fixed'].includes(job.payType || '')
  );
}

export default function InvitationForm({
  instructorId,
  name,
  onClose,
  retryOnly = false,
  initialJobId = '',
  onStepChange,
}: {
  instructorId: string;
  name: string;
  onClose: () => void;
  retryOnly?: boolean;
  initialJobId?: string;
  onStepChange?: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState(initialJobId);
  const [mode, setMode] = useState('Existing job');
  const [form, setForm] = useState(emptyJob);
  const [review, setReview] = useState<Review>();
  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState('');
  const [timezone, setTimezone] = useState('Europe/London');
  const [showExtras, setShowExtras] = useState(false);
  const [pending, setPending] = useState<PendingInvitation>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const selected = jobs.find(job => job.id === jobId);

  function chooseMode(value: string) {
    setMode(value);
    setError('');
    onStepChange?.();
  }

  useEffect(() => {
    let active = true;
    setReady(false);
    setError('');
    async function load() {
      const saved = await readPendingInvitation();
      const list = saved || retryOnly ? [] : await getMyJobs();
      return { list, saved };
    }
    load()
      .then(({ list, saved }) => {
        if (!active) return;
        setJobs(list.filter(jobCanBeInvited));
        setPending(saved);
        setReady(true);
      })
      .catch(problem => {
        if (active) setError(problem.message);
      });
    return () => {
      active = false;
    };
  }, [attempt, retryOnly]);

  async function reviewInvitation() {
    if (busy) return;
    setBusy(true);
    setError('');
    const version = getSessionVersion();
    try {
      if (!instructorId) throw new Error('Choose a teacher first.');
      await checkDropdown('timezone', [timezone]);
      let job: InvitationTerms;
      let request: Omit<InvitationRequest, 'requestId'>;
      if (mode === 'New job') {
        const newJob = await cleanJob(form, timezone);
        newJob.description = form.description;
        if (
          !newJob.title ||
          !newJob.subjects.length ||
          !richTextToPlainText(newJob.description) ||
          newJob.description.length > 10000 ||
          !newJob.startDate ||
          !newJob.endDate ||
          !(Number(newJob.payAmount) > 0) ||
          !['daily', 'hourly', 'fixed'].includes(newJob.payType || '')
        ) {
          throw new Error(
            'Add a title, description, subjects, future work dates and a positive pay amount.',
          );
        }
        job = newJob;
        request = { instructorId, newJob };
      } else {
        if (!selected)
          throw new Error('Choose a job to invite this teacher to.');
        const latest = await getMyJob(selected.id);
        if (!jobCanBeInvited(latest)) {
          throw new Error(
            'This job is no longer ready for invitations. Choose another job or update its dates and pay.',
          );
        }
        job = latest;
        request = { instructorId, jobId: latest.id };
      }
      validateDateWindow(job, timezone);
      if (
        Date.parse(job.startDate || '') <= Date.now() ||
        Date.parse(job.endDate || '') <= Date.parse(job.startDate || '')
      ) {
        throw new Error(
          'Choose future work dates with the end after the start.',
        );
      }
      const expiresAt = deadline ? zonedToIso(deadline, timezone) : undefined;
      if (
        expiresAt &&
        (Date.parse(expiresAt) <= Date.now() ||
          Date.parse(expiresAt) >= Date.parse(job.startDate || '') ||
          (job.expiresAt &&
            Date.parse(expiresAt) > listingInstant(job.expiresAt, true)))
      ) {
        throw new Error(
          'The response deadline must be in the future, before the job starts and before its listing closes.',
        );
      }
      if (version !== getSessionVersion()) return;
      setReview({
        job,
        request: {
          ...request,
          message: message.trim() || undefined,
          expiresAt,
        },
      });
      onStepChange?.();
    } catch (problem) {
      if (version !== getSessionVersion()) return;
      setError(
        problem instanceof Error
          ? problem.message
          : 'Check your invitation details.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (busy || !ready || (!pending && !review)) return;
    setBusy(true);
    setError('');
    const version = getSessionVersion();
    try {
      const result = await sendInvitation(
        pending ? undefined : { ...review!.request, requestId: newRequestId() },
      );
      if (version !== getSessionVersion()) return;
      dispatch(refreshMarketplace());
      dispatch(saveConversation(result.conversation));
      dispatch(openConversation(result.conversation.id));
    } catch (problem) {
      if (version !== getSessionVersion()) return;
      dispatch(refreshMarketplace());
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to confirm invitation.',
      );
      try {
        const saved = await readPendingInvitation();
        setPending(saved);
        if (!saved) setReview(undefined);
      } catch {
        setReady(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const extras = (
    <View style={styles.section}>
      <Button
        title={
          showExtras
            ? 'Hide optional details'
            : 'Add a message or response deadline'
        }
        variant="link"
        onPress={() => setShowExtras(value => !value)}
      />
      {showExtras ? (
        <>
          <Input
            label="Message to the teacher"
            placeholder="Introduce the role or share anything helpful."
            value={message}
            onChangeText={setMessage}
            maxLength={1000}
            multiline
            required={false}
          />
          <Text style={styles.hint}>{message.length}/1,000 characters</Text>
          <WorkDateField
            timezone={timezone}
            label="Response deadline"
            value={deadline}
            onChange={setDeadline}
          />
          {deadline ? (
            <Button
              title="Use the default deadline"
              variant="link"
              onPress={() => setDeadline('')}
            />
          ) : (
            <Text style={styles.hint}>
              The teacher has up to seven days to respond, ending earlier if the
              job starts or its listing closes.
            </Text>
          )}
        </>
      ) : null}
    </View>
  );
  const savedJob =
    pending?.invitation?.job ||
    (pending?.payload.newJob as InvitationTerms | undefined);
  const recipient = pending
    ? pending.invitation?.instructor.fullName ||
      (pending.payload.instructorId === instructorId
        ? name
        : 'Selected teacher')
    : name;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.step}>
          {review || pending ? '2 of 2 · Review' : '1 of 2 · Job details'}
        </Text>
        <Text style={styles.title}>
          {pending
            ? 'Finish your invitation'
            : review
            ? 'Review invitation'
            : 'Invite a teacher'}
        </Text>
        {recipient ? (
          <Text style={styles.recipient}>To {recipient}</Text>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {pending ? (
        <>
          <Text style={styles.body}>
            Your invitation is saved. Retry to confirm its result and open the
            conversation. The teacher and offered terms stay the same.
          </Text>
          {savedJob?.title ? (
            <InvitationReview
              job={savedJob}
              isNew={Boolean(pending.payload.newJob)}
              message={pending.payload.message}
              expiresAt={pending.payload.expiresAt}
            />
          ) : (
            <Text style={styles.body}>
              Your selected job is saved with this request.
            </Text>
          )}
          <Button
            title={busy ? 'Finishing…' : 'Retry invitation'}
            disabled={busy}
            onPress={submit}
          />
        </>
      ) : ready && retryOnly ? (
        <Text style={styles.body}>
          You have no unfinished invitation on this device.
        </Text>
      ) : ready && review ? (
        <>
          <InvitationReview
            job={review.job}
            isNew={Boolean(review.request.newJob)}
            message={review.request.message}
            expiresAt={review.request.expiresAt}
            timezone={timezone}
          />
          <View style={styles.notice}>
            <Text style={styles.body}>
              Sending opens a conversation and asks the teacher to accept these
              terms. A booking is confirmed after they accept. Until then, the
              teacher and job remain available.
            </Text>
            {review.request.newJob ? (
              <Text style={styles.hint}>
                This job is shared with this teacher first. If they decline, it
                becomes open to other teachers while still eligible. Cancelling
                or expiry does not publish it.
              </Text>
            ) : null}
          </View>
          <Button
            title={busy ? 'Sending…' : 'Send invitation'}
            disabled={busy}
            onPress={submit}
          />
          <Button
            title="Edit invitation"
            variant="outline"
            disabled={busy}
            onPress={() => {
              setReview(undefined);
              onStepChange?.();
            }}
          />
        </>
      ) : ready ? (
        <>
          <ChoiceField
            label="Choose a job"
            value={mode}
            options={['Existing job', 'New job']}
            onChange={chooseMode}
          />
          <DynamicSelect
            name="timezone"
            label="Timezone"
            value={timezone}
            onChange={value => {
              setTimezone(value);
              setForm(current =>
                changeSchedule(current, 'payType', current.payType, value),
              );
              setError('');
            }}
          />
          {mode === 'Existing job' ? (
            <>
              {jobs.length ? (
                <>
                  <Select
                    label="Your jobs"
                    value={jobId}
                    options={jobs.map(job => ({
                      value: job.id,
                      label: `${job.title} · ${
                        job.status === 'DRAFT' ? 'Draft' : 'Active'
                      } · ${invitationDate(job.startDate, timezone)}`,
                    }))}
                    placeholder="Search and choose a job"
                    onChange={value => {
                      setJobId(value);
                      setError('');
                    }}
                  />
                  {selected ? (
                    <InvitationReview
                      compact
                      job={selected}
                      isNew={false}
                      timezone={timezone}
                    />
                  ) : null}
                  {extras}
                  <Button
                    title={busy ? 'Checking details…' : 'Review invitation'}
                    disabled={busy || !selected}
                    onPress={reviewInvitation}
                  />
                </>
              ) : (
                <View style={styles.notice}>
                  <Text style={styles.cardTitle}>No jobs ready to invite</Text>
                  <Text style={styles.body}>
                    Use an active or draft job with future dates and agreed pay,
                    or create a job here.
                  </Text>
                  <Button
                    title="Create a new job"
                    onPress={() => chooseMode('New job')}
                  />
                </View>
              )}
            </>
          ) : (
            <View pointerEvents={busy ? 'none' : 'auto'}>
              <Text style={styles.hint}>
                Create the role you want to offer {name}.
              </Text>
              <JobDetailsStep
                invitation
                timezone={timezone}
                form={form}
                error={error}
                footer={extras}
                onChange={(key, value) => {
                  setForm(current =>
                    changeSchedule(current, key, value, timezone),
                  );
                  setError('');
                }}
                onBack={() => chooseMode('Existing job')}
                onNext={reviewInvitation}
              />
              {busy ? (
                <ActivityIndicator
                  color={colors.brand}
                  accessibilityLabel="Checking job details"
                />
              ) : null}
            </View>
          )}
        </>
      ) : error ? (
        <Button
          title="Try again"
          onPress={() => setAttempt(value => value + 1)}
        />
      ) : (
        <ActivityIndicator
          color={colors.brand}
          accessibilityLabel="Loading your jobs"
        />
      )}
      <Button
        title={retryOnly ? 'Back' : 'Cancel invitation'}
        disabled={busy}
        variant="link"
        onPress={onClose}
      />
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  section: { gap: 14 },
  header: { gap: 6 },
  step: { color: colors.brandDark, fontSize: 12, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800' },
  recipient: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  body: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  error: { color: '#a42b26', fontSize: 14, lineHeight: 21 },
  notice: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.brandTint,
    gap: 12,
  },
}));
