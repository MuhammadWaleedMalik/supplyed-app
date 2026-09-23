import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../Ui/Button';
import { colors, serif } from '../Ui/theme';

type Props = { onLogin: () => void; onRegister: () => void };

export default function LandingHeader({ onLogin, onRegister }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.content}>
        <Text style={styles.brand}>SupplyED</Text>
        <View style={styles.actions}>
          <Button title="Login" onPress={onLogin} variant="outline" compact />
          <Button title="Register" onPress={onRegister} compact />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
