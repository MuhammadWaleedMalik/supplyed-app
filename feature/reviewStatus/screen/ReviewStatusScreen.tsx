import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import {
  assertSessionVersion,
  getSessionVersion,
} from '../../../utils/api/session';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import {
  createThemedStyles,
  useTheme,
  useCommonStyles,
} from '../../../components/Ui/theme';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import {
  getDocuments,
  getRequirements,
} from '../../documents/apis/documentApi';
import { requiredDocumentsReady } from '../../../utils/documents/documentUtils';
import {
  getProfile,
  getComplianceApproval,
  getSignatoryApproval,
  ComplianceApproval,
  Profile,
  SignatoryApproval,
  submitProfileForReview,
} from '../../onboarding/apis/profileApi';

type Props = {
  type: AccountType;
  email: string;
  onDashboard: () => void;
  onDocuments?: () => void;
  onEditProfile?: () => void;
  onExit?: () => void;
};

function isMatSchool(type: AccountType, profile: Profile | null) {
  return type === 'school' && profile?.institutionType === 'MAT_SCHOOL';
}

type InstitutionApproval = SignatoryApproval | ComplianceApproval;

function needsInstitutionApproval(type: AccountType, profile: Profile | null) {
  return (
    type === 'school' &&
    (isMatSchool(type, profile) || profile?.complianceApprovalRequired !== false)
  );
}

function canOpenDashboard(
  type: AccountType,
  profile: Profile | null,
  approval: InstitutionApproval | null,
) {
  const profileReady = profile?.status === 'ACTIVE';
  const approvalReady =
    !needsInstitutionApproval(type, profile) || approval?.status === 'APPROVED';
  return profileReady && approvalReady;
}

function approvalText(approval: InstitutionApproval | null) {
  if (!approval) return 'Not requested yet';
  if (approval.status === 'PENDING') return 'Waiting for approval';
  if (approval.status === 'APPROVED') return 'Approved';
  if (approval.status === 'DECLINED') return 'Declined';
  if (approval.status === 'EXPIRED') return 'Expired';
  return approval.status;
}

async function loadApproval(type: AccountType, profile: Profile) {
  if (isMatSchool(type, profile)) return getSignatoryApproval();
  if (needsInstitutionApproval(type, profile)) return getComplianceApproval();
  return null;
}

async function submitIfReady(
  type: AccountType,
  profile: Profile,
  approval: InstitutionApproval | null,
) {
  const version = getSessionVersion();
  const trustReady =
    !needsInstitutionApproval(type, profile) || approval?.status === 'APPROVED';
  if (profile.status !== 'INCOMPLETE' || !trustReady) return profile;
  const requirements = await getRequirements();
  assertSessionVersion(version);
  const documents = await getDocuments();
  assertSessionVersion(version);
  if (!requiredDocumentsReady(requirements, documents)) return profile;
  return submitProfileForReview(type);
}

