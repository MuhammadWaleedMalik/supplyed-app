import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import {
  createThemedStyles,
  useTheme,
} from '../../../components/Ui/theme';

type Props = { error: string; onRetry: () => void; onExit: () => void };

export default function SessionScreen({ error, onRetry, onExit }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />
      <ScrollView
        contentContainerStyle={styles.page}
        alwaysBounceVertical={false}
      >
        <View style={styles.brandRow} accessibilityLabel="SupplyED">
          <Text style={styles.brand}>Supply</Text>
          <Text style={styles.brandAccent}>ED</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            {error ? (
              <ShieldCheck size={34} color={colors.brandDark} />
            ) : (
              <ActivityIndicator
                accessibilityLabel="Loading account"
                color={colors.brandDark}
                size="large"
              />
            )}
          </View>
          <Text style={styles.eyebrow}>
            {error ? 'CONNECTION PAUSED' : 'WELCOME BACK'}
          </Text>
          <Text style={styles.title}>
            {error ? 'We could not load your account' : 'Preparing your workspace'}
          </Text>
          <Text style={styles.body}>
            {error ||
              'We’re securely restoring your profile, preferences and latest activity.'}
          </Text>
          {!error ? (
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          ) : (
            <Button title="Try again" onPress={onRetry} />
          )}
          <View style={styles.secureRow}>
            <ShieldCheck size={17} color={colors.brandDark} />
            <Text style={styles.secureText}>Your session is protected</Text>
          </View>
        </View>
        <Button title="Log out" variant="link" onPress={onExit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles(colors => ({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.dark,
  },
  glowLarge: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: -170,
    right: -150,
    backgroundColor: colors.brandDark,
    opacity: 0.24,
  },
  glowSmall: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -120,
    left: -90,
    backgroundColor: colors.brand,
    opacity: 0.16,
  },
  page: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 34,
    gap: 24,
  },
  brandRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brand: { color: '#ffffff', fontSize: 29, fontWeight: '900' },
  brandAccent: { color: colors.brand, fontSize: 29, fontWeight: '900' },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.26,
    shadowRadius: 20,
    elevation: 10,
  },
  iconRing: {
    width: 82,
    height: 82,
    marginBottom: 4,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: colors.brandTint,
    backgroundColor: '#ffffff',
  },
  eyebrow: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  title: {
    maxWidth: 320,
    color: colors.ink,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    maxWidth: 350,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    marginTop: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: colors.soft,
  },
  progressFill: {
    width: '68%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.brandDark,
  },
  secureRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  secureText: { color: colors.brandDark, fontSize: 12, fontWeight: '700' },
}));
