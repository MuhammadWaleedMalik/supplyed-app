import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Hero from '../../../components/landing/Hero';
import TrustStrip from '../../../components/landing/TrustStrip';
import Cohort from '../../../components/landing/Cohort';
import Benefits from '../../../components/landing/Benefits';
import FoundingRoutes from '../../../components/landing/FoundingRoutes';
import HowItWorks from '../../../components/landing/HowItWorks';
import Faq from '../../../components/landing/Faq';
import ReadySection from '../../../components/landing/ReadySection';
import ShareSection from '../../../components/landing/ShareSection';
import LandingHeader from '../../../components/landing/LandingHeader';
import { useLandingNavigation } from '../hooks/useLandingNavigation';

type Props = { onLogin: () => void; onRegister: () => void };

export default function LandingPage({ onLogin, onRegister }: Props) {
  const { scrollRef, saveBenefitsPosition, showBenefits } =
    useLandingNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LandingHeader onLogin={onLogin} onRegister={onRegister} />
      <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="never">
        <Hero onShowBenefits={showBenefits} />
        <TrustStrip />
        <Cohort />
        <View onLayout={saveBenefitsPosition}>
          <Benefits />
        </View>
        <FoundingRoutes />
        <HowItWorks />
        <Faq />
        <ReadySection />
        <ShareSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#090b0c' },
});
