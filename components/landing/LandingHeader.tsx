import React from 'react';
import { Text, View } from 'react-native';
import Button from '../Ui/Button';
import { serif, createThemedStyles } from '../Ui/theme';

type Props = { onLogin: () => void; onRegister: () => void; light?: boolean };

export default function LandingHeader({ onLogin, onRegister, light }: Props) {
  const styles = useStyles();

  return (
    <View style={[styles.bar, light && styles.lightBar]}>
      <View style={styles.content}>
        <Text style={[styles.brand, light && styles.lightBrand]}>
          Supply<Text style={styles.brandAccent}>ED</Text>
        </Text>
        <View style={styles.actions}>
          <Button title="Login" onPress={onLogin} variant="outline" compact />
          <Button title="Register" onPress={onRegister} compact />
        </View>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  lightBar: {
    backgroundColor: '#ffffff',
    borderBottomColor: colors.brandBorder,
  },
  lightBrand: { color: colors.ink },
  brandAccent: { color: colors.brand },
  bar: {
    backgroundColor: colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: '#17242c',
  },
  content: {
    width: '100%',
    maxWidth: 1248,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  brand: {
    fontFamily: serif,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 23,
  },
  actions: { flexDirection: 'row', gap: 8 },
}));
