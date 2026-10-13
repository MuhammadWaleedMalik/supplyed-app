import React, { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { createThemedStyles } from '../Ui/theme';
import GridBackground from '../Ui/GridBackground';

type Props = {
  children: ReactNode;
  soft?: boolean;
  dark?: boolean;
  grid?: boolean;
};

export default function Section({ children, soft, dark, grid }: Props) {
  const styles = useStyles();

  const { width } = useWindowDimensions();

  return (
    <View style={[styles.section, soft && styles.soft, dark && styles.dark]}>
      {grid && <GridBackground />}
      <View style={[styles.content, width < 600 && styles.mobile]}>
        {children}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  section: { backgroundColor: '#ffffff' },
  soft: { backgroundColor: colors.soft },
  dark: { backgroundColor: colors.dark },
  content: {
    width: '100%',
    maxWidth: 1248,
    alignSelf: 'center',
    padding: 48,
    gap: 32,
  },
  mobile: { paddingHorizontal: 20, paddingVertical: 40, gap: 26 },
}));
