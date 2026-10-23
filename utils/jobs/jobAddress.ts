export type JobAddress = {
  address: string;
  city: string;
  county: string;
  postalCode: string;
  countryCode: string;
};

function normalized(value: string | null | undefined) {
  return (value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-GB');
}

export function hasSchoolAddress(value?: Partial<JobAddress> | null) {
  return Boolean(normalized(value?.address) && normalized(value?.city));
}

export function sameJobAddress(
  left?: Partial<JobAddress> | null,
  right?: Partial<JobAddress> | null,
) {
  if (!hasSchoolAddress(left) || !hasSchoolAddress(right)) return false;
  return (['address', 'city', 'county', 'postalCode', 'countryCode'] as const).every(
    field => normalized(left?.[field]) === normalized(right?.[field]),
  );
}

export function jobAddress(value?: Partial<JobAddress> | null): JobAddress {
  return {
    address: value?.address?.trim() || '',
    city: value?.city?.trim() || '',
    county: value?.county?.trim() || '',
    postalCode: value?.postalCode?.trim().toUpperCase() || '',
    countryCode: value?.countryCode?.trim().toUpperCase() || 'GB',
  };
}
