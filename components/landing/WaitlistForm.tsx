import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Button from '../Ui/Button';
import Checkbox from '../Ui/Checkbox';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import * as options from '../../constants/waitlistOptions';
import { WaitlistType } from '../../feature/landing/apis/waitlistApi';
import { useWaitlist } from '../../feature/landing/hooks/useWaitlist';
import { WaitlistFormData } from '../../utils/landing/waitlistValidation';
import { useWaitlistStyles as useStyles } from './waitlistStyles';

type Props = { type: WaitlistType; form: ReturnType<typeof useWaitlist> };

export default function WaitlistForm({ type, form }: Props) {
  const styles = useStyles();

  const school = type === 'SCHOOL';
  function input(
    key: keyof WaitlistFormData,
    label: string,
    maxLength: number,
    optional = false,
  ) {
    return (
      <Input
        label={label}
        value={String(form.data[key])}
        maxLength={maxLength}
        required={!optional}
        email={key === 'email'}
        phone={key === 'phone'}
        disabled={form.busy}
        onChangeText={value => form.update(key, value)}
        error={form.errors[key]}
      />
    );
  }
  function select(
    key: keyof WaitlistFormData,
    label: string,
    values: string[],
  ) {
    return (
      <Select
        label={label}
        placeholder="Choose an option"
        value={String(form.data[key])}
        options={values}
        required
        onChange={value => form.update(key, value)}
        error={form.errors[key]}
      />
    );
  }

  if (form.result) {
    return (
      <View style={styles.fields} accessibilityLiveRegion="polite">
        <Text style={styles.success}>
          {form.result.alreadyRegistered
            ? "You're already on the list"
            : "You're on the list"}
          {school ? '!' : `, ${form.data.firstName.trim()}!`}
        </Text>
        <Text style={styles.body}>
          {form.result.confirmationEmailSent
            ? `Confirmation sent to ${form.data.email.trim()}. Nothing else to do for now.`
            : form.result.alreadyRegistered
            ? 'We already have your interest registered. There is no need to sign up again.'
            : 'Your interest is registered. A confirmation email could not be sent, but your place on the waitlist is saved.'}
        </Text>
        <Text style={styles.subtitle}>What happens next</Text>
        <Text style={styles.body}>
          1. You're registered. No checks, no commitment.
        </Text>
        <Text style={styles.body}>
          2. We'll email you about the first cohort ahead of the pilot.
        </Text>
        <Text style={styles.body}>
          {school
            ? '3. Decide whether to join when your invitation arrives.'
            : '3. If you sign up with the first cohort, SupplyEd pays for your Enhanced DBS and checks.'}
        </Text>
        {!school && form.result.detailsToken && !form.detailsSaved ? (
          <View
            style={styles.fields}
            pointerEvents={form.busy ? 'none' : 'auto'}
          >
            <Text style={styles.subtitle}>Tell us a bit more (optional)</Text>
            <Text style={styles.body}>
              Help us bring the right schools on first.
            </Text>
            <Text style={styles.label}>Phases you teach</Text>
            {options.teachingPhases.map(phase => (
              <Checkbox
                key={phase}
                label={phase}
                checked={form.details.phases.includes(phase)}
                onChange={checked =>
                  form.setDetails(previous => ({
                    ...previous,
                    phases: checked
                      ? [...previous.phases, phase]
                      : previous.phases.filter(item => item !== phase),
                  }))
                }
              />
            ))}
            <Input
              label="Main subject (secondary)"
              required={false}
              maxLength={100}
              value={form.details.mainSubject}
              onChangeText={mainSubject =>
                form.setDetails(previous => ({ ...previous, mainSubject }))
              }
            />
            <Input
              label="Postcode area"
              required={false}
              maxLength={20}
              placeholder="e.g. M1 or M1 1AA"
              value={form.details.postcode}
              onChangeText={postcode =>
                form.setDetails(previous => ({ ...previous, postcode }))
              }
            />
            <Button
              title={form.busy ? 'Saving...' : 'Save these details'}
              disabled={form.busy}
              onPress={form.saveDetails}
            />
          </View>
        ) : null}
        {form.detailsSaved ? (
          <Text style={styles.success}>
            Your teaching details are saved. Thank you!
          </Text>
        ) : null}
        {form.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {form.error}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.fields}>
      <View style={styles.fields} pointerEvents={form.busy ? 'none' : 'auto'}>
        {school ? (
          <>
            {input('organizationName', 'School name', 160)}
            {input('name', 'Your name', 120)}
          </>
        ) : (
          <>
            {input('firstName', 'First name', 60)}
            {input('lastName', 'Last name', 60)}
          </>
        )}
        {input('email', school ? 'Work email' : 'Email', 254)}
        {!school ? input('phone', 'Mobile number (optional)', 32, true) : null}
        {select(
          'role',
          school ? 'Your role' : 'I work as a',
          school ? options.schoolRoles : options.teacherRoles,
        )}
        {select(
          'area',
          school ? 'Area' : "Where you'll work",
          school ? options.schoolAreas : options.teacherAreas,
        )}
        {school ? (
          <>
            {select('schoolType', 'School type', options.schoolTypes)}
            {select(
              'supplyDaysPerTerm',
              'Supply days per term (roughly)',
              options.supplyDays,
            )}
            {select(
              'coverBookingMethod',
              'How you book cover now',
              options.bookingMethods,
            )}
            <Checkbox
              label="Tell me about the Founding Schools Programme (20 places)"
              checked={form.data.foundingProgrammeInterest}
              onChange={value =>
                form.update('foundingProgrammeInterest', value)
              }
            />
          </>
        ) : (
          <>
            {select(
              'currentSupply',
              'Are you doing supply now?',
              options.currentSupplyOptions,
            )}
            <Text style={styles.label}>Days a week you'd want *</Text>
            <View style={styles.choices}>
              {options.daysPerWeekOptions.map(day => (
                <Pressable
                  key={day}
                  accessibilityRole="radio"
                  accessibilityLabel={day}
                  accessibilityState={{
                    checked: form.data.daysPerWeek === day,
                  }}
                  onPress={() => form.update('daysPerWeek', day)}
                  style={[
                    styles.choice,
                    form.data.daysPerWeek === day && styles.selectedChoice,
                  ]}
                >
                  <Text style={styles.label}>{day}</Text>
                </Pressable>
              ))}
            </View>
            {form.errors.daysPerWeek ? (
              <Text style={styles.error}>{form.errors.daysPerWeek}</Text>
            ) : null}
            <Checkbox
              label="Email me about the first cohort and launch. Unsubscribe any time."
              checked={form.data.emailConsent}
              onChange={value => form.update('emailConsent', value)}
            />
            {form.errors.emailConsent ? (
              <Text style={styles.error}>{form.errors.emailConsent}</Text>
            ) : null}
          </>
        )}
      </View>
      {Object.values(form.errors).some(Boolean) ? (
        <Text accessibilityRole="alert" style={styles.error}>
          Please check the highlighted fields above.
        </Text>
      ) : null}
      {form.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {form.error}
        </Text>
      ) : null}
      <Button
        title={
          form.busy
            ? 'Joining...'
            : school
            ? 'Join the schools waitlist'
            : 'Join the teacher waitlist'
        }
        disabled={form.busy}
        onPress={form.submit}
      />
      <Text style={styles.small}>
        Launch updates only. Joining the waitlist does not create an account or
        start compliance checks.
      </Text>
    </View>
  );
}
