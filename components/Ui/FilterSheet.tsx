import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import Button from './Button';
import { createThemedStyles, useTheme } from './theme';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  applyLabel?: string;
  applyDisabled?: boolean;
  busy?: boolean;
  destructive?: boolean;
  resetLabel?: string;
  children: React.ReactNode;
};

export default function FilterSheet({
  visible,
  title,
  onClose,
  onApply,
  onReset,
  applyLabel = 'Show results',
  applyDisabled = false,
  busy = false,
  destructive = false,
  resetLabel = 'Reset',
  children,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => { if (!busy) onClose(); }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityLabel={`Close ${title}`}
          accessibilityRole="button"
          onPress={onClose}
          disabled={busy}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel={`Close ${title} without confirming`}
              onPress={onClose}
              disabled={busy}
            >
              <X size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.contentScroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
          <View style={styles.footer}>
            <Button title={resetLabel} variant="link" disabled={busy} onPress={onReset} />
            <View style={styles.apply}>
              <Button
                title={applyLabel}
                disabled={applyDisabled}
                loading={busy}
                variant={destructive ? 'danger' : 'primary'}
                onPress={onApply}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = createThemedStyles(colors => ({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  sheet: {
    maxHeight: '90%',
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    minHeight: 64,
    paddingLeft: 20,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, fontSize: 21, fontWeight: '700', color: colors.ink },
  close: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20, gap: 20 },
  contentScroll: { flexGrow: 0, flexShrink: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  apply: { flex: 1 },
}));
