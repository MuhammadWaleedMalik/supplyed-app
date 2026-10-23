const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const root = path.resolve(__dirname, '..');
const envFile = path.join(root, '.env');
const envText = fs.existsSync(envFile)
  ? fs.readFileSync(envFile, 'utf8').replace(/^\uFEFF/, '')
  : '';
const values = envText ? parseEnv(envText) : {};

function apiUrl(name, fallback) {
  // A checkout's explicit .env is the local source of truth. Environment
  // variables remain available to CI and clean checkouts without that file.
  const value = (values[name] || process.env[name] || fallback).trim();
  const url = new URL(value);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      `${name} must be an HTTP(S) API URL without credentials, query, or fragment.`,
    );
  if (process.argv.includes('--release') && url.protocol !== 'https:')
    throw new Error(`${name} must use HTTPS for a release build.`);
  return url.toString().replace(/\/+$/, '');
}

const android = apiUrl('API_BASE_URL_ANDROID', 'http://10.0.2.2:3003/api');
const ios = apiUrl('API_BASE_URL_IOS', 'http://localhost:3003/api');
function googleClientId(name) {
  const value = (values[name] || process.env[name] || '').trim();
  if (value && !/^[a-zA-Z0-9.-]+\.apps\.googleusercontent\.com$/.test(value))
    throw new Error(`${name} must be a Google OAuth client ID, not a secret.`);
  return value;
}
const googleWeb = googleClientId('GOOGLE_WEB_CLIENT_ID');
const googleIos = googleClientId('GOOGLE_IOS_CLIENT_ID');
const content =
  `export const ANDROID_API_URL = ${JSON.stringify(android)};\n` +
  `export const IOS_API_URL = ${JSON.stringify(ios)};\n` +
  `export const GOOGLE_WEB_CLIENT_ID = ${JSON.stringify(googleWeb)};\n` +
  `export const GOOGLE_IOS_CLIENT_ID = ${JSON.stringify(googleIos)};\n`;

fs.writeFileSync(path.join(root, 'constants/env.ts'), content);

const plistPath = path.join(root, 'ios/supplyed/Info.plist');
const plist = fs.readFileSync(plistPath, 'utf8');
const scheme = googleIos.split('.').reverse().join('.');
const googleUrl = googleIos
  ? `\n\t\t<dict><key>CFBundleURLSchemes</key><array><string>${scheme}</string></array></dict>\n\t\t`
  : '\n\t\t';
fs.writeFileSync(
  plistPath,
  plist.replace(
    /<!-- GOOGLE_URL_SCHEME_START -->[\s\S]*?<!-- GOOGLE_URL_SCHEME_END -->/,
    '<!-- GOOGLE_URL_SCHEME_START -->' +
      googleUrl +
      '<!-- GOOGLE_URL_SCHEME_END -->',
  ),
);
