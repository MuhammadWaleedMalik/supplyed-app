import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useJobStyles } from './jobStyles';

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  hideLabel?: boolean;
};

export default function ChoiceField({
  label,
  value,
  options,
  onChange,
  hideLabel,
}: Props) {
  const jobStyles = useJobStyles();

  return (
    <View style={jobStyles.formSection}>
      {!hideLabel ? <Text style={jobStyles.sectionTitle}>{label}</Text> : null}
      <View style={jobStyles.choiceRow}>
        {options.map(option => {
          const active = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${option}`}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option)}
              style={[jobStyles.choice, active && jobStyles.choiceActive]}
            >
              <Text
                style={[
                  jobStyles.choiceText,
                  active && jobStyles.choiceTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
