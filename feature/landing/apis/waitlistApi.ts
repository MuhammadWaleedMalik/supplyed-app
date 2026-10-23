import { normalizeUkPhone } from '../../../utils/auth/ukPhone';
import { checkDropdown } from '../../dropdowns/apis/dropdownsApi';
import { endpoints } from '../../../constants/endpoints';
import { apiRequest } from '../../../utils/api/request';

export type WaitlistType = 'SCHOOL' | 'TEACHER';
type CommonInterest = {
  name: string;
  email: string;
  role: string;
  area: string;
  source: string;
};
export type FoundingInterest = CommonInterest &
  (
    | {
        type: 'SCHOOL';
        organizationName: string;
        schoolType: string;
        supplyDaysPerTerm: string;
        coverBookingMethod: string;
        foundingProgrammeInterest: boolean;
      }
    | {
        type: 'TEACHER';
        firstName: string;
        lastName: string;
        phone?: string;
        currentSupply: string;
        daysPerWeek: string;
        emailConsent: true;
      }
  );
export type WaitlistReply = {
  submitted: boolean;
  id: string;
  alreadyRegistered: boolean;
  confirmationEmailSent: boolean;
  detailsToken?: string;
};

export async function joinWaitlist(payload: FoundingInterest) {
  const school = payload.type === 'SCHOOL';
  await checkDropdown(school ? 'waitlistSchoolRole' : 'waitlistTeacherRole', [
    payload.role,
  ]);
  await checkDropdown(school ? 'waitlistSchoolArea' : 'waitlistTeacherArea', [
    payload.area,
  ]);
  if (payload.type === 'SCHOOL') {
    await checkDropdown('waitlistSchoolType', [payload.schoolType]);
    await checkDropdown('supplyDaysPerTerm', [payload.supplyDaysPerTerm]);
    await checkDropdown('coverBookingMethod', [payload.coverBookingMethod]);
  } else {
    await checkDropdown('currentSupply', [payload.currentSupply]);
    await checkDropdown('daysPerWeek', [payload.daysPerWeek]);
  }
  const reply = await apiRequest<WaitlistReply>(
    endpoints.foundingInterest,
    'POST',
    payload.type === 'TEACHER' && payload.phone
      ? { ...payload, phone: normalizeUkPhone(payload.phone) }
      : payload,
  );
  if (!reply?.submitted || !reply.id)
    throw new Error(
      'Your registration could not be confirmed. Please try again.',
    );
  return reply;
}

export async function saveWaitlistDetails(
  id: string,
  token: string,
  details: {
    phases: string[];
    mainSubject: string;
    postcode: string;
  },
) {
  await checkDropdown('waitlistPhase', details.phases);
  const reply = await apiRequest<{ saved: boolean }>(
    endpoints.waitlistDetails(id),
    'PATCH',
    {
      token,
      phases: details.phases,
      mainSubject: details.mainSubject.trim() || undefined,
      postcode: details.postcode.trim().toUpperCase() || undefined,
    },
  );
  if (!reply?.saved)
    throw new Error('Your details could not be saved. Please try again.');
}
