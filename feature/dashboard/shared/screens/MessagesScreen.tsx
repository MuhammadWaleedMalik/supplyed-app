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
  getUnreadCount,
  openApplicationConversation,
} from '../../../../constants/conversationsApi';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  saveConversation,
  mergeConversations,
  setConversations,
  setUnread,
} from '../store/conversationsSlice';
import ConversationAvatar from '../../../../components/dashboard/ConversationAvatar';
import ConversationThread from '../../../../components/dashboard/ConversationThread';
import { useChatStyles } from '../../../../components/dashboard/chatStyles';
import Button from '../../../../components/Ui/Button';
import { clearMessageApplication } from '../store/navigationSlice';
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
  const applicationId = useAppSelector(
    state => state.dashboardNavigation.messageApplicationId,
  );
  const conversations = useAppSelector(
    state => state.conversations.conversations,
  );
  const socketError = useAppSelector(state => state.conversations.error);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const page = useRef(1);
  const loadingMoreRef = useRef(false);
  const scrollStarted = useRef(false);
  const listRequest = useRef(0);
  const back = useCallback(() => {
    setSelectedId('');
    dispatch(clearMessageApplication());
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const request = ++listRequest.current;
    const version = getSessionVersion();
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setHasMore(false);
    setLoading(true);
    setError('');
    async function load() {
      try {
        if (applicationId) {
          const conversation = await openApplicationConversation(applicationId);
          if (
            !active ||
            request !== listRequest.current ||
            version !== getSessionVersion()
          )
            return;
          dispatch(saveConversation(conversation));
          setSelectedId(conversation.id);
        }
        const [inbox, unread] = await Promise.all([
          getConversationsPage(1),
          getUnreadCount(),
        ]);
        if (
          active &&
          request === listRequest.current &&
          version === getSessionVersion()
        ) {
          dispatch(setConversations(inbox.conversations));
          dispatch(setUnread(unread.total));
          page.current = inbox.page;
          setHasMore(inbox.hasNextPage);
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
  }, [applicationId, dispatch, attempt]);

  async function loadMore() {
    if (loadingMoreRef.current || loading || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const request = listRequest.current;
    const version = getSessionVersion();
    try {
      const next = await getConversationsPage(page.current + 1);
      if (request !== listRequest.current || version !== getSessionVersion())
        return;
      dispatch(mergeConversations(next.conversations));
      page.current = next.page;
      setHasMore(next.hasNextPage);
    } catch (problem) {
      if (request === listRequest.current && version === getSessionVersion())
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to load more conversations.',
        );
    } finally {
      if (request === listRequest.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }

  const visible = conversations
    .filter(
      item =>
        (!unreadOnly || item.unreadCount > 0) &&
        (item.counterpart.name + ' ' + item.job.title)
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) =>
      (b.lastMessageAt || b.createdAt).localeCompare(
        a.lastMessageAt || a.createdAt,
      ),
    );
  return (
    <View style={chatStyles.screen}>
      <View style={chatStyles.header}>
        <Text style={chatStyles.title}>Chats</Text>
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
        <Text style={chatStyles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
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
        onScrollBeginDrag={() => {
          scrollStarted.current = true;
        }}
        onEndReached={() => {
          if (!scrollStarted.current) return;
          scrollStarted.current = false;
          loadMore();
        }}
        onEndReachedThreshold={0.25}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          !loading ? (
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
                {item.job.title}
                {item.readOnly ? ' · Read only' : ''}
              </Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.brand} /> : undefined
        }
      />
      {selectedId ? (
        <Modal
          visible
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={back}
        >
          <SafeAreaProvider>
            <ConversationThread
              key={selectedId}
              id={selectedId}
              onBack={back}
            />
          </SafeAreaProvider>
        </Modal>
      ) : null}
    </View>
  );
}
