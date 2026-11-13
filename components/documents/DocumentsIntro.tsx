import React from 'react';
import { Text, View } from 'react-native';
import GridBackground from '../Ui/GridBackground';
import { useCommonStyles } from '../Ui/theme';
import { AccountType } from '../../utils/onboarding/onboardingData';
import { getIntroCopy } from '../../utils/onboarding/onboardingText';
import { useStyles } from './documentsIntroStyles';

type Props = { type: AccountType; wide: boolean };

export default function DocumentsIntro({ type, wide }: Props) {
  const common = useCommonStyles();
  const styles = useStyles();

  const { heading, description } = getIntroCopy(type, 2);
  const school = type === 'school';

  return (
    <View style={[styles.intro, wide && styles.wideIntro]}>
      <GridBackground />
      <Text style={common.eyebrow}>JOIN SUPPLYED</Text>
      <Text style={styles.title}>{heading}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.step}>
        <Text style={styles.stepIcon}>▤</Text>
        <View>
          <Text style={styles.stepTitle}>
            {school ? 'Compliance check' : 'Required documents'}
          </Text>
          <Text style={styles.stepDescription}>
            {school
              ? 'Complete evidence and approvals for review'
              : 'Upload documents and send for review'}
          </Text>
        </View>
      </View>
      <View style={styles.path}>
        <Text style={styles.pathLabel}>CURRENT PATH</Text>
        <Text style={styles.pathTitle}>
          {school ? 'Compliance check' : 'Document review'}
        </Text>
        <Text style={styles.pathDescription}>
          {school
            ? 'School details are locked. Complete the required compliance checks to continue.'
            : 'Profile details are locked. Add the required document to continue.'}
        </Text>
      </View>
    </View>
  );
}
