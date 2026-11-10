import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import InvitationsScreen from '../../shared/screens/InvitationsScreen';
import ChoiceField from '../../../../components/dashboard/ChoiceField';
import ApplicationStatusField from '../../../../components/dashboard/ApplicationStatusField';
import RankedApplicants from '../../../../components/dashboard/RankedApplicants';
import DetailHeader from '../../../../components/Ui/DetailHeader';
import FilterSheet from '../../../../components/Ui/FilterSheet';
import FilterButton from '../../../../components/Ui/FilterButton';
import SearchField from '../../../../components/Ui/SearchField';
import Button from '../../../../components/Ui/Button';
import { EmptyState, ListFeedback, Notice, RecordSection, RecordSkeleton, StatusBadge } from '../../../../components/Ui/RecordLayout';
import TeacherProfileSummary from '../../../../components/dashboard/TeacherProfileSummary';
import SchoolApplicationDetail from '../../../../components/dashboard/SchoolApplicationDetail';
import JobRecordDetails from '../../../../components/dashboard/JobRecordDetails';
import { useSchoolApplications } from '../hooks/useSchoolApplications';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import { displayDate, statusLabel } from '../../../../utils/ui/marketplaceLabels';

export default function SchoolApplicationsScreen({ jobId = '', header }: { jobId?: string; header?: React.ReactNode }) {
  const styles = useStyles();
  const [selectedJobId, setSelectedJobId] = useState(jobId);
  const applications = useSchoolApplications(selectedJobId);
  const [sort, setSort] = useState('Newest');
  const [view, setView] = useState('Applications');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [draft, setDraft] = useState({ status: 'APPLIED', sort: 'Newest' });
  const scrollStarted = useRef(false);

  useEffect(() => {
    if (jobId) setSelectedJobId(jobId);
  }, [jobId]);

  const selectedJob = applications.jobs.find(job => job.id === selectedJobId);
  const visibleJobs = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();
    if (!query) return applications.jobs;
    return applications.jobs.filter(job =>
      [job.title, job.subject, ...(job.subjects || []), job.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [applications.jobs, jobSearch]);
  const choice = <ChoiceField hideLabel label="View" value={view} options={['Applications', 'Invited']} onChange={setView} />;

  if (view === 'Invited') return <InvitationsScreen role="school" jobId={selectedJobId} header={<>{header}{choice}</>} />;

  if (!selectedJobId) {
    return <View style={styles.scroll}>
      <FlatList data={visibleJobs} keyExtractor={item => item.id} contentContainerStyle={styles.page}
        ListHeaderComponent={<View style={styles.section}>
          {header}{choice}
          <View><Text style={styles.title}>Job applications</Text><Text style={styles.cardBody}>Choose a job to see its full details and applicants.</Text></View>
          <SearchField placeholder="Search your jobs" value={jobSearch} onChangeText={setJobSearch} />
          {applications.error ? <Notice danger text={applications.error} /> : null}
        </View>}
        renderItem={({ item }) => <RecordSection title={item.title} action={<StatusBadge status={item.status || 'DRAFT'} />}>
          <Text style={styles.cardBody} numberOfLines={2}>{[item.subjects?.join(', ') || item.subject, item.city].filter(Boolean).join(' · ') || 'Teaching placement'}</Text>
          <Text style={styles.teacherMeta}>{typeof item.applicationCount === 'number' ? `${item.applicationCount} ${item.applicationCount === 1 ? 'application' : 'applications'}` : `Starts ${displayDate(item.startDate)}`}</Text>
          <Button title="See applications" variant="outline" onPress={() => setSelectedJobId(item.id)} />
        </RecordSection>}
        refreshing={applications.loading && applications.jobs.length > 0} onRefresh={applications.refresh}
        ListEmptyComponent={applications.loading ? <RecordSkeleton /> : <EmptyState title="No jobs found" description={jobSearch ? 'Try another job title or subject.' : 'Post a job before reviewing applications.'} />}
      />
    </View>;
  }

  const listHeader = <View style={styles.section}>
    {header}{choice}
    <Button title="Back to jobs" variant="link" onPress={() => setSelectedJobId('')} />
    {selectedJob ? <JobRecordDetails job={selectedJob} /> : applications.loading ? <RecordSkeleton /> : <Notice danger text="This job is unavailable." />}
    <View><Text style={styles.title}>Applicants</Text><Text style={styles.cardBody}>Review the teachers who applied for this job.</Text></View>
    {sort === 'Newest' ? <SearchField placeholder="Search applications" value={applications.search} onChangeText={applications.setSearch} /> : null}
    <View style={styles.sectionHead}>
      <Text style={styles.teacherMeta}>{sort === 'Best match' ? 'Best matches' : `${applications.status === 'ALL' ? 'All applications' : statusLabel(applications.status)} · Newest first`}</Text>
      <FilterButton count={Number(applications.status !== 'APPLIED') + Number(sort !== 'Newest')} onPress={() => { setDraft({ status: applications.status, sort }); setFiltersOpen(true); }} />
    </View>
    {applications.notice ? <Notice text={applications.notice} /> : null}
    {sort === 'Best match' && selectedJob ? <RankedApplicants key={selectedJob.id} job={selectedJob} onOpen={item => applications.openApplication(item.id)} /> : null}
  </View>;

  return <View style={styles.scroll}>
    <FlatList data={sort === 'Newest' ? applications.applications : []} keyExtractor={item => item.id} contentContainerStyle={styles.page} ListHeaderComponent={listHeader}
      renderItem={({ item }) => <RecordSection title="Teacher application" action={<StatusBadge status={item.status} />}><TeacherProfileSummary teacherId={item.instructorId} compact /><Text style={styles.teacherMeta}>Received {displayDate(item.createdAt)}</Text><Button title="Open application" variant="outline" onPress={() => applications.openApplication(item.id)} /></RecordSection>}
      refreshing={applications.loading && applications.applications.length > 0} onRefresh={applications.refresh} keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={() => { scrollStarted.current = true; }} onEndReachedThreshold={0.35} onEndReached={() => { if (scrollStarted.current && applications.hasMore && !applications.loading) { scrollStarted.current = false; applications.loadMore(); } }}
      ListEmptyComponent={sort !== 'Newest' ? undefined : applications.loading ? <RecordSkeleton /> : !applications.error ? <EmptyState title={applications.hasMore ? 'No matches on these pages' : 'No matching applications'} description={applications.hasMore ? 'Continue loading to search older applications.' : 'Try another filter or check back when a teacher applies.'} /> : undefined}
      ListFooterComponent={sort === 'Newest' ? <ListFeedback loading={applications.loading && applications.applications.length > 0} error={applications.error} hasMore={applications.hasMore} onMore={applications.loadMore} onRetry={applications.refresh} count={applications.applications.length} /> : undefined} />
    <FilterSheet visible={filtersOpen} title="Filter applications" onClose={() => setFiltersOpen(false)} onReset={() => setDraft({ status: 'APPLIED', sort: 'Newest' })} onApply={() => { applications.setStatus(draft.status); setSort(draft.sort); setFiltersOpen(false); }}>
      <ChoiceField label="Order" value={draft.sort} options={['Newest', 'Best match']} onChange={value => setDraft({ ...draft, sort: value })} />
      {draft.sort === 'Best match' ? <Text style={styles.cardBody}>Applicants are ranked against this job.</Text> : <ApplicationStatusField value={draft.status} onChange={value => setDraft({ ...draft, status: value })} />}
    </FilterSheet>
    <Modal visible={!!applications.selectedId} animationType="slide" presentationStyle="fullScreen" onRequestClose={applications.closeApplication}>
      <SafeAreaProvider><SafeAreaView style={styles.safeArea}>
        <DetailHeader title="Application review" subtitle="Review, shortlist and hire" backLabel="Return to applications" disabled={applications.busy} onBack={applications.closeApplication} />
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          {applications.notice ? <Notice text={applications.notice} /> : null}
          {applications.error ? <Notice danger text={applications.error} /> : null}
          {applications.selectedApplication ? <SchoolApplicationDetail application={applications.selectedApplication} onBack={applications.closeApplication} onStatus={applications.updateStatus} busy={applications.busy} onMessage={applications.messageTeacher} /> : applications.detailLoading ? <RecordSkeleton /> : <EmptyState title="Application unavailable" description="Refresh applications and try again." />}
        </ScrollView>
      </SafeAreaView></SafeAreaProvider>
    </Modal>
  </View>;
}
