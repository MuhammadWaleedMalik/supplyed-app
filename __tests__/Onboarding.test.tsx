import React from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import OnboardingScreen from '../feature/onboarding/screen/OnboardingScreen';
import OnboardingProgress from '../components/onboarding/OnboardingProgress';
import OnboardingFooter from '../components/onboarding/OnboardingFooter';
import RoleSelection from '../components/onboarding/RoleSelection';
import ReviewContent from '../components/onboarding/ReviewContent';
import Input from '../components/Ui/Input';
import Select from '../components/Ui/Select';
import Checkbox from '../components/Ui/Checkbox';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

async function openRole(role: 'school' | 'teacher' | 'individual') {
  let screen: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    screen = ReactTestRenderer.create(
      <OnboardingScreen
        email="school@example.com"
        onExit={() => {}}
        onProfileCreated={() => {}}
      />,
    );
  });
  await act(() => screen!.root.findByType(RoleSelection).props.onSelect(role));
  return screen!;
}

async function fill(
  screen: ReactTestRenderer.ReactTestRenderer,
  label: string,
  value: string,
) {
  await act(() => {
    screen.root
      .findAllByType(Input)
      .find(input => input.props.label === label)!
      .props.onChangeText(value);
  });
}

async function continueStep(screen: ReactTestRenderer.ReactTestRenderer) {
  await act(() => screen.root.findByType(OnboardingFooter).props.onContinue());
}

test('school steps validate details and show the entered values on review', async () => {
  const screen = await openRole('school');
  expect(screen.root.findByType(KeyboardAvoidingView)).toBeTruthy();
  expect(
    screen.root.findByType(ScrollView).props.keyboardShouldPersistTaps,
  ).toBe('handled');
  await continueStep(screen);
  expect(screen.root.findByType(OnboardingProgress).props.step).toBe(1);
  await fill(screen, 'FULL NAME', 'A School User');
  await continueStep(screen);
  expect(screen.root.findByType(OnboardingProgress).props.step).toBe(2);
  await fill(screen, 'SCHOOL OR MAT NAME', 'Greenfield School');
  await fill(screen, 'SCHOOL / TRUST DOMAIN', 'greenfield.ac.uk');
  await fill(screen, 'ADDRESS', '1 School Lane');
  await act(() => {
    screen.root
      .findAllByType(Select)
      .find(select => select.props.label === 'CITY')!
      .props.onChange('Greater Manchester');
  });
  await continueStep(screen);
  expect(screen.root.findByType(OnboardingProgress).props.step).toBe(3);
  await continueStep(screen);
  expect(screen.root.findByType(OnboardingProgress).props.step).toBe(3);
  await act(() => screen.root.findByType(Checkbox).props.onChange(true));
  await continueStep(screen);
  expect(screen.root.findByType(OnboardingProgress).props.step).toBe(4);
  expect(screen.root.findByType(OnboardingFooter).props.finalStep).toBe(true);
  expect(screen.root.findByType(ReviewContent).props.data.schoolName).toBe(
    'Greenfield School',
  );
  await act(() => screen.unmount());
});

test.each(['teacher', 'individual'] as const)(
  '%s reaches a two-step review',
  async role => {
    const screen = await openRole(role);
    await fill(screen, 'FULL NAME', 'A User');
    await continueStep(screen);
    expect(screen.root.findByType(OnboardingProgress).props.total).toBe(2);
    expect(screen.root.findByType(OnboardingProgress).props.step).toBe(2);
    expect(screen.root.findByType(ReviewContent).props.type).toBe(role);
    expect(screen.root.findByType(OnboardingFooter).props.finalStep).toBe(true);
    await act(() => screen.unmount());
  },
);
