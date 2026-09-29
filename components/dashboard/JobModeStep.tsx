import { ArrowRight, BriefcaseBusiness, Zap } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../Ui/theme';
import { jobStyles } from './jobStyles';

type Props = { onSelect: (mode: string) => void };

export default function JobModeStep({ onSelect }: Props) {
  return (
    <View style={jobStyles.modeGrid}>
      <Pressable onPress={() => onSelect('brief')} style={[jobStyles.modeCard, jobStyles.modePrimary]}>
        <View style={jobStyles.modeIcon}><BriefcaseBusiness color={colors.blue} size={25} /></View>
        <View>
          <Text style={jobStyles.modeTitle}>Open brief</Text>
          <Text style={jobStyles.modeBody}>Publish a role for teachers to discover, review, and apply to.</Text>
        </View>
        <ArrowRight color={colors.blue} size={22} />
      </Pressable>
      <Pressable onPress={() => onSelect('instant')} style={jobStyles.modeCard}>
        <View style={jobStyles.modeIcon}><Zap color={colors.ink} size={25} /></View>
        <View>
          <Text style={jobStyles.modeTitle}>Instant match</Text>
          <Text style={jobStyles.modeBody}>Create the role and immediately surface teachers ranked for your needs.</Text>
        </View>
        <ArrowRight color={colors.ink} size={22} />
      </Pressable>
    </View>
  );
}
