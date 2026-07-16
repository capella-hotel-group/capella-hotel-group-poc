import { execFile, spawn } from 'node:child_process';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const LOCKFILE_PATH = 'package-lock.json';
const ZERO_SHA = '0000000000000000000000000000000000000000';

const runGit = async (args) => {
  const { stdout } = await execFileAsync('git', args, { encoding: 'utf8' });
  return stdout.trim();
};

const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? 'unknown'}`));
    });
  });

const runInstall = async () => {
  console.log('[auto-install] package-lock.json changed; running npm install...');
  await runCommand('npm', ['install']);
  console.log('[auto-install] npm install completed.');
};

const hasLockfileChanged = async (fromRef, toRef) => {
  if (!fromRef || !toRef || fromRef === ZERO_SHA || toRef === ZERO_SHA) {
    return false;
  }

  const output = await runGit(['diff', '--name-only', fromRef, toRef, '--', LOCKFILE_PATH]);
  return output === LOCKFILE_PATH;
};

const getPostMergeRefs = async () => {
  const headRef = await runGit(['rev-parse', 'HEAD']);

  try {
    const origHeadRef = await runGit(['rev-parse', 'ORIG_HEAD']);
    return { fromRef: origHeadRef, toRef: headRef };
  } catch {
    return { fromRef: '', toRef: headRef };
  }
};

const main = async () => {
  const hookName = process.argv[2];

  if (hookName === 'post-checkout') {
    const [, , , previousHead, newHead, checkoutType] = process.argv;

    if (checkoutType !== '1') {
      return;
    }

    if (await hasLockfileChanged(previousHead, newHead)) {
      await runInstall();
    }

    return;
  }

  if (hookName === 'post-merge') {
    const { fromRef, toRef } = await getPostMergeRefs();

    if (await hasLockfileChanged(fromRef, toRef)) {
      await runInstall();
    }

    return;
  }

  throw new Error(`Unsupported hook: ${hookName}`);
};

await main();
