const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const project = path.resolve(__dirname, '..');
const supplyEdRoot = path.resolve(project, '..', '..');
const backend = path.join(supplyEdRoot, 'supplyed-backend');
const web = path.join(supplyEdRoot, 'supplyed-web');
const referencesAvailable = fs.existsSync(backend) && fs.existsSync(web);

function quotedValues(source) {
  return [...source.matchAll(/['"]([^'"]+)['"]/g)].map(match => match[1]);
}

test(
  'native dropdown names match the live web union and backend seed catalogue',
  { skip: !referencesAvailable },
  () => {
    const nativeSource = fs.readFileSync(
      path.join(project, 'feature', 'dropdowns', 'apis', 'dropdownsApi.ts'),
      'utf8',
    );
    const nativeBlock = nativeSource.match(
      /DROPDOWN_NAMES\s*=\s*\[([\s\S]*?)\]\s*as const/,
    );
    assert.ok(nativeBlock, 'Native dropdown catalogue is missing');
    const nativeNames = quotedValues(nativeBlock[1]).sort();

    const webSource = fs.readFileSync(
      path.join(web, 'features', 'dropdowns', 'types.ts'),
      'utf8',
    );
    const webBlock = webSource.match(
      /export type DropdownName\s*=([\s\S]*?);/,
    );
    assert.ok(webBlock, 'Web dropdown union is missing');
    const webNames = quotedValues(webBlock[1]).sort();

    const seedSource = fs.readFileSync(
      path.join(
        backend,
        'src',
        'modules',
        'dropdowns',
        'dropdown-seed.data.ts',
      ),
      'utf8',
    );
    const seededNames = new Set([
      ...[...seedSource.matchAll(/(?:dataset|fixed)\(\s*['"]([^'"]+)/g)].map(
        match => match[1],
      ),
      ...[...seedSource.matchAll(/\bname:\s*['"]([^'"]+)/g)].map(
        match => match[1],
      ),
    ]);

    assert.deepEqual(nativeNames, webNames);
    assert.deepEqual([...seededNames].sort(), webNames);
  },
);

test(
  'backend exposes the native job and conversation context routes',
  { skip: !referencesAvailable },
  () => {
    const jobsController = fs.readFileSync(
      path.join(backend, 'src', 'modules', 'jobs', 'jobs.controller.ts'),
      'utf8',
    );
    const conversationsController = fs.readFileSync(
      path.join(
        backend,
        'src',
        'modules',
        'conversations',
        'conversations.controller.ts',
      ),
      'utf8',
    );

    assert.match(jobsController, /@Get\(['"]accessible\/:id['"]\)/);
    assert.match(conversationsController, /@Get\(['"]:id\/threads['"]\)/);
    assert.match(
      conversationsController,
      /@Get\(['"]booking\/:bookingId['"]\)/,
    );
  },
);

test(
  'native and web theme derivation stay byte-for-byte equivalent',
  { skip: !referencesAvailable },
  () => {
    const nativeTheme = fs.readFileSync(
      path.join(project, 'utils', 'ui', 'themeColors.ts'),
      'utf8',
    );
    const webTheme = fs.readFileSync(
      path.join(web, 'lib', 'theme.ts'),
      'utf8',
    );
    const functionPattern =
      /export function deriveBrandTheme\(accent: string\) \{([\s\S]*?)\n\}/;
    assert.equal(
      nativeTheme.match(functionPattern)?.[1].replace(/\s+/g, ' ').trim(),
      webTheme.match(functionPattern)?.[1].replace(/\s+/g, ' ').trim(),
    );
  },
);
