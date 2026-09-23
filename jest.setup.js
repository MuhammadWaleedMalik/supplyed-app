/* global jest */
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: error => Boolean(
    error && typeof error === 'object' && 'code' in error,
  ),
}));

jest.setTimeout(20000);

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = () => React.createElement(Text, null, 'icon');
  return new Proxy({}, { get: () => Icon });
});
