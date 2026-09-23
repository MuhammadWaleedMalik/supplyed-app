import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../Ui/Button';
import { AccountType } from '../../utils/onboarding/onboardingData';
import OnboardingIntro from './OnboardingIntro';
import OnboardingProgress from './OnboardingProgress';
import OnboardingFooter from './OnboardingFooter';
import { styles } from './layoutStyles';
import { useKeyboardScroll } from '../../utils/ui/useKeyboardScroll';

type Props = {
  type: AccountType | null;
  step: number;
  steps: string[][];
  title: string;
  email: string;
  onExit: () => void;
  onBack: () => void;
  onContinue: () => void;
  children: React.ReactNode;
};

export default function OnboardingLayout({
  type,
  step,
  steps,
  title,
  email,
  onExit,
  onBack,
  onContinue,
  children,
}: Props) {
  const { width, fontScale } = useWindowDimensions();
  const scrollRef = useKeyboardScroll();
  const wide = width / fontScale >= 850;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>
          Supply<Text style={styles.brandBlue}>ED</Text>
        </Text>
        <Button title="Exit" variant="link" onPress={onExit} compact />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={[styles.panels, wide && styles.widePanels]}>
            <OnboardingIntro
              type={type}
              step={step}
              steps={steps}
              wide={wide}
            />
            <View style={styles.main}>
              <OnboardingProgress
                title={title}
                subtitle={steps[step - 1][1]}
                email={email}
                step={step}
                total={steps.length}
              />
              <View style={styles.fields}>{children}</View>
              <OnboardingFooter
                finalStep={step === steps.length}
                onBack={onBack}
                onContinue={onContinue}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

