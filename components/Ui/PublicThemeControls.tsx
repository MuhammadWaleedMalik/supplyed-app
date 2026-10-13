import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, X } from 'lucide-react-native';
import ThemePicker from './ThemePicker';
import { createThemedStyles, useTheme } from './theme';

export default function PublicThemeControls() {
  const [open, setOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors, name } = useTheme();
  const styles = useStyles();
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return (
    <>
      {!keyboardVisible && !open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change theme. Current color: ${name}`}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.trigger,
            { bottom: insets.bottom + 18, right: insets.right + 18 },
            pressed && styles.pressed,
          ]}
        >
          <Palette size={24} color="#ffffff" />
        </Pressable>
      ) : null}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close theme chooser"
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 20),
                marginTop: insets.top + 20,
              },
            ]}
          >
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>
                Make it your color
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close theme chooser"
                onPress={() => setOpen(false)}
                style={styles.close}
              >
                <X size={22} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.description}>
                Choose a theme for this app session. You can also change it in
                Settings after signing in.
              </Text>
              <ThemePicker />
              <Text style={styles.description}>
                A full reload returns to Supply blue.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const useStyles = createThemedStyles(colors => ({
  trigger: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.brandDark,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  sheet: {
    flexShrink: 1,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700', flex: 1 },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: 18, paddingTop: 10, paddingBottom: 8 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  pressed: { opacity: 0.8 },
}));
