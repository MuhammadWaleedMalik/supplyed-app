import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { jobStyles } from './jobStyles';

type Props = { label: string; value: string; options: string[]; onChange: (value: string) => void };

export default function ChoiceField({ label, value, options, onChange }: Props) {
  return (
    <View style={jobStyles.formSection}>
      <Text style={jobStyles.sectionTitle}>{label}</Text>
      <View style={jobStyles.choiceRow}>
        {options.map(option => {
          const active = value === option;
          return <Pressable key={option} onPress={() => onChange(option)}
            style={[jobStyles.choice, active && jobStyles.choiceActive]}>
            <Text style={[jobStyles.choiceText, active && jobStyles.choiceTextActive]}>{option}</Text>
          </Pressable>;
        })}
      </View>
    </View>
  );
}
