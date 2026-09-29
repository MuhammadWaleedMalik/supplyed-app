import React from 'react';
import { Text, View } from 'react-native';
import GridBackground from '../Ui/GridBackground';
import { styles } from './introStyles';
import { common } from '../Ui/theme';
import { AccountType } from '../../utils/onboarding/onboardingData';
import {
  getIntroCopy,
  getPathName,
} from '../../utils/onboarding/onboardingText';

type Props = {
  type: AccountType;
  step: number;
  steps: string[][];
  wide: boolean;
};

export default function OnboardingIntro({ type, step, steps, wide }: Props) {
  const { heading, description } = getIntroCopy(type, step);
  const pathName = getPathName(type);

  return (
    <View style={[styles.panel, wide && styles.wide]}>
      <GridBackground />
      <Text style={common.eyebrow}>JOIN SUPPLYED</Text>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.steps}>
        {steps.map(([title, detail], index) => (
          <View key={title} style={styles.row}>
            <Text style={[styles.number, step === index + 1 && styles.active]}>
              {index + 1 < step ? 'OK' : index + 1}
            </Text>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepDetail}>{detail}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.path}>
        <Text style={styles.pathLabel}>CURRENT PATH</Text>
        <Text style={styles.pathTitle}>{pathName}</Text>
        <Text style={styles.pathNote}>
          This profile type was chosen during account creation.
        </Text>
      </View>
    </View>
  );
}
