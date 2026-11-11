import React, { useState } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useIdentityVerification } from '../../feature/identityVerification/hooks/useIdentityVerification';
import {
  describeDbsCheck,
  describeIdentityState,
  identityCheckPending,
  identityStateTag,
  identityStepRequired,
} from '../../feature/identityVerification/apis/identityVerificationApi';
import Button from '../Ui/Button';
import Checkbox from '../Ui/Checkbox';
import PhoneVerificationCard from '../auth/PhoneVerificationCard';
import SettingsCardHeader from '../dashboard/SettingsCardHeader';
import { useSettingsStyles } from '../dashboard/settingsStyles';

type Props = {
  setup?: boolean;
  showDbs?: boolean;
  hideWhenDisabled?: boolean;
  onVerify?: () => void;
  onContinue?: () => void;
};

export default function IdentityVerificationCard({
  setup = false,
  showDbs = false,
  hideWhenDisabled = false,
  onVerify,
  onContinue,
}: Props) {
  const styles = useSettingsStyles();
  const form = useIdentityVerification(setup, showDbs);
  const [consent, setConsent] = useState(false);
  const [privacyError, setPrivacyError] = useState('');
  const identity = form.identity;
  const verification = identity?.verification;
  const liveLink =
    verification?.status === 'LINK_SENT' && !!verification.guestLinkUrl;
  const canStart = identity?.state === 'NOT_STARTED' && identity.canStart;
  const phoneVerified = form.user?.phoneVerified === true;
  const busy = form.loading || form.starting;

  async function openPrivacy() {
    try {
      await Linking.openURL('https://supplyed.vercel.app/terms#privacy');
    } catch {
      setPrivacyError(
        'Unable to open the privacy information. Please try again.',
      );
    }
  }

  if (hideWhenDisabled && identity?.required === false) return null;

  return (
    <View style={styles.card}>
      <SettingsCardHeader
        icon={ShieldCheck}
        title="IDENTITY VERIFICATION"
        note="Verified by TrustID. Required before your profile can be approved."
      />
      {setup ? (
        <>
          <Text style={styles.cardNote}>
            Schools need to know who they are welcoming into the classroom.
            Before you can work through SupplyED, we confirm your identity and
            your right to work in the UK with our partner TrustID.
          </Text>
          <PhoneVerificationCard
            user={form.user}
            editable={!form.user?.phone}
            required
            disabled={busy || !!form.userError}
            onVerified={form.updateUser}
          />
          {form.userError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {form.userError}
            </Text>
          ) : null}
        </>
      ) : null}
      {identity ? (
        <>
          <Text accessibilityLiveRegion="polite" style={styles.recordValue}>
            {identityStateTag(identity.state).label}
          </Text>
          <Text style={styles.cardNote}>{describeIdentityState(identity)}</Text>
          {identityCheckPending(identity.state) ? (
            <Text style={styles.cardNote}>
              You can upload your documents now, and send your profile for
              review once your identity is verified.
            </Text>
          ) : null}
          {setup && !phoneVerified ? (
            <Text style={styles.cardNote}>Verify your phone first.</Text>
          ) : null}
          {setup && canStart && phoneVerified && !liveLink ? (
            <>
              <Text style={styles.cardNote}>
                You'll need your phone camera, your passport or Home Office
                share code, and about five minutes.
              </Text>
              <Checkbox
                checked={consent}
                disabled={busy}
                onChange={setConsent}
                label="I agree to TrustID checking my identity document and a selfie (biometric data) to confirm my identity and right to work."
              />
              <Button
                title="How we use your data"
                variant="link"
                onPress={openPrivacy}
              />
              {privacyError ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {privacyError}
                </Text>
              ) : null}
              <Button
                title="Verify my identity"
                loading={form.starting}
                disabled={busy || !consent}
                onPress={() => form.start(consent)}
              />
            </>
          ) : null}
          {!setup && identity.canStart && onVerify ? (
            <Button title="Verify my identity" onPress={onVerify} />
          ) : null}
          {liveLink && (!setup || phoneVerified) ? (
            <>
              <Text style={styles.cardNote}>
                TrustID opens in your browser. Photograph your passport (or
                enter your share code) and take a selfie. Return to SupplyED
                when you're done; we'll update your status when the check is
                complete.
              </Text>
              <Button
                title={setup ? 'Continue with TrustID' : 'Open TrustID'}
                loading={form.opening}
                onPress={form.openTrustId}
              />
              <Text style={styles.cardNote}>
                The link works once. This page updates when TrustID has your
                results.
              </Text>
            </>
          ) : null}
          {verification?.status === 'SUBMITTED' ||
          verification?.status === 'RESULTS_READY' ? (
            <Text style={styles.cardNote}>Waiting for TrustID</Text>
          ) : null}
          {!setup && !identity.canStart && !liveLink && onVerify ? (
            <Button
              title="View identity check"
              variant="outline"
              onPress={onVerify}
            />
          ) : null}
          {setup && !identityStepRequired(identity) && onContinue ? (
            <Button
              title="Continue"
              onPress={onContinue}
              disabled={form.starting}
            />
          ) : null}
        </>
      ) : form.loading ? (
        <ActivityIndicator accessibilityLabel="Checking your identity verification" />
      ) : null}
      {form.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {form.error}
        </Text>
      ) : null}
      <Button
        title="Refresh verification status"
        variant="outline"
        onPress={form.refresh}
        disabled={busy}
      />
      {showDbs ? (
        <>
          <Text style={styles.recordLabel}>DBS CHECK</Text>
          <Text accessibilityLiveRegion="polite" style={styles.cardNote}>
            {form.dbsLoaded
              ? describeDbsCheck(form.dbs)
              : form.loading
              ? 'Checking your DBS status...'
              : 'Your DBS status is unavailable.'}
          </Text>
          {form.dbsError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {form.dbsError}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
