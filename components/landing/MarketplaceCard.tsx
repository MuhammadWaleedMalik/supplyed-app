import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import IconBadge from './IconBadge';
import { colors, common } from '../Ui/theme';

const features = [
  [
    '▦',
    'Schools & MATs',
    'Founding fee lock, early onboarding, and roadmap input.',
  ],
  [
    '✓',
    'Compliance-ready cover',
    'Verified teacher profiles and document-backed compliance signals.',
  ],
  [
    '▤',
    'Real staffing workflows',
    'Urgent cover, planned briefs, and learner support from one workspace.',
  ],
];

export default function MarketplaceCard() {
  return (
    <View style={common.card}>
      <Text style={common.eyebrow}>VERIFIED MARKETPLACE</Text>
      <Text accessibilityRole="header" style={common.title}>
        The right teacher, right now.
      </Text>
      <Text style={common.body}>
        The founding cohort is deliberately small, reviewed in order received,
        and built around real school-cover needs.
      </Text>
      {features.map(([symbol, title, description], index) => (
        <View key={title} style={styles.row}>
          <IconBadge symbol={symbol} />
          <View style={styles.copy}>
            <Text style={common.bold}>
              <Text style={styles.number}>0{index + 1} </Text>
              {title}
            </Text>
            <Text style={common.body}>{description}</Text>
          </View>
        </View>
      ))}
      <View style={styles.notice}>
        <Text style={styles.check}>✓</Text>
        <View style={styles.copy}>
          <Text style={styles.noticeTitle}>Safer checks before activation</Text>
          <Text style={common.body}>
            Enhanced DBS, identity, right-to-work, profile review, ratings, and
            role status stay connected before marketplace access.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  copy: { flex: 1, gap: 5 },
  number: { color: colors.muted, fontSize: 11 },
  notice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.paleBlue,
    borderWidth: 1,
    borderColor: '#ace0f1',
    borderRadius: 12,
    padding: 14,
  },
  check: { color: colors.blue, fontSize: 20 },
  noticeTitle: { color: '#007ba6', fontWeight: '600', fontSize: 15 },
});
