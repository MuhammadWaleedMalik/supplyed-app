import { ComponentRef, useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';

export function useKeyboardScroll() {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    return undefined;
  }, []);

  return scrollRef;
}
