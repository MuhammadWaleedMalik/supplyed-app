import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import { styles } from '../../../components/dashboard/dashboardStyles';

type Props = { error: string; onRetry: () => void; onExit: () => void };

export default function SessionScreen({ error, onRetry, onExit }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <Text style={styles.title}>Loading your account</Text>
        {error ? (
          <>
            <Text style={styles.cardBody}>{error}</Text>
            <Button title="Try again" onPress={onRetry} />
          </>
        ) : (
          <ActivityIndicator />
        )}
        <Button title="Log out" variant="link" onPress={onExit} />
      </View>
    </SafeAreaView>
  );
}
