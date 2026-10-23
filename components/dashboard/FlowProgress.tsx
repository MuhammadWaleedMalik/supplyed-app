import { X } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../Ui/theme';
import { useJobStyles } from './jobStyles';

type Props = {
  step: number;
  total?: number;
  title: string;
  onClose: () => void;
};

export default function FlowProgress({
  step,
  total = 3,
  title,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const jobStyles = useJobStyles();

  return (
    <View style={jobStyles.progressShell}>
      <View style={jobStyles.progressHead}>
        <View style={jobStyles.progressCopy}>
          <Text style={jobStyles.stepLabel}>
            STEP {step} OF {total}
          </Text>
          <Text style={jobStyles.flowTitle}>{title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close flow"
          onPress={onClose}
          style={jobStyles.close}
        >
          <X color={colors.muted} size={20} />
        </Pressable>
      </View>
      <View style={jobStyles.progress}>
        {Array.from({ length: total }, (_, index) => index + 1).map(item => (
          <View
            key={item}
            style={[
              jobStyles.progressBar,
              item <= step && jobStyles.progressActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}
