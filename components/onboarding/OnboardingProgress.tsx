import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, common } from '../Ui/theme';
import { getProgressPercent } from '../../utils/onboarding/onboardingText';

type Props = {
  title: string;
  subtitle: string;
  email: string;
  step: number;
  total: number;
};

export default function OnboardingProgress({
  title,
  subtitle,
  email,
  step,
  total,
}: Props) {
  const percent = getProgressPercent(step, total);

  return (
    <View style={styles.content}>
      <Text style={styles.badge}>
        STEP {step} OF {total}
      </Text>
      <Text accessibilityRole="header" style={common.title}>
        {title}
      </Text>
      <Text style={common.body}>{subtitle}</Text>
      <View style={styles.progressLabel}>
        <Text style={styles.small}>PROGRESS</Text>
        <Text style={styles.small}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: percent + '%' }]} />
      </View>
      {(step === 1 || step === total) && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            {step === 1 ? 'Account email' : 'Ready to review'}
          </Text>
          <Text style={styles.noticeBody}>
            {step === 1
              ? email || 'Account email'
              : 'Review your details before creating your account.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8 },
  badge: {
    color: '#006b93',
    backgroundColor: colors.paleBlue,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '700',
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  small: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eff1f4',
    overflow: 'hidden',
  },
  fill: { height: 6, backgroundColor: colors.blue },
  notice: {
    backgroundColor: colors.paleBlue,
    borderWidth: 1,
    borderColor: '#bae2f1',
    borderRadius: 14,
    padding: 15,
    marginTop: 14,
    gap: 4,
  },
  noticeTitle: { color: '#006b93', fontWeight: '700', fontSize: 14 },
  noticeBody: { color: '#3d718a', fontSize: 12, lineHeight: 18 },
});

