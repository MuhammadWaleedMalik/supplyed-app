# Backend dropdown integration audit — 10 November 2026

Source of truth: the backend `DROPDOWN_SEEDS` catalogue and the backend service
`assertSelections` mappings. The backend was inspected read-only.

## Mobile data-entry dropdowns

| Backend dropdown | Mobile placement | Contract handling |
| --- | --- | --- |
| `subject`, `skill` | Teacher onboarding/settings and job role information | Loaded from the runtime teaching catalogue. School job choices are filtered by the school's Primary/Secondary type. Skills are filtered by selected subjects. Custom values are only offered when the backend marks the dataset expandable. |
| `keyStage` | Teacher preferences/settings, job requirements, invitation job details, job/teacher filters | Multi-select for saved profiles/jobs; single-select for filters. Active job review is blocked until at least one key stage is selected. |
| `country`, `city`, `region` | Teacher/school onboarding, profile settings and alternative job address | Mapped to `countryCode`, `city` and `county`. Country is currently the backend's single `GB` option. Region remains optional where the DTO permits it. |
| `currency` | Teacher rates onboarding/settings | Backend currently supplies GBP only. |
| `institutionType`, `schoolType` | School identity onboarding/settings | Organisation structure and school phase remain distinct. School phase controls the teaching catalogue. |
| `coverType` | School staffing onboarding/settings | Multi-select and sent as `coverTypes`. |
| `payType` | Job pay section and invitation terms | Uses backend values `daily`, `hourly`, `fixed`; frequency choices are constrained separately by pay type. |
| `timezone` | Invitation scheduling | Uses the backend timezone dataset; job posting defaults to the school's UK marketplace timezone. |

## Public waitlist dropdowns

`waitlistSchoolRole`, `waitlistSchoolArea`, `waitlistSchoolType`,
`supplyDaysPerTerm`, `coverBookingMethod`, `waitlistTeacherRole`,
`waitlistTeacherArea`, `currentSupply`, `daysPerWeek`, and `waitlistPhase` are
placed only in their corresponding school/teacher waitlist journeys and are
validated again before submission.

## Filter and action dropdowns

| Backend dropdown | Mobile placement |
| --- | --- |
| `discoveryUrgency` | Teacher job discovery filters |
| `teacherRating` | School teacher-directory filters |
| `bookingInvoiceState`, `bookingStatus` | Booking filters |
| `applicationStatus` | Application filters; transitions still use dedicated actions |
| `jobStatus` | Owned-job filters and draft/active save choice, restricted by workflow |
| `jobInvitationStatus` | Invitation-list filter; decisions use dedicated endpoints |
| `invoiceStatus` | Billing-list filter |
| `refundReason` | Authorized invoice refund form |
| `themeAccent` | Appearance settings |

## Intentionally not rendered as ordinary mobile inputs

- `profileStatus`, `foundingInterestStatus`, `documentVerificationStatus`, and
  `signatoryApprovalStatus` are backend/admin state references. Owner changes
  use authorized workflow endpoints, not generic dropdown writes.
- `legacySchoolRole`, `legacySchoolType`, `legacySchoolTier`,
  `legacyTeacherRole`, `legacyTeacherPhase`, and `availability` belong to
  retained legacy public forms, not authenticated mobile profile workflows.
- `proposalFontFamily`, `proposalFontSize`, `proposalTextColor`, and
  `descriptionFontSize` are optional editor presentation datasets. They are not
  shown in the current mobile editor, which exposes bold, italic, underline,
  lists, links and clear formatting. The live recheck below confirms these
  presentation datasets are now available; their absence from the editor is
  a mobile UI choice, not a current backend outage.

## Placement correction

School onboarding now renders County/Region inside the address block beside
City and before Postcode. It is no longer misplaced below staffing needs and
cover types.

## Guardrails

- `DropdownName` is a closed TypeScript union, so a mobile field cannot request
  an unknown dropdown name.
- `reference-parity.test.cjs` verifies the mobile union matches both the web
  union and every backend seed name.
- Submission adapters call `checkDropdown` for persisted profile, job,
  invitation, waitlist, status and refund selections where applicable.
- Dynamic controls only render active backend options and refresh after the app
  returns to the foreground or the API reports a stale selection.

## Live read-only recheck

All 46 dataset routes at `http://192.168.18.34:3003/api/dropdowns/{name}`
returned HTTP 200, active datasets and nonempty active options. Selected
counts: 130 subjects, 840 skills, 3,844 cities, 251 regions, one country,
two school phases. Requests were limited to four in parallel.

The school teaching catalogue now resets when its scope changes and refreshes
on foreground/stale-selection events. Custom entry cannot be used to add a
known subject outside the school's phase. This does not constitute an
authenticated end-to-end test of submitting each form.
