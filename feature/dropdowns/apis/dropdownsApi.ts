import { apiRequest, ApiError } from '../../../utils/api/request';
import {
  onDropdownRefresh,
  refreshDropdowns,
} from '../../../utils/api/dropdownEvents';

export const DROPDOWN_NAMES = [
  'subject',
  'skill',
  'keyStage',
  'country',
  'city',
  'region',
  'currency',
  'institutionType',
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

// All callers share each public collection, including the large city list.
const cache = new Map<string, { data: Dropdown; time: number }>();
const requests = new Map<string, Promise<Dropdown>>();
onDropdownRefresh(() => cache.clear());

export function getDropdown(
  name: DropdownName,
  fresh = false,
): Promise<Dropdown> {
  for (const [key, entry] of cache) {
    if (Date.now() - entry.time > 300000) cache.delete(key);
  }
  const saved = cache.get(name);
  if (!fresh && saved && Date.now() - saved.time < 30000)
    return Promise.resolve(saved.data);
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
      cache.set(name, { data, time: Date.now() });
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
