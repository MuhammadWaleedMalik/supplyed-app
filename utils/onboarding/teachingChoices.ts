/* eslint-disable no-control-regex -- Reject invisible control characters in user input. */
import {
  DropdownOption,
  getDropdown,
} from '../../feature/dropdowns/apis/dropdownsApi';
import { readChoices } from '../ui/choices';

// Use the same matching rules as the website and teaching API.
export function teachingChoiceKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function knownChoice(value: string, options: DropdownOption[]) {
  const name = teachingChoiceKey(value);
  return options.find(
    option =>
      teachingChoiceKey(option.value) === name ||
      option.aliases?.some(alias => teachingChoiceKey(alias) === name),
  );
}

export function supportedSkills(
  subjects: string[],
  subjectOptions: DropdownOption[],
  skillOptions: DropdownOption[],
) {
  const keys = subjects
    .map(value => knownChoice(value, subjectOptions)?.key)
    .filter(Boolean);
  return skillOptions.filter(
    option =>
      option.isActive &&
      (option.value === 'Other' ||
        option.isShared ||
        option.subjectKeys?.some(key => keys.includes(key))),
  );
}

function selectionPayload(values: string[], options: DropdownOption[]) {
  const named: string[] = [];
  const custom: string[] = [];
  for (const value of values) {
    const cleaned = value.trim().replace(/\s+/g, ' ');
    const known = knownChoice(cleaned, options);
    if (known && known.isActive && known.value !== 'Other')
      named.push(known.value);
    else {
      if (
        cleaned === 'Other' ||
        cleaned.length > 100 ||
        !/[\p{L}\p{N}]/u.test(cleaned) ||
        /[\u0000-\u001f\u007f]/.test(value)
      )
        throw new Error(
          'Custom names must contain letters or numbers and use 1–100 characters.',
        );
      custom.push(cleaned);
    }
  }
  const uniqueNames = [...new Set(named)];
  const uniqueCustom = custom.filter(
    (value, index) =>
      custom.findIndex(
        item => teachingChoiceKey(item) === teachingChoiceKey(value),
      ) === index,
  );
  if (uniqueNames.length + uniqueCustom.length > 50)
    throw new Error('Choose at most 50 subjects or skills.');
  return {
    values: uniqueCustom.length ? [...uniqueNames, 'Other'] : uniqueNames,
    custom: uniqueCustom,
  };
}

export async function teachingPayload(subjectText: string, skillText?: string) {
  const subjects = await getDropdown('subject');
  const subject = selectionPayload(readChoices(subjectText), subjects.options);
  if (skillText === undefined)
    return { subjects: subject.values, otherSubjects: subject.custom };
  const skills = await getDropdown('skill');
  const skill = selectionPayload(readChoices(skillText), skills.options);
  const allowed = supportedSkills(
    subject.values,
    subjects.options,
    skills.options,
  );
  if (
    skill.values.some(
      value =>
        value !== 'Other' && !allowed.some(option => option.value === value),
    )
  )
    throw new Error(
      'Review your skills. Each named skill must match a selected subject or be a shared skill.',
    );
  return {
    subjects: subject.values,
    otherSubjects: subject.custom,
    skills: skill.values,
    otherSkills: skill.custom,
  };
}
