const {execFileSync, spawnSync} = require('node:child_process');

const reactNativeArgs = ['react-native', 'run-android'];
const extraArgs = process.argv.slice(2);

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
}

function getAdbOutput(args) {
  try {
    return execFileSync('adb', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: process.platform === 'win32',
    });
  } catch {
    return '';
  }
}

function listAndroidTargets() {
  return getAdbOutput(['devices'])
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(([id, state]) => id && state)
    .map(([id, state]) => ({
      id,
      state,
      isEmulator: id.startsWith('emulator-'),
    }));
}

function hasDeviceFlag(args) {
  return args.some(
    arg =>
      arg === '--deviceId' ||
      arg.startsWith('--deviceId=') ||
      arg === '--device' ||
      arg.startsWith('--device='),
  );
}

const targets = listAndroidTargets();
const physicalTargets = targets.filter(target => !target.isEmulator);
const physicalDevice = physicalTargets.find(target => target.state === 'device');
const unavailablePhysicalDevice = physicalTargets.find(target => target.state !== 'device');
const selectedDeviceArgs =
  physicalDevice && !hasDeviceFlag(extraArgs) ? ['--deviceId', physicalDevice.id] : [];

if (physicalDevice && selectedDeviceArgs.length > 0) {
  console.log(`Using connected Android device: ${physicalDevice.id}`);
} else if (unavailablePhysicalDevice && !hasDeviceFlag(extraArgs)) {
  console.error(
    `Connected Android phone ${unavailablePhysicalDevice.id} is ${unavailablePhysicalDevice.state}. ` +
      'Unlock the phone, enable USB debugging, and accept the USB debugging prompt.',
  );
  process.exit(1);
} else if (!physicalDevice) {
  console.log('No connected Android phone found by adb. Falling back to React Native emulator launch.');
}

const result = run('npx', [...reactNativeArgs, ...selectedDeviceArgs, ...extraArgs]);
process.exit(result.status ?? 1);
