import { ArrowRight, BriefcaseBusiness, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../Ui/theme';
import { useJobStyles } from './jobStyles';
import Button from '../Ui/Button';

type Props = { value?: string; onSelect: (mode: string) => void };

export default function JobModeStep({ value, onSelect }: Props) {
  const { colors } = useTheme();
  const jobStyles = useJobStyles();
  const [selected, setSelected] = useState(value || '');

  return (
    <View style={jobStyles.modeGrid}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected === 'brief' }}
        onPress={() => setSelected('brief')}
        style={[
          jobStyles.modeCard,
          selected === 'brief' && jobStyles.modePrimary,
        ]}
      >
        <View style={jobStyles.modeIcon}>
          <BriefcaseBusiness color={colors.brand} size={25} />
        </View>
        <View>
          <Text style={jobStyles.modeTitle}>Open applications</Text>
          <Text style={jobStyles.modeBody}>
            Publish a role for teachers to discover and apply to.
          </Text>
        </View>
        <ArrowRight color={colors.brand} size={22} />
      </Pressable>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected === 'instant' }}
        onPress={() => setSelected('instant')}
        style={[
          jobStyles.modeCard,
          selected === 'instant' && jobStyles.modePrimary,
        ]}
      >
        <View style={jobStyles.modeIcon}>
          <Zap color={colors.ink} size={25} />
        </View>
        <View>
          <Text style={jobStyles.modeTitle}>Targeted matching</Text>
          <Text style={jobStyles.modeBody}>
            Create the role, review ranked teachers, and send invitations.
          </Text>
        </View>
        <ArrowRight color={colors.ink} size={22} />
      </Pressable>
      <Button
        title="Next"
        disabled={!selected}
        onPress={() => onSelect(selected)}
      />
    </View>
  );
}
