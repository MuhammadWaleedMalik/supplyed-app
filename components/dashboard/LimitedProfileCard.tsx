import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { LimitedProfile } from '../../feature/dashboard/shared/apis/publicProfileApi';
import Button from '../Ui/Button';
import { EmptyState, RecordSkeleton } from '../Ui/RecordLayout';
import { createThemedStyles } from '../Ui/theme';
import ProfileContent from './ProfileContent';

export default function LimitedProfileCard({ profile, error, loading, onClose }: { profile?: LimitedProfile; error?: string; loading?: boolean; onClose: () => void }) {
  const styles = useStyles();
  return <Modal visible={!!(profile || error || loading)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaProvider><SafeAreaView style={styles.screen}>
      <View style={styles.header}><Text style={styles.title}>{profile?.reviewType === 'institution' ? 'School profile' : 'Teacher profile'}</Text><Button title="Done" variant="link" onPress={onClose} /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? <><RecordSkeleton /><RecordSkeleton /></> : profile ? <ProfileContent profile={profile} reviews /> : <EmptyState title="Profile unavailable" description={error || 'This profile could not be loaded.'} />}
      </ScrollView>
    </SafeAreaView></SafeAreaProvider>
  </Modal>;
}
const useStyles = createThemedStyles(colors => ({
  screen: { flex: 1, backgroundColor: colors.soft }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: '#fff' }, title: { fontSize: 16, fontWeight: '700', color: colors.ink }, content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, paddingBottom: 36, gap: 18 },
}));
