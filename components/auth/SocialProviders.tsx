import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../Ui/Button';
import Icon from '../Ui/Icon';
import { colors } from '../Ui/theme';
import { showAuthMessage } from '../../utils/auth/authUtils';

export default function SocialProviders() {
  return (
    <View style={styles.content}>
      <View style={styles.buttons}>
        <Button
          title="Continue with Google"
          icon={<Icon name="google" />}
          variant="social"
          onPress={() => showAuthMessage('social')}
        />
        <Button
          title="Continue with Microsoft"
          icon={<Icon name="microsoft" />}
          variant="social"
          onPress={() => showAuthMessage('social')}
        />
      </View>
      <Text style={styles.note}>
        Social providers need credentials configured before they can connect.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10 },
  buttons: { gap: 10 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 17 },
});
