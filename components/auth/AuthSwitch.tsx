import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../Ui/Button';
import { common } from '../Ui/theme';

type Props = { message: string; action: string; onPress: () => void };

export default function AuthSwitch({ message, action, onPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={common.body}>{message}</Text>
      <Button title={action} onPress={onPress} variant="link" compact />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
});
