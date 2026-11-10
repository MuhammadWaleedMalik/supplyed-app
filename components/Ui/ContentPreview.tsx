import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleProp,
  TextStyle,
  TextProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Expand } from 'lucide-react-native';
import { createThemedStyles, useTheme } from './theme';
import Button from './Button';
import { textPage, textPreview, TEXT_PAGE_SIZE } from '../../utils/ui/textWindow';

export default function ContentPreview({
  text,
  title = 'Full details',
  lines = 4,
  threshold = 240,
  style,
  children,
  accessibilityRole,
}: {
  text: string;
  title?: string;
  lines?: number;
  threshold?: number;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  accessibilityRole?: TextProps['accessibilityRole'];
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const preview = textPreview(text);
  const long = text.length > threshold || preview.split('\n').length > lines;
  const current = textPage(text, page);
  if (!long)
    return (
      <View style={styles.preview}>
        {children || (
          <Text selectable accessibilityRole={accessibilityRole} style={[styles.body, style]}>
            {text}
          </Text>
        )}
      </View>
    );
  return (
    <View style={styles.preview}>
      <Text numberOfLines={lines} accessibilityRole={accessibilityRole} style={[styles.body, style]}>
        {preview}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Read more: ${title}`}
        onPress={() => { setPage(0); setOpen(true); }}
        style={styles.more}
      >
        <Text style={styles.moreText}>Read more</Text>
        <Expand size={14} color={colors.brandDark} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={[
            styles.overlay,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close full details"
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />
          <View style={styles.dialog} accessibilityViewIsModal>
            <View style={styles.header}>
              <Text accessibilityRole="header" numberOfLines={2} style={styles.title}>
                {title}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close full details"
                style={styles.close}
              >
                <X size={21} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView
              key={current.page}
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              {(text.length <= TEXT_PAGE_SIZE && children) || (
                <Text selectable style={[styles.body, style]}>
                  {current.text}
                </Text>
              )}
              {current.count > 1 ? (
                <View style={styles.pagination}>
                  <Text style={styles.body} accessibilityLiveRegion="polite">Page {current.page + 1} of {current.count}</Text>
                  <Button title="Previous page" variant="outline" disabled={current.page === 0} onPress={() => setPage(current.page - 1)} />
                  <Button title="Next page" disabled={current.page + 1 === current.count} onPress={() => setPage(current.page + 1)} />
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const useStyles = createThemedStyles(colors => ({
  preview: { flexShrink: 1, minWidth: 0, maxWidth: '100%', gap: 6 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 23 },
  more: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    minHeight: 40,
    alignSelf: 'flex-start',
  },
  moreText: { color: colors.brandDark, fontWeight: '700', fontSize: 13 },
  overlay: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9,20,29,0.5)',
  },
  dialog: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '86%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.ink,
  },
  close: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 22, paddingBottom: 30 },
  scroll: { flexShrink: 1 },
  pagination: { gap: 12, paddingTop: 20 },
}));
