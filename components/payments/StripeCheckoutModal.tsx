import React, { useEffect, useRef } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { PAYMENT_WEB_ORIGIN } from '../../constants/env';
import { createThemedStyles, useTheme } from '../Ui/theme';

type Result = 'success' | 'cancelled' | 'closed';

type Props = {
  url: string;
  visible: boolean;
  onClose: (result: Result) => void;
  eyebrow?: string;
  title?: string;
  securityMessage?: string;
  returnPaths?: string[];
};

function isDevelopmentReturnHost(hostname: string) {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '10.0.2.2' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.')
  )
    return true;
  const match = hostname.match(/^172\.(\d{1,2})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

export function checkoutReturn(
  value: string,
  returnPaths: string[],
): Result | null {
  try {
    const url = new URL(value);
    if (
      url.protocol === 'supplyed:' &&
      (url.hostname === 'payments' || url.hostname === 'stripe-redirect')
    ) {
      return url.searchParams.get('result') === 'cancelled'
        ? 'cancelled'
        : 'success';
    }
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    const acceptedPaths = returnPaths.map(path => path.replace(/\/$/, '') || '/');
    if (!acceptedPaths.includes(pathname)) return null;
    const productionOrigin = new URL(PAYMENT_WEB_ORIGIN).origin;
    if (
      url.origin !== productionOrigin &&
      !isDevelopmentReturnHost(url.hostname)
    )
      return null;

    // Stripe return URLs are created by the authenticated backend. Development
    // servers can still return localhost or a LAN web address that a physical
    // phone cannot open. Recognise the exact callback path before WebView tries
    // to load it; the app then verifies the outcome with the backend.
    if (pathname === '/payouts/refresh') return 'cancelled';
    if (pathname === '/payouts/return') return 'success';
    const setup = url.searchParams.get('setup');
    return setup === 'success'
      ? 'success'
      : setup === 'cancelled'
      ? 'cancelled'
      : null;
  } catch {
    return null;
  }
}

export default function StripeCheckoutModal({
  url,
  visible,
  onClose,
  eyebrow = 'SECURE CHECKOUT',
  title = 'Add your card',
  securityMessage = 'Card details are entered securely with Stripe',
  returnPaths = ['/settings'],
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const completed = useRef(false);

  useEffect(() => {
    completed.current = false;
  }, [url, visible]);

  function finish(result: Result) {
    if (completed.current) return;
    completed.current = true;
    onClose(result);
  }

  function allow(request: WebViewNavigation) {
    const result = checkoutReturn(request.url, returnPaths);
    if (result) {
      finish(result);
      return false;
    }
    try {
      const protocol = new URL(request.url).protocol;
      if (protocol === 'https:' || protocol === 'http:' || protocol === 'about:')
        return true;
    } catch {
      return false;
    }
    Linking.openURL(request.url).catch(() => {});
    return false;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent={false}
      navigationBarTranslucent={false}
      onRequestClose={() => onClose('closed')}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close card setup"
            hitSlop={8}
            onPress={() => onClose('closed')}
            style={styles.close}
          >
            <X size={22} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.securityBar}>
          <View style={styles.securityDot} />
          <Text style={styles.securityText}>
            {securityMessage}
          </Text>
        </View>
        <WebView
          source={{ uri: url }}
          style={styles.webView}
          onShouldStartLoadWithRequest={allow}
          onNavigationStateChange={navigation => {
            const result = checkoutReturn(navigation.url, returnPaths);
            if (result) finish(result);
          }}
          onError={event => {
            const result = checkoutReturn(event.nativeEvent.url, returnPaths);
            if (result) finish(result);
          }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
          startInLoadingState={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = createThemedStyles(colors => ({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#ffffff',
  },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  securityBar: {
    minHeight: 38,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brandTint,
  },
  securityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandDark,
  },
  securityText: { flex: 1, color: colors.brandDark, fontSize: 12, fontWeight: '700' },
  webView: { flex: 1, backgroundColor: '#ffffff' },
}));
