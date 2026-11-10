/* eslint-disable no-control-regex -- Reject invisible control characters in user input. */
import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { onDropdownRefresh } from '../../utils/api/dropdownEvents';
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
import {
  getSchoolTeachingCatalogue,
  getTeachingCatalogue,
  TeachingCatalogue,
} from '../../feature/dropdowns/apis/teachingCatalogueApi';

type Props = {
  subjects: string;
  skills?: string;
  onSubjects: (value: string) => void;
  onSkills?: (value: string) => void;
  label?: string;
  schoolType?: string;
  schoolScoped?: boolean;
};

export default function TeachingFields({
  subjects,
  skills,
  onSubjects,
  onSkills,
  label = 'Subjects',
  schoolType,
  schoolScoped,
}: Props) {
  const subjectMenu = useDropdown('subject');
  const skillMenu = useDropdown('skill');
  const common = useCommonStyles();
  const [subjectName, setSubjectName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [notice, setNotice] = useState('');
  const [showOtherSubject, setShowOtherSubject] = useState(false);
  const [showOtherSkill, setShowOtherSkill] = useState(false);
  const [catalogueResult, setCatalogueResult] = useState<{ scope: string; data: TeachingCatalogue }>();
  const catalogueScope = schoolScoped ? 'school' : schoolType || '';
  const catalogue = catalogueResult?.scope === catalogueScope ? catalogueResult.data : undefined;
  const [catalogueError, setCatalogueError] = useState('');
  const [catalogueAttempt, setCatalogueAttempt] = useState(0);
  const subjectValues = readChoices(subjects);
  const skillValues = readChoices(skills || '');
  useEffect(() => {
    if (!schoolScoped && !schoolType) {
      setCatalogueResult(undefined);
      setCatalogueError('');
      return;
    }
    let active = true;
    setCatalogueResult(undefined);
    setCatalogueError('');
    const request = schoolScoped
      ? getSchoolTeachingCatalogue()
      : getTeachingCatalogue(schoolType);
    request
      .then(result => {
        if (active) setCatalogueResult({ scope: catalogueScope, data: result });
      })
      .catch(problem => {
        if (active)
          setCatalogueError(
            problem instanceof Error
              ? problem.message
              : 'Teaching choices are unavailable.',
          );
      });
    return () => {
      active = false;
    };
  }, [schoolScoped, schoolType, catalogueAttempt, catalogueScope]);

  useEffect(() => {
    const refresh = () => setCatalogueAttempt(value => value + 1);
    const unsubscribe = onDropdownRefresh(refresh);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => { unsubscribe(); listener.remove(); };
  }, []);

  const catalogueValues = useMemo(() => {
    const catalogueSubjects =
      catalogue?.categories.flatMap(category => category.subjects) || [];
    return {
      subjects: new Set(
        catalogueSubjects
          .flatMap(subject => [subject.name, ...subject.aliases])
          .map(teachingChoiceKey),
      ),
      skills: new Set(
        [
          ...catalogueSubjects.flatMap(subject => subject.skills),
          ...(catalogue?.sharedSkills || []),
        ].map(teachingChoiceKey),
      ),
    };
  }, [catalogue]);
  const subjectOptions = catalogue
    ? subjectMenu.options.filter(option =>
        catalogueValues.subjects.has(teachingChoiceKey(option.value)),
      )
    : subjectMenu.options;
  const allowedSkills = supportedSkills(
    subjectValues,
    subjectOptions,
    skillMenu.options,
  ).filter(
    option =>
      !catalogue || catalogueValues.skills.has(teachingChoiceKey(option.value)),
  );

  function changeSubjects(value: string) {
    onSubjects(value);
    // Only an explicit subject edit removes unsupported named skills.
    if (onSkills && skillMenu.data && subjectMenu.data) {
      const allowed = supportedSkills(
        readChoices(value),
        subjectOptions,
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
    if (!subjectMenu.data || subjectMenu.error ||
      (kind === 'skill' && (!skillMenu.data || skillMenu.error)) ||
      (catalogueScope && (!catalogue || catalogueError))) return;
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
      kind === 'subject' ? subjectOptions : skillMenu.options;
    const known = knownChoice(name, options);
    if (kind === 'subject' && catalogue && !known && knownChoice(name, subjectMenu.options)) {
      setNotice('This subject is not available for your school phase. Choose a subject from the current catalogue.');
      return;
    }
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
            value => knownChoice(value, subjectOptions)?.value || value,
          ),
        )}
        multiple
        maxSelections={50}
        placeholder="Choose subjects"
        disabled={
          !subjectMenu.data ||
          !!subjectMenu.error ||
          (!!schoolType || !!schoolScoped) && !catalogue
        }
        options={[
          ...subjectOptions.filter(option => option.value !== 'Other'),
          ...customOptions(subjectValues, subjectOptions),
        ]}
        onChange={changeSubjects}
      />
      {subjectMenu.data?.expandable ? (
        <>
          <Button
            title={showOtherSubject ? 'Hide other subject' : 'Add other subject'}
            onPress={() => setShowOtherSubject(value => !value)}
            variant="link"
            compact
          />
          {showOtherSubject ? <>
            <Input
              label="Other subject"
              maxLength={100}
              value={subjectName}
              onChangeText={setSubjectName}
              required={false}
              placeholder="Type a custom subject"
            />
            <Button
              title="Add subject"
              onPress={() => addName('subject')}
              disabled={
                !subjectMenu.data ||
                !!subjectMenu.error ||
                ((!!schoolType || !!schoolScoped) && !catalogue)
              }
              variant="link"
            />
          </> : null}
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
              !!subjectMenu.error ||
              ((!!schoolType || !!schoolScoped) && !catalogue)
            }
            options={[
              ...allowedSkills.filter(option => option.value !== 'Other'),
              ...customOptions(skillValues, skillMenu.options),
            ]}
            onChange={onSkills}
          />
          {skillMenu.data?.expandable ? (
            <>
              <Button
                title={showOtherSkill ? 'Hide other skill' : 'Add other skill'}
                onPress={() => setShowOtherSkill(value => !value)}
                variant="link"
                compact
              />
              {showOtherSkill ? <>
                <Input
                  label="Other skill"
                  maxLength={100}
                  value={skillName}
                  onChangeText={setSkillName}
                  required={false}
                  placeholder="Type a custom skill"
                />
                <Button
                  title="Add skill"
                  onPress={() => addName('skill')}
                  variant="link"
                  disabled={!skillMenu.data || !subjectMenu.data || !!skillMenu.error || !!subjectMenu.error || (!!catalogueScope && (!catalogue || !!catalogueError))}
                />
              </> : null}
            </>
          ) : null}
        </>
      ) : null}
      {subjectMenu.loading || (onSkills && skillMenu.loading) || (!!catalogueScope && !catalogue && !catalogueError) ? (
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
      {catalogueError ? (
        <>
          <Text accessibilityRole="alert" style={common.body}>
            {catalogueError}
          </Text>
          <Button
            title="Retry school teaching catalogue"
            onPress={() => setCatalogueAttempt(value => value + 1)}
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
