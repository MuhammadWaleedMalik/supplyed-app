import { useRef, ComponentRef } from 'react';
import { LayoutChangeEvent, ScrollView } from 'react-native';

export function useLandingNavigation() {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const benefitsPosition = useRef(0);

  function saveBenefitsPosition(event: LayoutChangeEvent) {
    benefitsPosition.current = event.nativeEvent.layout.y;
  }

  function showBenefits() {
    scrollRef.current?.scrollTo({
      y: benefitsPosition.current,
      animated: true,
    });
  }

  return { scrollRef, saveBenefitsPosition, showBenefits };
}
