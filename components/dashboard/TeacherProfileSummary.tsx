import { MapPin } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { useLimitedProfile } from '../../feature/dashboard/shared/hooks/useLimitedProfile';
import { useTheme } from '../Ui/theme';
import { useApplicationStyles } from './applicationStyles';
import { useStyles } from './dashboardStyles';

type Props = {
  teacherId: string;
  compact?: boolean;
};

export default function TeacherProfileSummary({
  teacherId,
  compact = false,
}: Props) {
  const { colors } = useTheme();
  const applicationStyles = useApplicationStyles();
  const styles = useStyles();

  const profileState = useLimitedProfile('teacher', teacherId);
  const profile = profileState.profile;

  if (profileState.loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.brand} />
        <Text style={styles.cardBody}>Loading teacher profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Teacher profile</Text>
        <Text style={styles.cardBody}>
          {profileState.error || 'Profile information is unavailable.'}
        </Text>
      </View>
    );
  }

  const canShowImage = Boolean(
    profile.imageUrl && /^(?:https?:|data:)/.test(profile.imageUrl),
  );
  const initials =
    profile.title
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'T';

  return (
    <View style={compact ? styles.section : styles.card}>
      {!compact ? <Text style={styles.cardTitle}>Teacher profile</Text> : null}

      <View style={applicationStyles.profileHeader}>
        {canShowImage ? (
          <Image
            source={{ uri: profile.imageUrl }}
            style={applicationStyles.profileAvatar}
          />
        ) : (
          <View style={applicationStyles.profileAvatarEmpty}>
            <Text style={applicationStyles.profileInitials}>{initials}</Text>
          </View>
        )}

        <View style={applicationStyles.profileCopy}>
          <Text style={styles.teacherName}>{profile.title}</Text>
          <Text style={styles.cardBody}>{profile.subtitle}</Text>

          {profile.location ? (
            <View style={applicationStyles.profileLocation}>
              <MapPin color={colors.muted} size={14} />
              <Text style={styles.teacherMeta}>{profile.location}</Text>
            </View>
          ) : null}

          {profile.note && !compact ? (
            <Text style={styles.teacherMeta}>{profile.note}</Text>
          ) : null}
        </View>
      </View>

      {profile.about && !compact ? (
        <Text style={styles.cardBody}>{profile.about}</Text>
      ) : null}

      {profile.tags?.length && !compact ? (
        <View style={applicationStyles.profileTags}>
          {profile.tags.map(tag => (
            <View key={tag} style={applicationStyles.profileTag}>
              <Text style={applicationStyles.profileTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {profile.details?.length && !compact ? (
        <View style={styles.section}>
          <Text style={styles.eyebrow}>MARKETPLACE DETAILS</Text>
          {profile.details.map(detail => (
            <Text key={detail} style={styles.cardBody}>
              {detail}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
