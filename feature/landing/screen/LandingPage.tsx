import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import WaitlistForm from '../../../components/landing/WaitlistForm';
import { useWaitlistStyles as useStyles } from '../../../components/landing/waitlistStyles';
import Button from '../../../components/Ui/Button';
import { useWaitlist } from '../hooks/useWaitlist';
import { WaitlistType } from '../apis/waitlistApi';

type Props = { onLogin: () => void; onRegister: () => void };
const steps = [
  [
    'Sign up and get verified',
    'Schools register. Teachers complete checks once.',
  ],
  ['Post or pick up cover', 'Only fully checked teachers see bookings.'],
  ["Confirm and you're done", 'Checks on file, payment handled in the app.'],
];
const questions = [
  [
    'What happens after I join?',
    "We'll offer first-cohort places ahead of the pilot. Checks and onboarding only start if you decide to sign up.",
  ],
  [
    'When does SupplyEd launch?',
    'The pilot starts in January 2027, with wider access for local schools from September 2027.',
  ],
  ['Which areas do you cover?', 'Greater Manchester and Lancashire at launch.'],
  [
    'Do I need a DBS already?',
    'No, not to join the waitlist. First-cohort teachers have their Enhanced DBS and checks paid for at sign-up.',
  ],
];

export default function LandingPage({ onLogin, onRegister }: Props) {
  const styles = useStyles();

  const [type, setType] = useState<WaitlistType>('SCHOOL');
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);
  const school = useWaitlist('SCHOOL');
  const teacher = useWaitlist('TEACHER');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const busy = school.busy || teacher.busy;
  function join(next: WaitlistType) {
    if (busy) return;
    setType(next);
    setWaitlistOpen(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.welcomeHeader}>
        <Text style={styles.logo}>
          Supply<Text style={styles.logoAccent}>ED</Text>
        </Text>
      </View>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
        >
          <View style={styles.section}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Greater Manchester and Lancashire
              </Text>
            </View>
            <Text accessibilityRole="header" style={styles.heroTitle}>
              Your next great teaching day.
            </Text>
            <Text style={styles.body}>
              Find teaching work or connect your school with the right teacher.
              Manage jobs, invitations and bookings in one place.
            </Text>
          </View>
          <View style={styles.welcomeActions}>
            <Button title="Create an account" onPress={onRegister} />
            <Button title="Log in" variant="outline" onPress={onLogin} />
            <Button
              title="Join the waitlist"
              variant="link"
              onPress={() => join(type)}
            />
          </View>
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.title}>
              Built for both sides of a booking
            </Text>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>FOR SCHOOLS</Text>
              <Text style={styles.subtitle}>
                Stop chasing paperwork for every cover day
              </Text>
              <Text style={styles.body}>
                Every teacher checked before they can accept a booking.
              </Text>
              <Text style={styles.body}>
                Book directly, with one clear processing fee.
              </Text>
              <Text style={styles.body}>
                Single Central Record evidence ready to export.
              </Text>
              <Button
                title="Join as a school"
                variant="outline"
                onPress={() => join('SCHOOL')}
                disabled={busy}
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>FOR TEACHERS</Text>
              <Text style={styles.subtitle}>
                Do your checks once, then choose your days
              </Text>
              <Text style={styles.body}>
                First cohort: Enhanced DBS and checks paid for when you sign up.
              </Text>
              <Text style={styles.body}>
                Pick the schools and days that suit you.
              </Text>
              <Text style={styles.body}>
                Paid by the school directly through the platform.
              </Text>
              <Button
                title="Join as a teacher"
                variant="outline"
                onPress={() => join('TEACHER')}
                disabled={busy}
              />
            </View>
          </View>
          <View style={[styles.section, styles.soft]}>
            <Text accessibilityRole="header" style={styles.title}>
              How it works
            </Text>
            <Text style={styles.body}>
              The waitlist is just a show of interest. These steps start when
              you sign up with the first cohort.
            </Text>
            {steps.map(([title, body], index) => (
              <View key={title} style={styles.step}>
                <Text style={styles.label}>0{index + 1}</Text>
                <View style={styles.stepCopy}>
                  <Text style={styles.subtitle}>{title}</Text>
                  <Text style={styles.body}>{body}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={[styles.section, styles.founding]}>
            <Text
              accessibilityRole="header"
              style={[styles.title, styles.white]}
            >
              Be one of the first in
            </Text>
            <View style={[styles.card, styles.foundingCard]}>
              <Text style={[styles.subtitle, styles.white]}>
                Founding Schools Programme
              </Text>
              <Text style={[styles.body, styles.pale]}>
                20 places. Pilot runs January to July 2027. Waitlist members
                hear about founding places first.
              </Text>
            </View>
            <View style={[styles.card, styles.foundingCard]}>
              <Text style={[styles.subtitle, styles.white]}>
                Founding Teachers Programme
              </Text>
              <Text style={[styles.body, styles.pale]}>
                Sign up with the first cohort and SupplyEd pays for your
                Enhanced DBS and compliance checks.
              </Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.title}>
              Questions
            </Text>
            {questions.map(([question, answer], index) => (
              <View key={question} style={styles.fields}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: openQuestion === index }}
                  onPress={() =>
                    setOpenQuestion(openQuestion === index ? null : index)
                  }
                  style={styles.step}
                >
                  <Text style={[styles.label, styles.stepCopy]}>
                    {question}
                  </Text>
                  <Text style={styles.label}>
                    {openQuestion === index ? '−' : '+'}
                  </Text>
                </Pressable>
                {openQuestion === index ? (
                  <Text style={styles.body}>{answer}</Text>
                ) : null}
              </View>
            ))}
            <Button
              title="I'm a school"
              onPress={() => join('SCHOOL')}
              disabled={busy}
            />
            <Button
              title="I'm a teacher"
              variant="outline"
              onPress={() => join('TEACHER')}
              disabled={busy}
            />
            <Text style={styles.small}>
              © 2026 SupplyEd · Blackburn, Lancashire
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={waitlistOpen}
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setWaitlistOpen(false);
        }}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.safe}>
            <View style={styles.welcomeHeader}>
              <Button
                title="Back to welcome"
                variant="link"
                onPress={() => setWaitlistOpen(false)}
                disabled={busy}
              />
            </View>
            <KeyboardAvoidingView
              style={styles.safe}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.card, styles.formCard]}>
                  <Text accessibilityRole="header" style={styles.title}>
                    Join the waitlist
                  </Text>
                  <Text style={styles.body}>
                    No checks, no commitment. We'll offer first-cohort places
                    ahead of the pilot.
                  </Text>
                  <View style={styles.tabs}>
                    {(['SCHOOL', 'TEACHER'] as const).map(role => (
                      <Pressable
                        key={role}
                        accessibilityRole="tab"
                        accessibilityLabel={
                          role === 'SCHOOL'
                            ? 'School waitlist'
                            : 'Teacher waitlist'
                        }
                        accessibilityState={{
                          selected: type === role,
                          disabled: busy,
                        }}
                        disabled={busy}
                        style={[styles.tab, type === role && styles.activeTab]}
                        onPress={() => setType(role)}
                      >
                        <Text style={styles.tabText}>
                          {role === 'SCHOOL' ? 'School' : 'Teacher'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <WaitlistForm
                    type={type}
                    form={type === 'SCHOOL' ? school : teacher}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
}
