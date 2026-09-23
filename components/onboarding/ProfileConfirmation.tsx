import React from 'react';
import { Modal, Text, View } from 'react-native';
import Button from '../Ui/Button';
import { styles } from './profileConfirmationStyles';

type Props = {
  visible: boolean;
  loading: boolean;
  error: string;
  onReview: () => void;
  onCreate: () => void;
};

export default function ProfileConfirmation({
  visible,
  loading,
  error,
  onReview,
  onCreate,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onReview}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.headingRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{'\u2713'}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>Create this profile?</Text>
              <Text style={styles.description}>
                Your account will use this profile type. You can edit its
                details later in Settings. Schools and instructors submit their
                profile for review; hirer profiles are active on creation.
                Posting and applying require full verification.
              </Text>
            </View>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button
              title="Review again"
              variant="text"
              onPress={onReview}
              compact
            />
            <Button
              title={loading ? 'Creating...' : 'Create profile'}
              onPress={onCreate}
              disabled={loading}
              compact
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
