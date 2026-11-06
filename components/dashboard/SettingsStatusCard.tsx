import { ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { ProfileSnapshot } from '../../feature/dashboard/shared/apis/settingsApi';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';
import { protectedRequest } from '../../utils/api/request';
import { endpoints } from '../../constants/endpoints';
import { getSessionVersion } from '../../utils/api/session';

type Props = { settings?: ProfileSnapshot };

function Record({ label, value }: { label: string; value: string }) {
  const settingsStyles = useSettingsStyles();

  return (
    <View style={settingsStyles.record}>
      <Text style={settingsStyles.recordLabel}>{label}</Text>
      <Text style={settingsStyles.recordValue}>{value}</Text>
    </View>
  );
}

export default function SettingsStatusCard({ settings }: Props) {
  const settingsStyles = useSettingsStyles();
  const [completion, setCompletion] = useState<{
    percentage: number;
    canPostJobs: boolean;
    items: { id: string; label: string; complete: boolean }[];
  }>();
  const [completionError, setCompletionError] = useState('');

  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    protectedRequest<{
      percentage: number;
      canPostJobs: boolean;
      items: { id: string; label: string; complete: boolean }[];
    }>(endpoints.profileCompletion)
      .then(result => {
        if (active && version === getSessionVersion()) setCompletion(result);
      })
      .catch(problem => {
        if (active && version === getSessionVersion())
          setCompletionError(
            problem instanceof Error
              ? problem.message
              : 'Unable to load profile completion.',
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const user = settings?.user;
  const profile = settings?.profile || {};
  return (
    <View style={settingsStyles.card}>
      <SettingsCardHeader
        icon={ShieldCheck}
        title="ACCOUNT STATUS"
        note="Verification and security summary."
      />
      <Record label="ROLE" value={user?.role || 'Loading'} />
      <Record
        label="EMAIL"
        value={user?.emailVerified ? 'Verified' : 'Not verified'}
      />
      <Record
        label="PHONE"
        value={user?.phoneVerified ? 'Verified' : 'Not verified'}
      />
      <Record
        label="TWO-FACTOR"
        value={user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
      />
      <Record label="PROFILE" value={String(profile.status || 'INCOMPLETE')} />
      {completion ? (
        <>
          <Record
            label="PROFILE COMPLETION"
            value={`${completion.percentage}%`}
          />
          {completion.items
            .filter(item => !item.complete)
            .map(item => (
              <Text key={item.id} style={settingsStyles.cardNote}>
                • {item.label}
              </Text>
            ))}
        </>
      ) : null}
      {completionError ? (
        <Text style={settingsStyles.error}>{completionError}</Text>
      ) : null}
      <Record
        label="LAST LOGIN"
        value={user?.lastLogin?.slice(0, 10) || 'Not available'}
      />
    </View>
  );
}
