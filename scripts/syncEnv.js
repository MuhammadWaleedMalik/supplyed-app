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
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new Error(`${name} must be an HTTP(S) API URL without credentials, query, or fragment.`);
  if (process.argv.includes('--release') && url.protocol !== 'https:')
    throw new Error(`${name} must use HTTPS for a release build.`);
  return url.toString().replace(/\/+$/, '');
}

const android = apiUrl('API_BASE_URL_ANDROID', 'http://10.0.2.2:3003/api');
const ios = apiUrl('API_BASE_URL_IOS', 'http://localhost:3003/api');
const content =
  `export const ANDROID_API_URL = ${JSON.stringify(android)};\n` +
  `export const IOS_API_URL = ${JSON.stringify(ios)};\n`;

fs.writeFileSync(path.join(root, 'constants/env.ts'), content);
