import { exec } from 'node:child_process';

const run = (cmd) =>
  new Promise((resolve, reject) =>
    exec(cmd, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout);
    }),
  );

const changeset = await run('git diff --cached --name-only --diff-filter=ACMR');
const modifiedFiles = changeset.split('\n').filter(Boolean);

// Auto-fix staged JS/TS/CSS files then re-stage them
console.log('[pre-commit] Running lint-staged...');
await run('npx lint-staged');

// check if there are any model files staged
const modifledPartials = modifiedFiles.filter((file) => file.match(/(^|\/)_.*.json/));
if (modifledPartials.length > 0) {
  console.log('[pre-commit] Model files changed — regenerating AEM component JSON...');
  const output = await run('npm run build:json --silent');
  console.log(output);
  await run('git add component-models.json component-definition.json component-filters.json');
}

// run full build when source files are staged
const hasSrcChanges = modifiedFiles.some((f) => f.startsWith('src/'));
const hasConfigChanges = modifiedFiles.some((f) => /^(vite\.config|tsconfig)/.test(f));
if (hasSrcChanges || hasConfigChanges) {
  console.log('[pre-commit] Source files changed — running build...');
  const buildOutput = await run('npm run build');
  console.log(buildOutput);
  // Use -u to only re-stage already-tracked output files, never untracked work-in-progress
  await run('git add -u blocks/ scripts/ styles/ chunks/');
}
