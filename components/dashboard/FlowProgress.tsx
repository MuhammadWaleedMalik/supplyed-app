import { X } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../Ui/theme';
import { jobStyles } from './jobStyles';

type Props = { step: number; title: string; onClose: () => void };

export default function FlowProgress({ step, title, onClose }: Props) {
  return (
    <View style={jobStyles.progressShell}>
      <View style={jobStyles.progressHead}>
        <View style={jobStyles.progressCopy}>
          <Text style={jobStyles.stepLabel}>STEP {step} OF 3</Text>
          <Text style={jobStyles.flowTitle}>{title}</Text>
        </View>
        <Pressable accessibilityLabel="Close flow" onPress={onClose} style={jobStyles.close}>
          <X color={colors.muted} size={20} />
        </Pressable>
      </View>
      <View style={jobStyles.progress}>
        {[1, 2, 3].map(item => <View key={item}
          style={[jobStyles.progressBar, item <= step && jobStyles.progressActive]} />)}
      </View>
    </View>
  );
}
