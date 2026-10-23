import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Conversation,
  getConversationThreads,
} from '../../constants/conversationsApi';
import {
  contactThreads,
  conversationTopic,
  defaultThread,
  Topic,
} from '../../utils/messaging/threads';
import ConversationThread from './ConversationThread';
import ConversationPicker from './ConversationPicker';
import DetailHeader from '../Ui/DetailHeader';
import Button from '../Ui/Button';
import { EmptyState } from '../Ui/RecordLayout';
import { useChatStyles } from './chatStyles';

type TopicState = {
  items: Conversation[];
  loading: boolean;
  loaded: boolean;
  error: string;
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
};
const empty = (): TopicState => ({
  items: [],
  loading: false,
  loaded: false,
  error: '',
  total: 0,
  hasMore: false,
  nextCursor: null,
});
function merge(...groups: Conversation[][]) {
  return Array.from(
    new Map(groups.flat().map(item => [item.id, item])).values(),
  ).sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
}
export default function ContactConversation({
  conversations,
  explicitId,
  onBack,
}: {
  conversations: Conversation[];
  explicitId?: string;
  onBack: () => void;
}) {
  const styles = useChatStyles();
  const initialThreads = contactThreads(conversations);
  const initial =
    initialThreads.find(item => item.conversationId === explicitId) ||
    defaultThread(initialThreads);
  const [topic, setTopic] = useState<Topic>(initial?.topic || 'general');
  const [selectedId, setSelectedId] = useState(initial?.conversationId || '');
  const [pickerOpen, setPickerOpen] = useState(!initial);
  const [pages, setPages] = useState<Record<Topic, TopicState>>({
    general: empty(),
    jobs: empty(),
  });
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const running = useRef<Record<Topic, boolean>>({
    general: false,
    jobs: false,
  });
  const generation = useRef(0);
  const appliedExplicit = useRef(explicitId || '');
  const anchor =
    conversations.find(item => item.id === explicitId) || conversations[0];
  async function load(value: Topic, more = false) {
    if (!anchor || running.current[value]) return;
    const current = pagesRef.current[value];
    if (more && (!current.hasMore || !current.nextCursor)) return;
    running.current[value] = true;
    const request = generation.current;
    setPages(state => ({
      ...state,
      [value]: { ...state[value], loading: true, error: '' },
    }));
    try {
      const result = await getConversationThreads(
        anchor.id,
        value === 'general' ? 'GENERAL' : 'JOBS',
        more ? current.nextCursor || undefined : undefined,
      );
      if (request !== generation.current) return;
      if (
        result.hasMore &&
        (!result.nextCursor || result.nextCursor === current.nextCursor)
      )
        throw new Error(
          'Unable to load the next conversation page. Refresh the picker.',
        );
      setPages(state => ({
        ...state,
        [value]: {
          items: more
            ? merge(state[value].items, result.conversations)
            : result.conversations,
          loading: false,
          loaded: true,
          error: '',
          total: result.total,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
        },
      }));
    } catch (problem) {
      if (request === generation.current)
        setPages(state => ({
          ...state,
          [value]: {
            ...state[value],
            loading: false,
            error:
              problem instanceof Error
                ? problem.message
                : 'Unable to load conversations.',
          },
        }));
    } finally {
      if (request === generation.current) running.current[value] = false;
    }
  }
  useEffect(() => {
    const request = ++generation.current;
    load('general');
    load('jobs');
    return () => {
      generation.current = request + 1;
      running.current = { general: false, jobs: false };
    };
    // A contact remounts this component. Refreshing summaries must not reset selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor?.id]);
  const all = useMemo(
    () => merge(conversations, pages.general.items, pages.jobs.items),
    [conversations, pages.general.items, pages.jobs.items],
  );
  useEffect(() => {
    if (!explicitId || appliedExplicit.current === explicitId) return;
    const item = all.find(value => value.id === explicitId);
    if (item) {
      appliedExplicit.current = explicitId;
      setSelectedId(item.id);
      setTopic(conversationTopic(item));
      setPickerOpen(false);
    }
  }, [explicitId, all]);
  const items = all.filter(item => conversationTopic(item) === topic);
  const counts = {
    general: Math.max(
      pages.general.total,
      all.filter(item => conversationTopic(item) === 'general').length,
    ),
    jobs: Math.max(
      pages.jobs.total,
      all.filter(item => conversationTopic(item) === 'jobs').length,
    ),
  };
  const picker = (
    <ConversationPicker
      visible={pickerOpen}
      name={anchor?.counterpart.name || 'Your conversations'}
      topic={topic}
      counts={counts}
      items={items}
      selectedId={selectedId}
      loading={pages[topic].loading}
      error={pages[topic].error || pages.general.error || pages.jobs.error}
      hasMore={pages[topic].hasMore}
      onTopic={setTopic}
      onClose={() => setPickerOpen(false)}
      onMore={() => load(topic, true)}
      onRetry={() => { load('general'); load('jobs'); }}
      onSelect={id => {
        setSelectedId(id);
        setPickerOpen(false);
      }}
    />
  );
  return (
    <>
      {selectedId ? (
        <ConversationThread
          key={selectedId}
          id={selectedId}
          onBack={onBack}
          topicsOpen={pickerOpen}
          onToggleTopics={() => setPickerOpen(value => !value)}
        />
      ) : (
        <View style={styles.screen}>
          <DetailHeader title="Conversation" onBack={onBack} />
          <EmptyState
            title="Choose a conversation"
            description="Select an existing general or job conversation to read its messages."
          />
          <Button
            title="Choose conversation"
            onPress={() => setPickerOpen(true)}
          />
        </View>
      )}
      {picker}
    </>
  );
}
