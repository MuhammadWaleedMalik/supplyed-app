import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { CheckCircle2, Inbox } from 'lucide-react-native';
import { statusLabel } from '../../utils/ui/marketplaceLabels';
import Button from './Button';
import ContentPreview from './ContentPreview';
import { createThemedStyles, useTheme } from './theme';

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const styles = useRecordStyles();
  const danger = [
    'CANCELLED',
    'REJECTED',
    'NO_SHOW',
    'SUSPENDED',
    'EXPIRED',
  ].includes(status);
  const success = [
    'HIRED',
    'CONFIRMED',
    'COMPLETED',
    'APPROVED',
    'PAID',
    'ACCEPTED',
    'VERIFIED',
  ].includes(status);
  return (
    <View
      style={[
        styles.badge,
        danger
          ? styles.badgeDanger
          : success
          ? styles.badgeSuccess
          : styles.badgeNeutral,
      ]}
    >
      <View
        style={[
          styles.dot,
          danger
            ? styles.dotDanger
            : success
            ? styles.dotSuccess
            : styles.dotNeutral,
        ]}
      />
      <Text
        style={[
          styles.badgeText,
          danger
            ? styles.dangerText
            : success
            ? styles.successText
            : styles.neutralText,
        ]}
      >
        {label || statusLabel(status)}
      </Text>
    </View>
  );
}

export function RecordSection({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const styles = useRecordStyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={styles.flex}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.body}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

export function InfoGrid({
  items,
}: {
  items: { label: string; value?: string | null; icon?: React.ReactNode }[];
}) {
  const styles = useRecordStyles();
  return (
    <View style={styles.grid}>
      {items.map(item => (
        <View key={item.label} style={styles.fact}>
          <View style={styles.factLabel}>
            {item.icon}
            <Text style={styles.label}>{item.label}</Text>
          </View>
          <ContentPreview
            title={item.label}
            text={item.value || 'Not provided'}
            lines={3}
            threshold={100}
            style={styles.value}
          />
        </View>
      ))}
    </View>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const styles = useRecordStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Inbox size={28} color={colors.brandDark} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={[styles.body, styles.center]}>{description}</Text>
    </View>
  );
}

export function ListFeedback({
  loading,
  error,
  hasMore,
  onMore,
  onRetry,
  count = 0,
}: {
  loading: boolean;
  error?: string;
  hasMore: boolean;
  onMore: () => void;
  onRetry: () => void;
  count?: number;
}) {
  const styles = useRecordStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.feedback}>
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Loading more results"
          color={colors.brand}
        />
      ) : null}
      {error ? (
        <>
          <Text accessibilityRole="alert" style={styles.dangerText}>
            {error}
          </Text>
          <Button title="Try again" variant="outline" onPress={onRetry} />
        </>
      ) : hasMore && !loading ? (
        <Button title="Load more" variant="link" onPress={onMore} />
      ) : count > 0 && !loading ? (
        <Text style={styles.label}>You're up to date · {count} loaded</Text>
      ) : null}
    </View>
  );
}

export function Notice({
  text,
  danger = false,
}: {
  text: string;
  danger?: boolean;
}) {
  const styles = useRecordStyles();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, danger && styles.noticeDanger]}
    >
      {!danger ? <CheckCircle2 size={18} color="#18745b" /> : null}
      <ContentPreview
        title={danger ? 'Details' : 'Update'}
        text={text}
        style={[styles.noticeText, danger && styles.dangerText]}
      />
    </View>
  );
}

export function RecordSkeleton() {
  const styles = useRecordStyles();
  return (
    <View
      accessibilityLabel="Loading details"
      accessibilityState={{ busy: true }}
      style={styles.section}
    >
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonShort} />
    </View>
  );
}

export const useRecordStyles = createThemedStyles(colors => ({
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 18,
  },
  sectionHeading: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 25,
  },
  body: { color: colors.muted, fontSize: 14, lineHeight: 23 },
  flex: { flex: 1, gap: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  fact: { flexGrow: 1, flexBasis: '43%', minWidth: 110, gap: 6 },
  factLabel: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  label: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  value: { color: colors.ink, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: { fontSize: 11, lineHeight: 16, fontWeight: '700' },
  badgeDanger: { backgroundColor: '#fff0ee' },
  badgeSuccess: { backgroundColor: '#eaf7f0' },
  badgeNeutral: { backgroundColor: colors.brandTint },
  dot: { height: 5, width: 5, borderRadius: 3 },
  dotDanger: { backgroundColor: '#b42318' },
  dotSuccess: { backgroundColor: '#18745b' },
  dotNeutral: { backgroundColor: colors.brandDark },
  dangerText: { color: '#b42318', fontSize: 14, lineHeight: 22 },
  successText: { color: '#18745b' },
  neutralText: { color: colors.brandDark },
  empty: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  emptyIcon: {
    backgroundColor: colors.brandTint,
    padding: 18,
    borderRadius: 24,
    marginBottom: 6,
  },
  center: { textAlign: 'center' },
  feedback: { paddingVertical: 18, alignItems: 'center', gap: 10 },
  notice: {
    padding: 14,
    backgroundColor: '#eaf7f0',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noticeDanger: {
    backgroundColor: '#fff0ee',
    borderLeftWidth: 3,
    borderLeftColor: '#b42318',
  },
  noticeText: { color: '#18654f', fontSize: 14, lineHeight: 22 },
  skeletonTitle: {
    height: 24,
    width: '65%',
    backgroundColor: colors.border,
    borderRadius: 6,
  },
  skeletonLine: { height: 14, backgroundColor: colors.soft, borderRadius: 4 },
  skeletonShort: {
    height: 14,
    width: '50%',
    backgroundColor: colors.soft,
    borderRadius: 4,
  },
}));