export default function ReviewStatusScreen({
  type,
  email,
  onDashboard,
  onDocuments,
  onEditProfile,
  onExit,
}: Props) {
  const { colors } = useTheme();
  const common = useCommonStyles();
  const styles = useStyles();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [approval, setApproval] = useState<InstitutionApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const matSchool = isMatSchool(type, profile);
  const institutionApprovalRequired = needsInstitutionApproval(type, profile);
  const profileReady = profile?.status === 'ACTIVE';
  const approvalReady =
    !institutionApprovalRequired || approval?.status === 'APPROVED';

  const loadAll = useCallback(async () => {
    const version = getSessionVersion();
    const active = () => mounted.current && version === getSessionVersion();
    setLoading(true);
    setError('');
    try {
      let nextProfile = await getProfile(type);
      if (!active()) return;
      let nextApproval: InstitutionApproval | null = null;

      if (isMatSchool(type, nextProfile)) {
        nextApproval = await getSignatoryApproval();
        if (!active()) return;
      } else if (
        type === 'school' &&
        nextProfile.complianceApprovalRequired !== false
      ) {
        nextApproval = await getComplianceApproval();
        if (!active()) return;
      }

      nextProfile = await submitIfReady(type, nextProfile, nextApproval);
      if (!active()) return;
      setProfile(nextProfile);
      setApproval(nextApproval);

      if (canOpenDashboard(type, nextProfile, nextApproval)) {
        onDashboard();
      }
    } catch (problem) {
      if (!active()) return;
      setError(
        problem instanceof Error ? problem.message : 'Unable to check status.',
      );
    }
    setLoading(false);
  }, [type, onDashboard]);

  async function refreshProfileStatus() {
    if (loading || profileBusy || approvalBusy) return;
    const version = getSessionVersion();
    setProfileBusy(true);
    setError('');
    try {
      let nextProfile = await getProfile(type);
      assertSessionVersion(version);
      const nextApproval = await loadApproval(type, nextProfile);
      assertSessionVersion(version);
      nextProfile = await submitIfReady(type, nextProfile, nextApproval);
      if (!mounted.current || version !== getSessionVersion()) return;
      setProfile(nextProfile);
      setApproval(nextApproval);

      if (canOpenDashboard(type, nextProfile, nextApproval)) {
        onDashboard();
      }
    } catch (problem) {
      if (!mounted.current || version !== getSessionVersion()) return;
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to refresh profile status.',
      );
    }
    setProfileBusy(false);
  }

  async function refreshApprovalStatus() {
    if (!institutionApprovalRequired || loading || profileBusy || approvalBusy)
      return;
    const version = getSessionVersion();

    setApprovalBusy(true);
    setError('');
    try {
      let nextProfile = await getProfile(type);
      assertSessionVersion(version);
      const nextApproval = await loadApproval(type, nextProfile);
      assertSessionVersion(version);

      if (nextProfile) {
        nextProfile = await submitIfReady(type, nextProfile, nextApproval);
        if (!mounted.current || version !== getSessionVersion()) return;
        setProfile(nextProfile);
      }

      setApproval(nextApproval);

      if (canOpenDashboard(type, nextProfile, nextApproval)) {
        onDashboard();
      }
    } catch (problem) {
      if (!mounted.current || version !== getSessionVersion()) return;
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to refresh approval status.',
      );
    }
    setApprovalBusy(false);
  }

  useEffect(() => {
    mounted.current = true;
    loadAll();
    return () => {
      mounted.current = false;
    };
  }, [loadAll]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>
          Supply<Text style={styles.brandBlue}>ED</Text>
        </Text>
        <Text numberOfLines={1} style={styles.email}>
          {email}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.badge}>PROFILE REVIEW</Text>
          <Text style={common.cardTitle}>Your profile review</Text>
          <Text style={common.body}>
            You can access the dashboard after the profile is active
            {institutionApprovalRequired
              ? matSchool
                ? ' and the MAT signatory has approved it.'
                : ' and the school compliance contact has approved it.'
              : '.'}
          </Text>

          <View style={styles.statusBox}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Profile status</Text>
              <Text style={[styles.statusValue, profileReady && styles.good]}>
                {profile?.status || 'Checking'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>
                {matSchool ? 'Trust signatory approval' : 'Compliance approval'}
              </Text>
              <Text style={[styles.statusValue, approvalReady && styles.good]}>
                {institutionApprovalRequired
                  ? approvalText(approval)
                  : 'Not required'}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.small}>Checking latest status...</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            {onEditProfile ? (
              <Button
                title="Review profile details"
                onPress={onEditProfile}
                variant="outline"
                disabled={loading || profileBusy || approvalBusy}
              />
            ) : null}
            {onDocuments ? (
              <Button
                title="Update documents"
                variant="text"
                onPress={onDocuments}
                disabled={loading || profileBusy || approvalBusy}
                compact
              />
            ) : null}
            {onExit ? (
              <Button
                title="Sign out"
                variant="link"
                onPress={onExit}
                compact
              />
            ) : null}
            <Button
              title={profileBusy ? 'Refreshing...' : 'Check review status'}
              onPress={refreshProfileStatus}
              disabled={loading || profileBusy || approvalBusy}
              compact
            />
            {institutionApprovalRequired ? (
              <Button
                title={
                  approvalBusy
                    ? 'Refreshing...'
                    : matSchool
                    ? 'Check trust approval'
                    : 'Check compliance approval'
                }
                variant="text"
                onPress={refreshApprovalStatus}
                disabled={loading || profileBusy || approvalBusy}
                compact
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors, _common, layout) => ({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  topBar: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: colors.brandBorder,
    backgroundColor: '#ffffff',
  },
  brand: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.ink,
  },
  brandBlue: {
    color: colors.brand,
  },
  email: {
    flexShrink: 1,
    maxWidth: 180,
    color: colors.muted,
    fontSize: 12,
  },
  overlay: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    paddingBottom: 96,
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 22,
    gap: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: colors.brandTint,
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBox: {
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: layout.stack ? 'column' : 'row',
    alignItems: layout.stack ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderColor: colors.brandBorder,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  statusValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    textAlign: layout.stack ? 'left' : 'right',
    flexShrink: 1,
  },
  good: {
    color: '#198742',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  small: {
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    color: '#c93251',
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'column',
    gap: 10,
  },
}));
