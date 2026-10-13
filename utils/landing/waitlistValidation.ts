import * as options from '../../constants/waitlistOptions';
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
  function choice(field: keyof WaitlistFormData, values: string[]) {
    if (!values.includes(String(data[field])))
      errors[field] = 'Choose an option.';
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) ||
    data.email.trim().length > 254
  )
    errors.email = 'Enter a valid email address.';
  if (type === 'SCHOOL') {
    text('name', 2, 120);
    text('organizationName', 2, 160);
    choice('role', options.schoolRoles);
    choice('area', options.schoolAreas);
    choice('schoolType', options.schoolTypes);
    choice('supplyDaysPerTerm', options.supplyDays);
    choice('coverBookingMethod', options.bookingMethods);
  } else {
    text('firstName', 1, 60);
    text('lastName', 1, 60);
    if ((data.firstName.trim() + ' ' + data.lastName.trim()).length > 120)
      errors.lastName = 'Your full name must be 120 characters or fewer.';
    choice('role', options.teacherRoles);
    choice('area', options.teacherAreas);
    choice('currentSupply', options.currentSupplyOptions);
    choice('daysPerWeek', options.daysPerWeekOptions);
    if (
      data.phone.trim() &&
      (!/^(?=(?:\D*\d){10})[+()\d\s-]+$/.test(data.phone.trim()) ||
        data.phone.trim().length > 32)
    )
      errors.phone = 'Enter a valid mobile number with at least 10 digits.';
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
