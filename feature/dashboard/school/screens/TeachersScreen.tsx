import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useForegroundRefresh } from '../../shared/hooks/useForegroundRefresh';
import { usePagedResource } from '../../shared/hooks/usePagedResource';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { startTeacherConversation } from '../../../../constants/conversationsApi';
import { getSessionVersion } from '../../../../utils/api/session';
import { openConversation } from '../../shared/store/navigationSlice';
import { saveConversation } from '../../shared/store/conversationsSlice';
import {
  DirectoryTeacher,
  emptyTeacherFilters,
  getTeachers,
  TeacherFilterErrors,
  TeacherFilters,
  teacherFilterQuery,
  validateTeacherFilters,
} from '../apis/teachersApi';
import InvitationForm from '../../../../components/dashboard/InvitationForm';
import MatchExplanation from '../../../../components/dashboard/MatchExplanation';
import TeacherProfileSummary from '../../../../components/dashboard/TeacherProfileSummary';
import TeacherDirectoryCard from '../../../../components/dashboard/TeacherDirectoryCard';
import TeacherFilterFields from '../../../../components/dashboard/TeacherFilterFields';
import FilterSheet from '../../../../components/Ui/FilterSheet';
import FilterButton from '../../../../components/Ui/FilterButton';
import SearchField from '../../../../components/Ui/SearchField';
import Button from '../../../../components/Ui/Button';
import Select from '../../../../components/Ui/Select';
import { createThemedStyles, useTheme } from '../../../../components/Ui/theme';

