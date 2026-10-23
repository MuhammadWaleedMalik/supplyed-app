import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import { createThemedStyles } from './theme';

export default function AutoUpdatedField({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  const opacity = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (active) {
      opacity.setValue(1);
      if (!reduced)
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }).start();
    } else opacity.setValue(0);
    return () => opacity.stopAnimation();
  }, [active, reduced, opacity]);
  return (
    <View style={styles.wrapper}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[styles.highlight, { opacity }]}
      />
      {active ? (
        <Text accessibilityLiveRegion="polite" style={styles.label}>
          Updated from your planned work
        </Text>
      ) : null}
    </View>
  );
}
const useStyles = createThemedStyles(colors => ({
  wrapper: { gap: 6 },
  highlight: {
    position: 'absolute',
    top: -5,
    left: -5,
    bottom: -5,
    right: -5,
    borderRadius: 14,
    borderColor: colors.brand,
    borderWidth: 2,
  },
  label: { fontSize: 12, color: colors.brandDark, lineHeight: 18 },
}));
