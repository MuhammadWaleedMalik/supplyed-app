const listeners = new Set<() => void>();

export function onDropdownRefresh(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function refreshDropdowns(code: string) {
  if (
    [
      'INVALID_DROPDOWN_SELECTION',
      'INVALID_TEACHING_SELECTION',
      'INVALID_OTHER_SUBJECTS',
      'INVALID_OTHER_SKILLS',
      'SKILL_SUBJECT_MISMATCH',
      'CONFLICTING_JOB_SUBJECTS',
    ].includes(code)
  )
    listeners.forEach(listener => listener());
}
