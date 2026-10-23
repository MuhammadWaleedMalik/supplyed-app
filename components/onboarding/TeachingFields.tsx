/* eslint-disable no-control-regex -- Reject invisible control characters in user input. */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useDropdown } from '../../feature/dropdowns/hooks/useDropdown';
import {
  knownChoice,
  supportedSkills,
  teachingChoiceKey,
} from '../../utils/onboarding/teachingChoices';
import { readChoices, writeChoices } from '../../utils/ui/choices';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import { useCommonStyles } from '../Ui/theme';

type Props = {
  subjects: string;
  skills?: string;
  onSubjects: (value: string) => void;
  onSkills?: (value: string) => void;
  label?: string;
};

export default function TeachingFields({
  subjects,
  skills,
  onSubjects,
  onSkills,
  label = 'Subjects',
}: Props) {
  const subjectMenu = useDropdown('subject');
  const skillMenu = useDropdown('skill');
  const common = useCommonStyles();
  const [subjectName, setSubjectName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [notice, setNotice] = useState('');
  const subjectValues = readChoices(subjects);
  const skillValues = readChoices(skills || '');
  const allowedSkills = supportedSkills(
    subjectValues,
    subjectMenu.options,
    skillMenu.options,
  );

  function changeSubjects(value: string) {
    onSubjects(value);
    // Only an explicit subject edit removes unsupported named skills.
    if (onSkills && skillMenu.data && subjectMenu.data) {
      const allowed = supportedSkills(
        readChoices(value),
        subjectMenu.options,
        skillMenu.options,
      );
      const kept = skillValues.filter(
        skill =>
          !knownChoice(skill, skillMenu.options) ||
          allowed.some(
            option =>
              option.value === knownChoice(skill, skillMenu.options)?.value,
          ),
      );
      if (kept.length !== skillValues.length) {
        onSkills(writeChoices(kept));
        setNotice('Skills that no longer match your subjects were removed.');
      }
    }
  }

  function addName(kind: 'subject' | 'skill') {
    const name = (kind === 'subject' ? subjectName : skillName)
      .trim()
      .replace(/\s+/g, ' ');
    if (
      !name ||
      name === 'Other' ||
      name.length > 100 ||
      !/[\p{L}\p{N}]/u.test(name) ||
      /[\u0000-\u001f\u007f]/.test(name)
    ) {
      setNotice('Enter a name with letters or numbers, up to 100 characters.');
      return;
    }
    const options =
      kind === 'subject' ? subjectMenu.options : skillMenu.options;
    const known = knownChoice(name, options);
    if (known?.value === 'Other') {
      setNotice('Enter the actual subject or skill name.');
      return;
    }
    if (
      kind === 'skill' &&
      known &&
      !allowedSkills.some(option => option.value === known.value)
    ) {
      setNotice('Choose the matching subject before adding this skill.');
      return;
    }
    const values = kind === 'subject' ? subjectValues : skillValues;
    if (values.length >= 50) {
      setNotice('Choose at most 50 items.');
      return;
    }
    const next = [...values, known?.value || name].filter(
      (value, index, all) =>
        all.findIndex(
          item => teachingChoiceKey(item) === teachingChoiceKey(value),
        ) === index,
    );
    if (kind === 'subject') {
      changeSubjects(writeChoices(next));
      setSubjectName('');
    } else {
      onSkills?.(writeChoices(next));
      setSkillName('');
    }
    setNotice(
      known ? 'Added the matching catalogue choice.' : 'Custom name added.',
    );
  }

  function customOptions(
    values: string[],
    options: typeof subjectMenu.options,
  ) {
    return values
      .filter(value => !knownChoice(value, options))
      .map(value => ({ value, label: value + ' (custom / saved)' }));
  }
  return (
    <View style={common.column}>
      <Select
        label={label}
        value={writeChoices(
          subjectValues.map(
            value => knownChoice(value, subjectMenu.options)?.value || value,
          ),
        )}
        multiple
        maxSelections={50}
        placeholder="Choose subjects"
        disabled={!subjectMenu.data || !!subjectMenu.error}
        options={[
          ...subjectMenu.options.filter(option => option.value !== 'Other'),
          ...customOptions(subjectValues, subjectMenu.options),
        ]}
        onChange={changeSubjects}
      />
      {subjectMenu.data?.expandable ? (
        <>
          <Input
            label="Other subject"
            value={subjectName}
            onChangeText={setSubjectName}
            required={false}
            placeholder="Type a custom subject, then tap Add"
          />
          <Button
            title="Add subject"
            onPress={() => addName('subject')}
            disabled={!subjectMenu.data || !!subjectMenu.error}
            variant="link"
          />
        </>
      ) : null}
      {onSkills ? (
        <>
          <Select
            label="Skills"
            value={writeChoices(
              skillValues.map(
                value => knownChoice(value, skillMenu.options)?.value || value,
              ),
            )}
            multiple
            maxSelections={50}
            placeholder="Choose skills"
            disabled={
              !skillMenu.data ||
              !subjectMenu.data ||
              !!skillMenu.error ||
              !!subjectMenu.error
            }
            options={[
              ...allowedSkills.filter(option => option.value !== 'Other'),
              ...customOptions(skillValues, skillMenu.options),
            ]}
            onChange={onSkills}
          />
          {skillMenu.data?.expandable ? (
            <>
              <Input
                label="Other skill"
                value={skillName}
                onChangeText={setSkillName}
                required={false}
                placeholder="Type a custom skill, then tap Add"
              />
              <Button
                title="Add skill"
                onPress={() => addName('skill')}
                variant="link"
                disabled={!skillMenu.data || !!skillMenu.error}
              />
            </>
          ) : null}
        </>
      ) : null}
      {subjectMenu.loading || (onSkills && skillMenu.loading) ? (
        <Text style={common.body}>Loading teaching choices…</Text>
      ) : null}
      {subjectMenu.error || (onSkills && skillMenu.error) ? (
        <>
          <Text accessibilityRole="alert" style={common.body}>
            {subjectMenu.error || skillMenu.error}
          </Text>
          <Button
            title="Retry teaching choices"
            onPress={() => {
              subjectMenu.retry();
              skillMenu.retry();
            }}
          />
        </>
      ) : null}
      {notice ? (
        <Text accessibilityLiveRegion="polite" style={common.body}>
          {notice}
        </Text>
      ) : null}
      {subjectName || skillName ? (
        <Text style={common.body}>
          Tap Add to include the name before saving.
        </Text>
      ) : null}
    </View>
  );
}
