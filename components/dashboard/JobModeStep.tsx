import { ArrowRight, BriefcaseBusiness, Zap } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../Ui/theme';
import { useJobStyles } from './jobStyles';

type Props = { onSelect: (mode: string) => void };

export default function JobModeStep({ onSelect }: Props) {
  const { colors } = useTheme();
  const jobStyles = useJobStyles();

  return (
    <View style={jobStyles.modeGrid}>
      <Pressable
        onPress={() => onSelect('brief')}
        style={[jobStyles.modeCard, jobStyles.modePrimary]}
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
      <Pressable onPress={() => onSelect('instant')} style={jobStyles.modeCard}>
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
    </View>
  );
}
