import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { ScrollView } from 'react-native';
import HirerDashboardScreen from '../feature/dashboard/screen/HirerDashboardScreen';
import DashboardNav from '../components/dashboard/DashboardNav';
import { dashboardTabs } from '../constants/dashboardData';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

function reply(data: object) {
  return { ok: true, status: 200, json: async () => ({ data }) } as Response;
}

test('mobile hirer dashboard has bottom tabs and loads jobs', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(reply([]));
  let screen: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    screen = ReactTestRenderer.create(
      <HirerDashboardScreen email="hirer@example.com" onExit={() => {}}
        onProfile={() => {}} onSecurity={() => {}} onSettings={() => {}} />,
    );
  });

  expect(dashboardTabs.map(tab => tab.label)).toEqual([
    'Jobs', 'Applications', 'Dashboard', 'Interviews', 'Teachers',
  ]);
  expect(screen!.root.findByType(DashboardNav).props.selected).toBe('Dashboard');
  expect(screen!.root.findByType(ScrollView)).toBeTruthy();

  await act(() => screen!.root.findByType(DashboardNav).props.onSelect('Applications'));
  expect(screen!.root.findByType(DashboardNav).props.selected).toBe('Applications');

  await act(() => screen!.root.findByType(DashboardNav).props.onSelect('Interviews'));
  expect(screen!.root.findByType(DashboardNav).props.selected).toBe('Interviews');

  expect(fetchMock).toHaveBeenCalled();
  await act(() => screen!.unmount());
  fetchMock.mockRestore();
});