export default function TeachersScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(state => state.schoolDashboard.jobs);
  const list = useRef<FlatList<DirectoryTeacher>>(null);
  const detailScroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState(emptyTeacherFilters);
  const [draft, setDraft] = useState(emptyTeacherFilters);
  const [errors, setErrors] = useState<TeacherFilterErrors>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [jobId, setJobId] = useState('');
  const [draftJobId, setDraftJobId] = useState('');
  const [selected, setSelected] = useState<DirectoryTeacher>();
  const [profile, setProfile] = useState<DirectoryTeacher>();
  const [refreshing, setRefreshing] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatRequest = useRef(0);
  const chatBusy = useRef(false);
  useEffect(
    () => () => {
      chatRequest.current += 1;
    },
    [],
  );
  const query = teacherFilterQuery(applied);
  const loader = useCallback(
    (page: number) => getTeachers(page, query, jobId),
    [query, jobId],
  );
  const teachers = usePagedResource(loader);
  useForegroundRefresh(() => {
    if (!teachers.loading) teachers.refreshLoaded();
  }, !selected && !profile && !filtersOpen);
  const filterCount = jobId
    ? 1
    : Object.entries(applied).filter(
        ([key, value]) => key !== 'search' && value !== '' && value !== false,
      ).length;
  const selectedJob = jobs.find(job => job.id === jobId);

  function openFilters() {
    Keyboard.dismiss();
    setDraft({ ...applied, search });
    setDraftJobId(jobId);
    setErrors({});
    setFiltersOpen(true);
  }

  function changeFilter<Key extends keyof TeacherFilters>(
    key: Key,
    value: TeacherFilters[Key],
  ) {
    setDraft(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
  }

  function applyFilters() {
    const nextErrors = draftJobId ? {} : validateTeacherFilters(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setApplied(draft);
    setSearch(draft.search.trim());
    setJobId(draftJobId);
    setFiltersOpen(false);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }

  function resetFilters() {
    setDraft(emptyTeacherFilters);
    setDraftJobId('');
    setErrors({});
  }

  function clearFilters() {
    setApplied(emptyTeacherFilters);
    setDraft(emptyTeacherFilters);
    setSearch('');
    setJobId('');
    setDraftJobId('');
    setErrors({});
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }

  function submitSearch() {
    const next = { ...applied, search: search.trim() };
    const nextErrors = validateTeacherFilters(next);
    setErrors(nextErrors);
    if (nextErrors.search) return;
    Keyboard.dismiss();
    setApplied(next);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }

  async function refresh() {
    setRefreshing(true);
    await teachers.refreshLoaded();
    setRefreshing(false);
  }

  function closeDetail() {
    chatRequest.current += 1;
    chatBusy.current = false;
    setOpeningChat(false);
    setChatError('');
    setSelected(undefined);
    setProfile(undefined);
  }

  async function messageTeacher() {
    if (!profile || chatBusy.current) return;
    const request = ++chatRequest.current;
    const session = getSessionVersion();
    chatBusy.current = true;
    setOpeningChat(true);
    setChatError('');
    try {
      const conversation = await startTeacherConversation(profile.id);
      if (request !== chatRequest.current || session !== getSessionVersion())
        return;
      dispatch(saveConversation(conversation));
      closeDetail();
      dispatch(openConversation(conversation.id));
    } catch (problem) {
      if (request === chatRequest.current && session === getSessionVersion())
        setChatError(
          problem instanceof Error
            ? problem.message
            : 'Unable to open the conversation. Please try again.',
        );
    } finally {
      if (request === chatRequest.current) {
        chatBusy.current = false;
        if (session === getSessionVersion()) setOpeningChat(false);
      }
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Find teachers</Text>
        <Text style={styles.subtitle}>
          Find the right experience for your school.
        </Text>
        {!jobId ? (
          <SearchField
            value={search}
            onChangeText={value => {
              setSearch(value.slice(0, 100));
              setErrors(current => ({ ...current, search: undefined }));
              if (!value) setApplied(current => ({ ...current, search: '' }));
            }}
            placeholder="Search name, city or county"
            onSubmit={submitSearch}
          />
        ) : (
          <Text style={styles.matchContext} numberOfLines={2}>
            Best matches for {selectedJob?.title || 'your selected job'}
          </Text>
        )}
        {errors.search ? (
          <Text style={styles.error} accessibilityRole="alert">
            {errors.search}
          </Text>
        ) : null}
        <View style={styles.filterRow}>
          <View style={styles.resultCopy}>
            <Text style={styles.resultCount} accessibilityLiveRegion="polite">
              {teachers.loading && !teachers.items.length
                ? 'Finding teachers…'
                : teachers.total == null
                ? 'Teacher directory'
                : `${teachers.total} teacher${teachers.total === 1 ? '' : 's'}`}
            </Text>
            <Text style={styles.subtitle}>
              {jobId ? 'Best matches first' : 'Highest rated first'}
            </Text>
          </View>
          <FilterButton count={filterCount} onPress={openFilters} />
        </View>
      </View>
      <FlatList
        ref={list}
        data={teachers.items}
        keyExtractor={teacher => teacher.id}
        style={styles.list}
        contentContainerStyle={styles.results}
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={refresh}
        renderItem={({ item }) => (
          <TeacherDirectoryCard
            teacher={item}
            onProfile={() => setProfile(item)}
            onInvite={() => setSelected(item)}
          />
        )}
        ListHeaderComponent={
          teachers.error ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Couldn’t load teachers</Text>
              <Text style={styles.subtitle} accessibilityRole="alert">
                {teachers.error}
              </Text>
              <Button title="Try again" variant="outline" onPress={refresh} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          teachers.loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.subtitle}>Finding teachers…</Text>
            </View>
          ) : !teachers.error ? (
            <View style={styles.empty}>
              <Text style={styles.noticeTitle}>No teachers found</Text>
              <Text style={styles.emptyCopy}>
                Try a broader location or fewer filters.
              </Text>
              <Button title="Clear filters" onPress={clearFilters} />
            </View>
          ) : undefined
        }
        ListFooterComponent={
          teachers.hasMore ? (
            <Button
              title={teachers.loading ? 'Loading…' : 'Show more teachers'}
              variant="outline"
              disabled={teachers.loading}
              onPress={teachers.loadMore}
            />
          ) : undefined
        }
      />
      <FilterSheet
        visible={filtersOpen}
        title="Find your teachers"
        onClose={() => setFiltersOpen(false)}
        onApply={applyFilters}
        onReset={resetFilters}
        applyLabel={draftJobId ? 'Show matches' : 'Show teachers'}
      >
        <Select
          label="Match a job"
          value={draftJobId}
          onChange={setDraftJobId}
          placeholder="Browse all teachers"
          options={jobs.map(job => ({ value: job.id, label: job.title }))}
        />
        {draftJobId ? (
          <Text style={styles.subtitle}>
            Teachers are ranked against this job’s subjects, experience,
            location and dates. Clear the job to use directory filters.
          </Text>
        ) : (
          <TeacherFilterFields
            filters={draft}
            errors={errors}
            onChange={changeFilter}
          />
        )}
      </FilterSheet>
      <Modal
        visible={!!profile || !!selected}
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <SafeAreaView style={styles.modal}>
          <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selected ? 'Invite teacher' : 'Teacher profile'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close teacher details"
                onPress={closeDetail}
                style={styles.close}
              >
                <X size={22} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView
              ref={detailScroll}
              contentContainerStyle={styles.detail}
              keyboardShouldPersistTaps="handled"
            >
              {selected ? (
                <InvitationForm
                  instructorId={selected.id}
                  name={selected.fullName}
                  initialJobId={jobId}
                  onStepChange={() => detailScroll.current?.scrollTo({ y: 0 })}
                  onClose={closeDetail}
                />
              ) : profile ? (
                <>
                  <TeacherProfileSummary teacherId={profile.id} />
                  {profile.match ? (
                    <MatchExplanation match={profile.match} />
                  ) : null}
                </>
              ) : null}
            </ScrollView>
            {!selected && profile ? (
              <View style={styles.modalFooter}>
                {chatError ? (
                  <Text accessibilityRole="alert" style={styles.error}>
                    {chatError}
                  </Text>
                ) : null}
                <Button
                  title={openingChat ? 'Opening chat…' : 'Message teacher'}
                  variant="outline"
                  disabled={openingChat}
                  onPress={messageTeacher}
                />
                <Button
                  title={`Invite ${profile.fullName.split(' ')[0]}`}
                  onPress={() => {
                    setSelected(profile);
                    detailScroll.current?.scrollTo({ y: 0, animated: false });
                  }}
                />
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8, gap: 10 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultCopy: { flex: 1, gap: 2 },
  resultCount: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  matchContext: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.brandTint,
    color: colors.brandDark,
    fontSize: 14,
    lineHeight: 20,
  },
  list: { flex: 1 },
  results: { padding: 16, paddingTop: 4, paddingBottom: 24, gap: 12 },
  notice: {
    padding: 16,
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  noticeTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  empty: { padding: 28, alignItems: 'center', gap: 12 },
  emptyCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  error: { color: '#b42318', fontSize: 12, lineHeight: 18 },
  modal: { flex: 1, backgroundColor: colors.soft },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#ffffff',
  },
  modalTitle: { flex: 1, fontSize: 18, color: colors.ink, fontWeight: '700' },
  close: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: { padding: 16, paddingBottom: 24, gap: 16 },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#ffffff',
    gap: 10,
  },
}));
