import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import Faq from '../components/landing/Faq';
import Button from '../components/Ui/Button';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaProvider: View, SafeAreaView: View };
});

test('renders the landing page and opens the registration page', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  let app: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    app = ReactTestRenderer.create(<App />);
  });
  const buttons = app!.root.findAllByType(Button);
  expect(buttons.map(button => button.props.title)).toContain(
    'Register interest',
  );
  await act(async () => {
    await buttons
      .find(button => button.props.title === 'Register interest')!
      .props.onPress();
  });
  expect(openURL).toHaveBeenCalledWith(
    'https://supplyed.vercel.app/founding-schools',
  );
  await act(() => {
    app!.unmount();
  });
  openURL.mockRestore();
});

test('expands one FAQ at a time and allows it to close', async () => {
  let faq: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    faq = ReactTestRenderer.create(<Faq />);
  });
  const buttons = faq!.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function',
  );
  expect(buttons[0].props.accessibilityState.expanded).toBe(true);
  expect(
    faq!.root.findAll(node => node.props.children === '\u2212').length,
  ).toBeGreaterThan(0);
  await act(() => {
    buttons[1].props.onPress();
  });
  expect(buttons[0].props.accessibilityState.expanded).toBe(false);
  expect(buttons[1].props.accessibilityState.expanded).toBe(true);
  expect(
    faq!.root
      .findAll(node => typeof node.props.children === 'string')
      .some(text => String(text.props.children).includes('no agency mark-ups')),
  ).toBe(true);
  await act(() => {
    buttons[1].props.onPress();
  });
  expect(buttons[1].props.accessibilityState.expanded).toBe(false);
  await act(() => {
    faq!.unmount();
  });
});
