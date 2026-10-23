export function optionalNonNegativeNumber(value: string, label: string) {
  if (!value.trim()) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0)
    throw new Error(`${label} must be a non-negative number.`);
  return number;
}

export function optionalNonNegativeInteger(value: string, label: string) {
  const number = optionalNonNegativeNumber(value, label);
  if (number !== undefined && !Number.isSafeInteger(number))
    throw new Error(`${label} must be a non-negative whole number.`);
  return number;
}
