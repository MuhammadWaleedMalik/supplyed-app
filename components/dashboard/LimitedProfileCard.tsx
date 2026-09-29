import { MapPin, X } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { LimitedProfile } from '../../feature/dashboard/shared/apis/publicProfileApi';
import { colors } from '../Ui/theme';
import { limitedProfileStyles as styles } from './limitedProfileStyles';

type Props = { profile?: LimitedProfile; error?: string; loading?: boolean; onClose: () => void };

export default function LimitedProfileCard({ profile, error, loading, onClose }: Props) {
  const visible = Boolean(profile || error || loading);
  const imageReady = Boolean(profile?.imageUrl && /^(?:https?:|data:)/.test(profile.imageUrl));
  const initials = profile?.title.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'P';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close profile" onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <Pressable accessibilityLabel="Close profile" onPress={onClose} style={styles.close}>
            <X color={colors.muted} size={20} />
          </Pressable>
          {loading ? <View style={styles.loading}>
            <ActivityIndicator color={colors.blue} size="large" />
            <Text style={styles.subtitle}>Loading profile...</Text>
          </View> : null}
          {!loading ? <ScrollView contentContainerStyle={styles.scroll}>
            {profile ? <>
              <View style={styles.hero}>
                {imageReady ? <Image source={{ uri: profile.imageUrl }} style={styles.avatar} /> : (
                  <View style={styles.avatarEmpty}><Text style={styles.initials}>{initials}</Text></View>
                )}
                <Text style={styles.title}>{profile.title}</Text>
                <Text style={styles.subtitle}>{profile.subtitle}</Text>
                {profile.note ? <View style={styles.badge}><Text style={styles.badgeText}>{profile.note}</Text></View> : null}
                {profile.location ? <View style={styles.location}>
                  <MapPin color={colors.muted} size={14} />
                  <Text style={styles.subtitle}>{profile.location}</Text>
                </View> : null}
              </View>
              {profile.about ? <View style={styles.section}>
                <Text style={styles.label}>ABOUT</Text><Text style={styles.body}>{profile.about}</Text>
              </View> : null}
              {profile.tags?.length ? <View style={styles.section}>
                <Text style={styles.label}>EXPERIENCE AND SKILLS</Text>
                <View style={styles.tags}>{profile.tags.map(tag => (
                  <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                ))}</View>
              </View> : null}
            </> : <View style={styles.loading}>
              <Text style={styles.title}>Profile unavailable</Text>
              <Text style={styles.error}>{error}</Text>
            </View>}
          </ScrollView> : null}
        </View>
      </View>
    </Modal>
  );
}