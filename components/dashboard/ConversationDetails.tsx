import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Conversation,
  getConversationApplication,
} from '../../constants/conversationsApi';
import { Application } from '../../feature/dashboard/shared/apis/applicationsApi';
import {
  getJob,
  getMyJob,
  Job,
} from '../../feature/dashboard/shared/apis/jobsApi';
import { ApiError } from '../../utils/api/request';
import Button from '../Ui/Button';
import RichText from '../Ui/RichText';
import TeacherProfileSummary from './TeacherProfileSummary';
import ConversationAvatar from './ConversationAvatar';
import { useChatStyles } from './chatStyles';
import LimitedProfileCard from './LimitedProfileCard';
import { useLimitedProfile } from '../../feature/dashboard/shared/hooks/useLimitedProfile';

export default function ConversationDetails({
  conversation,
  onClose,
}: {
  conversation: Conversation;
  onClose: () => void;
}) {
  const chatStyles = useChatStyles();

  const [application, setApplication] = useState<Application>();
  const [job, setJob] = useState<Job>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const profile = useLimitedProfile();

  function openCounterpartProfile() {
    const id = conversation.counterpart.id;
    if (!id) return;
    if (conversation.counterpart.role === 'teacher') profile.openInstructor(id);
    else profile.openSchool(id);
  }
  useEffect(() => {
    let active = true;
    setError('');
    setApplication(undefined);
    setJob(undefined);
    Promise.all([
      getConversationApplication(conversation.applicationId),
      (conversation.me === 'poster'
        ? getMyJob(conversation.job.id)
        : getJob(conversation.job.id)
      ).catch(problem => {
        // The public job endpoint hides closed and expired listings. The
        // application and conversation remain readable after hiring.
        if (problem instanceof ApiError && problem.status === 404)
          return undefined;
        throw problem;
      }),
    ])
      .then(([nextApplication, nextJob]) => {
        if (active) {
          setApplication(nextApplication);
          setJob(nextJob);
        }
      })
      .catch(problem => {
        if (active) setError(problem.message || 'Unable to load details.');
      });
    return () => {
      active = false;
    };
  }, [
    conversation.applicationId,
    conversation.job.id,
    conversation.me,
    attempt,
  ]);
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={chatStyles.screen}>
        <LimitedProfileCard
          profile={profile.profile}
          error={profile.error}
          loading={profile.loading}
          onClose={profile.closeProfile}
        />
        <ScrollView contentContainerStyle={chatStyles.modal}>
          <Button
            title="Back to conversation"
            variant="link"
            onPress={onClose}
          />
          <ConversationAvatar
            name={conversation.counterpart.name}
            imageUrl={conversation.counterpart.imageUrl}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${conversation.counterpart.name} profile`}
            disabled={!conversation.counterpart.id}
            onPress={openCounterpartProfile}
          >
            <Text style={chatStyles.title}>
              {conversation.counterpart.name}
            </Text>
          </Pressable>
          <Text style={chatStyles.muted}>
            {conversation.counterpart.role === 'school' ? 'School' : 'Teacher'}
          </Text>
          {!application && !error ? <ActivityIndicator /> : null}
          {error ? (
            <>
              <Text style={chatStyles.error}>{error}</Text>
              <Button
                title="Retry details"
                onPress={() => setAttempt(attempt + 1)}
              />
            </>
          ) : null}
          <Text style={chatStyles.name}>
            {job?.title || conversation.job.title}
          </Text>
          <Text style={chatStyles.body}>
            Application: {application?.status || conversation.applicationStatus}
          </Text>
          {application ? (
            <>
              <Text style={chatStyles.muted}>
                Applied{' '}
                {application.createdAt
                  ? new Date(application.createdAt).toLocaleDateString()
                  : 'recently'}
              </Text>
              <RichText
                value={application.coverLetter}
                style={chatStyles.body}
              />
            </>
          ) : null}
          {job ? (
            <>
              <Text style={chatStyles.body}>
                {[job.address, job.city, job.county, job.postalCode]
                  .filter(Boolean)
                  .join(', ') || 'Location not provided'}
              </Text>
              <Text style={chatStyles.body}>
                {job.startDate?.slice(0, 10) || 'Dates pending'}
                {job.endDate ? ' to ' + job.endDate.slice(0, 10) : ''}
              </Text>
              <Text style={chatStyles.body}>
                {job.payAmount != null
                  ? 'GBP ' +
                    job.payAmount.toFixed(2) +
                    ' / ' +
                    (job.payType || 'booking').toLowerCase()
                  : 'Pay not provided'}
              </Text>
              <Text style={chatStyles.body}>
                {[job.subject, ...(job.keyStages || [])]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <Text style={chatStyles.body}>{job.description}</Text>
            </>
          ) : null}
          {conversation.me === 'poster' && application ? (
            <TeacherProfileSummary teacherId={application.instructorId} />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
