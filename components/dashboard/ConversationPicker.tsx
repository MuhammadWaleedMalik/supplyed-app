import React, { useRef, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { Check, ChevronRight, MessageCircle, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Conversation } from '../../constants/conversationsApi';
import type { Topic } from '../../utils/messaging/threads';
import { createThemedStyles, useTheme } from '../Ui/theme';
import { EmptyState, ListFeedback, StatusBadge } from '../Ui/RecordLayout';
import SearchField from '../Ui/SearchField';

export default function ConversationPicker({
  visible,
  name,
  topic,
  counts,
  items,
  selectedId,
  loading,
  error,
  hasMore,
  onTopic,
  onSelect,
  onClose,
  onMore,
  onRetry,
}: {
  visible: boolean;
  name: string;
  topic: Topic;
  counts: Record<Topic, number>;
  items: Conversation[];
  selectedId: string;
  loading: boolean;
  error: string;
  hasMore: boolean;
  onTopic: (topic: Topic) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  onMore: () => void;
  onRetry: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const scrolled = useRef(false);
  const visibleItems = items.filter(item =>
    [item.job?.title || 'General', item.applicationStatus, item.booking?.status]
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close conversation picker"
        />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.copy}>
              <Text accessibilityRole="header" style={styles.title}>
                Switch conversation
              </Text>
              <Text numberOfLines={1} style={styles.muted}>
                {name}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close conversation picker"
              style={styles.close}
            >
              <X size={22} color={colors.ink} />
            </Pressable>
          </View>
          <View style={styles.controls}>
            <View style={styles.tabs}>
              {(['general', 'jobs'] as Topic[]).map(value => (
                <Pressable
                  key={value}
                  disabled={counts[value] === 0}
                  accessibilityRole="tab"
                  accessibilityLabel={
                    value === 'general'
                      ? 'General conversations'
                      : 'Job conversations'
                  }
                  accessibilityState={{
                    selected: topic === value,
                    disabled: counts[value] === 0,
                  }}
                  onPress={() => {
                    setSearch('');
                    onTopic(value);
                  }}
                  style={[
                    styles.tab,
                    topic === value && styles.activeTab,
                    counts[value] === 0 && styles.disabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      topic === value && styles.activeText,
                    ]}
                  >
                    {value === 'general' ? 'General' : 'Jobs'}{' '}
                    <Text style={styles.count}>{counts[value]}</Text>
                  </Text>
                </Pressable>
              ))}
            </View>
            <SearchField
              placeholder="Search loaded conversations"
              value={search}
              onChangeText={setSearch}
            />
            <Text style={styles.muted}>Newest conversations first</Text>
          </View>
          <FlatList
            data={visibleItems}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => {
              scrolled.current = true;
            }}
            onEndReachedThreshold={0.3}
            onEndReached={() => {
              if (scrolled.current && hasMore && !loading) {
                scrolled.current = false;
                onMore();
              }
            }}
            renderItem={({ item }) => {
              const status =
                item.applicationStatus ||
                item.booking?.status ||
                item.job?.status;
              const selected = selectedId === item.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={
                    (item.job?.title || 'General conversation') +
                    ', ' +
                    (status || 'Conversation') +
                    ', ' +
                    item.unreadCount +
                    ' unread messages'
                  }
                  onPress={() => onSelect(item.id)}
                  style={[styles.card, selected && styles.selected]}
                >
                  <View style={styles.cardHead}>
                    <View style={styles.icon}>
                      <MessageCircle size={20} color={colors.brandDark} />
                    </View>
                    <Text numberOfLines={2} style={styles.jobTitle}>
                      {item.job?.title || 'General conversation'}
                    </Text>
                    {selected ? (
                      <Check size={20} color={colors.brandDark} />
                    ) : (
                      <ChevronRight size={18} color={colors.muted} />
                    )}
                  </View>
                  <View style={styles.meta}>
                    {status ? (
                      <StatusBadge status={status} />
                    ) : (
                      <Text style={styles.muted}>General enquiries</Text>
                    )}
                    {item.unreadCount > 0 ? (
                      <View style={styles.unread}>
                        <Text style={styles.unreadText}>
                          {item.unreadCount} unread
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.muted}>No unread messages</Text>
                    )}
                  </View>
                  <Text style={styles.muted}>
                    {new Date(item.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {item.readOnly ? ' · Read only' : ''}
                  </Text>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              !loading && !error ? (
                <EmptyState
                  title="No matching conversations"
                  description={
                    hasMore
                      ? 'Load older conversations or try another search.'
                      : 'Try a different job title.'
                  }
                />
              ) : undefined
            }
            ListFooterComponent={
              <ListFeedback
                loading={loading}
                error={error}
                hasMore={hasMore}
                onMore={onMore}
                onRetry={onRetry}
                count={items.length}
              />
            }
          />
        </View>
      </View>
    </Modal>
  );
}
const useStyles = createThemedStyles(colors => ({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9,20,29,0.48)',
  },
  sheet: {
    height: '88%',
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  handle: {
    height: 4,
    width: 36,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 12,
  },
  copy: { flex: 1, gap: 5 },
  title: { fontSize: 22, lineHeight: 29, fontWeight: '800', color: colors.ink },
  muted: { fontSize: 12, lineHeight: 19, color: colors.muted },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: { paddingHorizontal: 22, gap: 12, paddingBottom: 12 },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    backgroundColor: colors.soft,
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: { backgroundColor: colors.brandTint },
  disabled: { opacity: 0.35 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  activeText: { color: colors.brandDark },
  count: { fontSize: 12 },
  list: { padding: 20, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  selected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { padding: 10, borderRadius: 13, backgroundColor: colors.soft },
  jobTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    color: colors.ink,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  unread: {
    borderRadius: 12,
    backgroundColor: colors.brandDark,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
}));
