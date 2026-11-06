import { apiRequest, ApiError } from '../../../utils/api/request';
import { refreshDropdowns } from '../../../utils/api/dropdownEvents';

export const DROPDOWN_NAMES = [
  'subject',
  'skill',
  'keyStage',
  'country',
  'city',
  'region',
  'currency',
  'institutionType',
  'schoolType',
  'coverType',
  'payType',
  'timezone',
  'waitlistSchoolRole',
  'waitlistSchoolArea',
  'waitlistSchoolType',
  'supplyDaysPerTerm',
  'coverBookingMethod',
  'waitlistTeacherRole',
  'waitlistTeacherArea',
  'currentSupply',
  'daysPerWeek',
  'waitlistPhase',
  'discoveryUrgency',
  'teacherRating',
  'bookingInvoiceState',
  'refundReason',
  'applicationStatus',
  'jobStatus',
  'jobInvitationStatus',
  'bookingStatus',
  'invoiceStatus',
  'profileStatus',
  'foundingInterestStatus',
  'documentVerificationStatus',
  'signatoryApprovalStatus',
  'proposalFontFamily',
  'proposalFontSize',
  'proposalTextColor',
  'descriptionFontSize',
  'themeAccent',
  'legacySchoolRole',
  'legacySchoolType',
  'legacySchoolTier',
  'legacyTeacherRole',
  'legacyTeacherPhase',
  'availability',
] as const;

export type DropdownName = (typeof DROPDOWN_NAMES)[number];

export type DropdownOption = {
  key: string;
  value: string;
  label: string;
  aliases: string[];
  group: string | null;
  sortOrder: number;
  isActive: boolean;
  isShared: boolean;
  subjectKeys: string[];
};
export type Dropdown = {
  id: string;
  name: string;
  label: string;
  revision: number;
  isActive: boolean;
  updatedAt: string;
  expandable: boolean;
  options: DropdownOption[];
};

// Only coalesce identical requests that are currently in flight. Completed
// responses are not cached, so every later read reflects the backend.
const requests = new Map<string, Promise<Dropdown>>();

export function getDropdown(
  name: DropdownName,
  _fresh = false,
): Promise<Dropdown> {
  const pending = requests.get(name);
  if (pending) return pending;
  const request = apiRequest<Dropdown>('/dropdowns/' + encodeURIComponent(name))
    .catch(error => {
      if (error instanceof ApiError && error.status > 0 && error.status < 500)
        throw error;
      return apiRequest<Dropdown>('/dropdowns/' + encodeURIComponent(name));
    })
    .then(data => {
      if (!data || !Array.isArray(data.options) || !data.isActive)
        throw new Error('These choices are currently unavailable.');
      return data;
    })
    .finally(() => requests.delete(name));
  requests.set(name, request);
  return request;
}

export async function checkDropdown(name: DropdownName, values: string[]) {
  const data = await getDropdown(name, true);
  if (
    values.some(
      value =>
        !data.options.some(option => option.isActive && option.value === value),
    )
  ) {
    refreshDropdowns('INVALID_DROPDOWN_SELECTION');
    throw new Error(
      'Some saved choices are no longer available. Please review ' + name + '.',
    );
  }
}
