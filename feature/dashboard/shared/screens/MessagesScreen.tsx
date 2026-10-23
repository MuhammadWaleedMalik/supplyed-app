import { useForegroundRefresh } from '../hooks/useForegroundRefresh';
import ContactConversation from '../../../../components/dashboard/ContactConversation';
import { contactGroups, contactKey } from '../../../../utils/messaging/threads';
import { ListFeedback } from '../../../../components/Ui/RecordLayout';
import { useTheme } from '../../../../components/Ui/theme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CheckCheck, MessageCircle, Search, X } from 'lucide-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  getConversationsPage,
  getConversation,
  getUnreadCount,
  openBookingConversation,
  openApplicationConversation,
} from '../../../../constants/conversationsApi';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  saveConversation,
  setConversations,
  mergeConversations,
  setUnread,
} from '../store/conversationsSlice';
import ConversationAvatar from '../../../../components/dashboard/ConversationAvatar';
import { useChatStyles } from '../../../../components/dashboard/chatStyles';
import Button from '../../../../components/Ui/Button';
import {
  clearMessageApplication,
  goBackToSource,
} from '../store/navigationSlice';
import { getSessionVersion } from '../../../../utils/api/session';

function conversationTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString())
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  today.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function MessagesScreen({
  role,
}: {
  role: 'school' | 'teacher';
}) {
  const { colors } = useTheme();
  const chatStyles = useChatStyles();

  const dispatch = useAppDispatch();
  const conversationId = useAppSelector(
    state => state.dashboardNavigation.conversationId,
  );
  const applicationId = useAppSelector(
    state => state.dashboardNavigation.messageApplicationId,
  );
  const bookingId = useAppSelector(
    state => state.dashboardNavigation.messageBookingId,
  );
  const returnPage = useAppSelector(
    state => state.dashboardNavigation.returnPage,
  );
  const conversations = useAppSelector(
    state => state.conversations.conversations,
  );
  const socketError = useAppSelector(state => state.conversations.error);
  const [selectedId, setSelectedId] = useState('');
  const selectedFromCache = useAppSelector(state => state.conversations.byId[selectedId]);
  const inboxPage = useRef(1);
  const moreLock = useRef(false);
  const scrollStarted = useRef(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useForegroundRefresh(() => {
    if (!loading) setAttempt(value => value + 1);
  });
  const listRequest = useRef(0);
  const back = useCallback(() => {
    setSelectedId('');
    dispatch(
      (applicationId || bookingId || conversationId) && returnPage
        ? goBackToSource()
        : clearMessageApplication(),
    );
  }, [dispatch, applicationId, bookingId, conversationId, returnPage]);

  useEffect(() => {
    let active = true;
    const request = ++listRequest.current;
    const version = getSessionVersion();
    setLoading(true);
    setError('');
    async function load() {
      try {
        if (applicationId || bookingId || conversationId) {
          const conversation = conversationId
            ? await getConversation(conversationId)
            : bookingId
            ? await openBookingConversation(bookingId)
            : await openApplicationConversation(applicationId);
          if (
            !active ||
            request !== listRequest.current ||
            version !== getSessionVersion()
          )
            return;
          dispatch(saveConversation(conversation));
          setSelectedId(conversation.id);
        }
        const [first, unread] = await Promise.all([
          getConversationsPage(1),
          getUnreadCount(),
        ]);
        let latest = first;
        const inbox = [...first.conversations];
        for (let page = 2; page <= inboxPage.current && latest.hasNextPage; page++) {
          if (!active || request !== listRequest.current || version !== getSessionVersion()) return;
          latest = await getConversationsPage(page);
          inbox.push(...latest.conversations);
        }
        if (
          active &&
          request === listRequest.current &&
          version === getSessionVersion()
        ) {
          dispatch(setConversations(inbox));
          dispatch(setUnread(unread.total));
          inboxPage.current = latest.page;
          setHasMore(latest.hasNextPage);
        }
      } catch (problem) {
        if (
          active &&
          request === listRequest.current &&
          version === getSessionVersion()
        )
          setError(
            problem instanceof Error
              ? problem.message
              : 'Unable to load messages.',
          );
      } finally {
        if (active && request === listRequest.current) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
      listRequest.current += 1;
    };
  }, [applicationId, bookingId, conversationId, dispatch, attempt]);

  async function loadMore() {
    if (loading || moreLock.current || !hasMore) return;
    moreLock.current = true; setLoadingMore(true);
    const request = listRequest.current; const version = getSessionVersion();
    try {
      const result = await getConversationsPage(inboxPage.current + 1);
      if (request !== listRequest.current || version !== getSessionVersion()) return;
      dispatch(mergeConversations(result.conversations));
      inboxPage.current = result.page; setHasMore(result.hasNextPage); setError('');
    } catch (problem) { if (request === listRequest.current) setError(problem instanceof Error ? problem.message : 'Unable to load older chats.'); }
    finally { moreLock.current = false; setLoadingMore(false); }
  }
  // A direct job/application link may be older than the loaded inbox pages.
  // Retain its authorised detail response independently of inbox replacement.
  const all = selectedFromCache && !conversations.some(item => item.id === selectedId) ? [...conversations, selectedFromCache] : conversations;
  const groups = contactGroups(all);
  const selectedConversation = all.find(item => item.id === selectedId);
  const selectedGroup = groups.find(
    group =>
      group.key ===
      (selectedConversation ? contactKey(selectedConversation) : ''),
  );
  const visible = groups
    .filter(
      group =>
        (!unreadOnly || group.unread > 0) &&
        group.items.some(item =>
          (item.counterpart.name + ' ' + (item.job?.title || ''))
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        ),
    )
    .map(group => ({
      ...group.latest,
      id: group.latest.id,
      unreadCount: group.unread,
    }));
  return (
    <View style={chatStyles.screen}>
      <View style={chatStyles.header}>
        <Text style={chatStyles.title}>Chats</Text>
        <Text style={chatStyles.muted}>
          Conversations may be monitored by the SupplyEd team for support and
          safety.
        </Text>
        <View style={chatStyles.search}>
          <Search size={21} color="#667781" />
          <TextInput
            selectionColor={colors.brand}
            accessibilityLabel="Search conversations"
            placeholder="Search name or job"
            placeholderTextColor="#667781"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            style={chatStyles.searchInput}
          />
          {search ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch('')}
              style={chatStyles.iconButton}
            >
              <X size={20} color="#667781" />
            </Pressable>
          ) : null}
        </View>
        <View style={chatStyles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !unreadOnly }}
            onPress={() => setUnreadOnly(false)}
            style={[chatStyles.filter, !unreadOnly && chatStyles.filterActive]}
          >
            <Text
              style={[
                chatStyles.filterText,
                !unreadOnly && chatStyles.greenText,
              ]}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: unreadOnly }}
            onPress={() => setUnreadOnly(true)}
            style={[chatStyles.filter, unreadOnly && chatStyles.filterActive]}
          >
            <Text
              style={[
                chatStyles.filterText,
                unreadOnly && chatStyles.greenText,
              ]}
            >
              Unread
            </Text>
          </Pressable>
        </View>
      </View>
      {error ? (
        <View>
          <Text style={chatStyles.error} accessibilityLiveRegion="polite">
            {error} Some conversations may be missing until refresh succeeds.
          </Text>
          <Button
            title="Retry inbox"
            variant="link"
            onPress={() => setAttempt(value => value + 1)}
          />
        </View>
      ) : null}
      {socketError ? (
        <Text style={[chatStyles.muted, chatStyles.connection]}>
          {socketError}
        </Text>
      ) : null}
      {loading && !conversations.length ? (
        <ActivityIndicator color={colors.brand} />
      ) : null}
      <FlatList
        style={chatStyles.list}
        data={visible}
        keyExtractor={item => item.id}
        contentContainerStyle={chatStyles.inbox}
        refreshing={loading}
        onRefresh={() => setAttempt(current => current + 1)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => { scrollStarted.current = true; }}
        onEndReachedThreshold={0.35}
        onEndReached={() => { if (scrollStarted.current) { scrollStarted.current = false; loadMore(); } }}
        ListFooterComponent={<ListFeedback loading={loadingMore} hasMore={hasMore} onMore={loadMore} onRetry={loadMore} count={conversations.length} />}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={chatStyles.empty}>
              <MessageCircle size={48} color={colors.brand} />
              <Text style={chatStyles.name}>
                {search
                  ? 'No matching conversations'
                  : unreadOnly
                  ? 'You’re all caught up'
                  : 'Your conversations start here'}
              </Text>
              <Text style={[chatStyles.muted, chatStyles.center]}>
                {search
                  ? 'Try another name or job title.'
                  : unreadOnly
                  ? 'No unread conversations.'
                  : `Open an application or booking and tap Message to chat with ${
                      role === 'school' ? 'teachers' : 'schools'
                    }.`}
              </Text>
              <Button
                title="Refresh messages"
                variant="social"
                onPress={() => setAttempt(current => current + 1)}
              />
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              'Conversation with ' +
              item.counterpart.name +
              ', ' +
              item.unreadCount +
              ' unread'
            }
            onPress={() => {
              Keyboard.dismiss();
              setSelectedId(item.id);
            }}
            style={({ pressed }) => [
              chatStyles.inboxRow,
              pressed && chatStyles.pressedRow,
            ]}
          >
            <ConversationAvatar
              name={item.counterpart.name}
              imageUrl={item.counterpart.imageUrl}
            />
            <View style={chatStyles.inboxContent}>
              <View style={chatStyles.row}>
                <Text
                  numberOfLines={1}
                  style={[chatStyles.name, chatStyles.copy]}
                >
                  {item.counterpart.name}
                </Text>
                <Text
                  style={[
                    chatStyles.muted,
                    item.unreadCount > 0 && chatStyles.greenText,
                  ]}
                >
                  {conversationTime(item.lastMessageAt)}
                </Text>
              </View>
              <View style={chatStyles.row}>
                {item.lastMessage?.fromMe ? (
                  <CheckCheck
                    size={17}
                    color={
                      item.counterpartLastReadAt &&
                      item.lastMessage.createdAt <= item.counterpartLastReadAt
                        ? colors.brand
                        : '#8696a0'
                    }
                  />
                ) : null}
                <Text
                  numberOfLines={1}
                  style={[
                    chatStyles.snippet,
                    item.unreadCount > 0 && chatStyles.unreadSnippet,
                  ]}
                >
                  {item.lastMessage
                    ? item.lastMessage.body || 'Attachment'
                    : 'No messages yet'}
                </Text>
                {item.unreadCount > 0 ? (
                  <View style={chatStyles.badge}>
                    <Text style={chatStyles.badgeText}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} style={chatStyles.jobLabel}>
                {item.job?.title}
                {item.readOnly ? ' · Read only' : ''}
              </Text>
            </View>
          </Pressable>
        )}
      />
      {selectedId ? (
        <Modal
          visible
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={back}
        >
          <SafeAreaProvider>
              <ContactConversation
                key={selectedGroup?.key || selectedId}
                conversations={selectedGroup?.items || []}
                explicitId={selectedId}
                onBack={back}
              />
          </SafeAreaProvider>
        </Modal>
      ) : null}
    </View>
  );
}
