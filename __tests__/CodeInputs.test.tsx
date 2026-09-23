import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import CodeInputs from '../components/auth/CodeInputs';

test('email code input accepts pasted six digit code', async () => {
  const changes: Array<[number, string]> = [];
  let screen: ReactTestRenderer.ReactTestRenderer;

  await act(() => {
    screen = ReactTestRenderer.create(
      <CodeInputs
        digits={['', '', '', '', '', '']}
        onChange={(index, value) => changes.push([index, value])}
      />,
    );
  });

  await act(() => {
    screen!.root.findAllByType(TextInput)[0].props.onChangeText('123456');
  });

  expect(changes).toEqual([[0, '123456']]);
  await act(() => screen!.unmount());
});
