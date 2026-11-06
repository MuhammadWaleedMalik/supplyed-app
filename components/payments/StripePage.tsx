import React, { useState } from 'react';
import { Linking, Modal, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Button from '../Ui/Button';
import DetailHeader from '../Ui/DetailHeader';
import { createThemedStyles } from '../Ui/theme';

type Props = {
  title: string;
  url: string;
  onClose: () => void;
  onReturn: (url: string) => boolean;
};

export default function StripePage({ title, url, onClose, onReturn }: Props) {
  const styles = useStyles();
  const [error, setError] = useState('');

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <DetailHeader
            title={title}
            subtitle="Securely powered by Stripe"
            backLabel="Close Stripe"
            onBack={onClose}
          />
          {error ? (
            <View style={styles.message}>
              <Text style={styles.error}>{error}</Text>
              <Button
                title="Open in browser"
                variant="social"
                onPress={() => Linking.openURL(url)}
              />
            </View>
          ) : (
            <WebView
              source={{ uri: url }}
              startInLoadingState
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={request => {
                if (onReturn(request.url)) return false;
                return request.url.startsWith('https://');
              }}
              onError={() =>
                setError(
                  'Stripe could not load here. You can continue in your secure browser.',
                )
              }
            />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const useStyles = createThemedStyles(_colors => ({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  message: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  error: { color: '#b4233f', fontSize: 14, lineHeight: 21 },
}));
