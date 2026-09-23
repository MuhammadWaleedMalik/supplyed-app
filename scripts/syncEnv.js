const fs = require('fs');

const lines = fs.readFileSync('.env', 'utf8').split('\n');
const values = {};

for (const line of lines) {
  const [name, value] = line.trim().split('=');
  if (name && value) values[name] = value;
}

const android = values.API_BASE_URL_ANDROID || 'http://10.0.2.2:3003/api';
const ios = values.API_BASE_URL_IOS || 'http://localhost:3003/api';
const content =
  `export const ANDROID_API_URL = ${JSON.stringify(android)};\n` +
  `export const IOS_API_URL = ${JSON.stringify(ios)};\n`;

fs.writeFileSync('constants/env.ts', content);
