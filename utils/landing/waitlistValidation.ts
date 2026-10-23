import { normalizeUkPhone } from '../auth/ukPhone';

import {
  FoundingInterest,
  WaitlistType,
} from '../../feature/landing/apis/waitlistApi';

export const emptyWaitlistForm = {
  name: '',
  email: '',
  role: '',
  area: '',
  organizationName: '',
  schoolType: '',
  supplyDaysPerTerm: '',
  coverBookingMethod: '',
  foundingProgrammeInterest: false,
  firstName: '',
  lastName: '',
  phone: '',
  currentSupply: '',
  daysPerWeek: '',
  emailConsent: false,
};
export type WaitlistFormData = typeof emptyWaitlistForm;
export type WaitlistErrors = Partial<Record<keyof WaitlistFormData, string>>;

export function validateWaitlist(
  type: WaitlistType,
  data: WaitlistFormData,
): WaitlistErrors {
  const errors: WaitlistErrors = {};
  function text(field: keyof WaitlistFormData, min: number, max: number) {
    const value = String(data[field]).trim();
    if (value.length < min || value.length > max)
      errors[field] = `Enter between ${min} and ${max} characters.`;
  }
  function choice(field: keyof WaitlistFormData) {
    if (!String(data[field]).trim()) errors[field] = 'Choose an option.';
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) ||
    data.email.trim().length > 254
  )
    errors.email = 'Enter a valid email address.';
  if (type === 'SCHOOL') {
    text('name', 2, 120);
    text('organizationName', 2, 160);
    choice('role');
    choice('area');
    choice('schoolType');
    choice('supplyDaysPerTerm');
    choice('coverBookingMethod');
  } else {
    text('firstName', 1, 60);
    text('lastName', 1, 60);
    if ((data.firstName.trim() + ' ' + data.lastName.trim()).length > 120)
      errors.lastName = 'Your full name must be 120 characters or fewer.';
    choice('role');
    choice('area');
    choice('currentSupply');
    choice('daysPerWeek');
    if (data.phone.trim()) {
      try {
        normalizeUkPhone(data.phone);
      } catch {
        errors.phone = 'Enter a valid UK phone number.';
      }
    }
    if (!data.emailConsent)
      errors.emailConsent =
        'Please agree to receive first-cohort and launch emails.';
  }
  return errors;
}

export function waitlistPayload(
  type: WaitlistType,
  data: WaitlistFormData,
): FoundingInterest {
  const common = {
    email: data.email.trim().toLowerCase(),
    role: data.role,
    area: data.area,
    source: 'mobile-app',
  };
  return type === 'SCHOOL'
    ? {
        ...common,
        type,
        name: data.name.trim(),
        organizationName: data.organizationName.trim(),
        schoolType: data.schoolType,
        supplyDaysPerTerm: data.supplyDaysPerTerm,
        coverBookingMethod: data.coverBookingMethod,
        foundingProgrammeInterest: data.foundingProgrammeInterest,
      }
    : {
        ...common,
        type,
        name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim() || undefined,
        currentSupply: data.currentSupply,
        daysPerWeek: data.daysPerWeek,
        emailConsent: true,
      };
}
