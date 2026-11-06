const messages: Record<string, string> = {
  SCHOOL_INACTIVE:
    'Your school must be active and approved to publish, invite or hire. Existing bookings and history remain available.',
  JOB_RESERVED:
    'This job is reserved for an invited teacher. New applications and other hires are unavailable until the invitation is resolved.',
  JOB_TERMS_LOCKED:
    'These terms are locked because this job has applications, invitations or bookings. Create a new job for different terms.',
  JOB_TERMS_CHANGED:
    'The saved offer differs from the job. The teacher must explicitly accept a new invitation.',
  APPLICATION_TERMS_UNVERIFIED:
    'This older application has no recorded offer. Send an invitation so the teacher can accept the terms before hiring.',
  JOB_HISTORY_PROTECTED:
    'This job has history and cannot be deleted. Close it to preserve its records.',
  PHONE_VERIFIED_LOCKED:
    'This number is verified and cannot be edited. Refresh settings to see the saved number.',
  INVALID_DROPDOWN_SELECTION:
    'Some choices have changed. Review the highlighted selections and try again.',
  DROPDOWNS_NOT_SEEDED:
    'Choices are temporarily unavailable. Please try again later.',
  INVALID_TEACHING_SELECTION:
    'Review your subjects and skills, then save again.',
  INVALID_OTHER_SUBJECTS: 'Add a valid custom subject or remove Other.',
  INVALID_OTHER_SKILLS: 'Add a valid custom skill or remove Other.',
  SKILL_SUBJECT_MISMATCH: 'Choose skills supported by your selected subjects.',
  CONFLICTING_JOB_SUBJECTS: 'Review your subject choices and try again.',
  BOOKING_OVERLAP:
    'This teacher is already booked during these dates. Choose different dates or another teacher.',
  INSTRUCTOR_BOOKING_OVERLAP:
    'This teacher is already booked during these dates. Choose different dates or another teacher.',
  INVITATION_TERMS_CHANGED:
    'The offered terms have changed. Ask the school to send a new invitation.',
  STALE_INVITATION:
    'The offered terms have changed. Ask the school to send a new invitation.',
};

export function userFacingError(message: string, status: number, code = '') {
  if (messages[code]) return messages[code];
  if (
    status === 409 &&
    /(?:booking overlap|already booked during|confirmed booking conflict)/i.test(
      message,
    )
  )
    return 'This teacher is already booked during these dates. Choose different dates or another teacher.';
  if (
    status === 409 &&
    /(?:offered terms.*changed|stale consent|job terms.*changed)/i.test(message)
  )
    return 'The offered terms have changed. Ask the school to send a new invitation.';
  if (status >= 500)
    return 'SupplyEd is temporarily unavailable. Please try again shortly.';
  if (status === 429)
    return 'Too many attempts. Wait a moment before trying again.';
  if (status === 401) {
    if (/^Invalid email or password$/i.test(message))
      return 'The email or password is incorrect.';
    if (/^Invalid or expired two-factor authentication code$/i.test(message))
      return 'That authenticator or recovery code was not accepted. Try a current code.';
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 403)
    return 'You cannot perform this action. Refresh to check the latest status.';
  if (status === 404)
    return 'This item is no longer available. Refresh and try again.';
  // Never expose arbitrary server internals, references, markup or stack traces.
  const unsafe =
    /(?:prisma|sql|exception|stack|trace|<\/?[a-z]|node_modules|select\s+.+from|[a-f0-9]{8}-[a-f0-9-]{27,}|token|secret|password=|support reference)/i;
  if (!message || message.length > 350 || unsafe.test(message))
    return status === 409
      ? 'This item has changed. Refresh its details before trying again.'
      : 'Unable to complete this action. Check your entries and try again.';
  return message;
}
