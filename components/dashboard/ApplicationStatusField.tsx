import React from 'react';
import DynamicSelect from '../Ui/DynamicSelect';
export default function ApplicationStatusField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <DynamicSelect
      name="applicationStatus"
      label="Status"
      placeholder="All statuses"
      value={value === 'ALL' ? '' : value}
      onChange={next => onChange(next || 'ALL')}
      allowed={['APPLIED', 'VIEWED', 'SHORTLISTED', 'HIRED', 'REJECTED']}
    />
  );
}
