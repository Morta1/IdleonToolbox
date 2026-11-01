// Answers whether a change needs a build before its checks (a FAST_BUILD and the screens run against it).
//   node tools/needs-build.mjs                staged files, or the working tree against HEAD when nothing is staged
//   node tools/needs-build.mjs --since <rev>  everything that differs from <rev>, e.g. the commit out/ was built from
//   node tools/needs-build.mjs -- <files...>
// Prints yes or no with the file that decided it. Exits 0 for yes and 1 for no:
//   node tools/needs-build.mjs && FAST_BUILD=1 npm run build
import { execFileSync } from 'node:child_process';

// What the export is built from. Anything outside both lists also counts as yes, so a new top-level folder or
// root file needs a build until it is listed here.
const BUILD = [/^components\//, /^pages\//, /^hooks\//, /^utility\//, /^styles\//, /^parsers\//, /^data\//];
// Tests, docs and the config of tools that never reach out/.
const NO_BUILD = [
  /^__test__\//, /^e2e\//, /^docs\//, /^tools\//, /^\.husky\//, /^\.claude\//, /^\.github\//, /\.md$/,
  /^eslint\.config\.mjs$/, /^eslint-suppressions\.json$/, /^vitest\.config\.js$/, /^playwright(\.screens)?\.config\.js$/,
  /^\.gitignore$/, /^LICENSE$/,
];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).split('\n').map((line) => line.trim()).filter(Boolean);

const filesToCheck = (argv) => {
  const dashes = argv.indexOf('--');
  if (dashes !== -1) return argv.slice(dashes + 1);
  const since = argv.indexOf('--since');
  if (since !== -1) return [...git('diff', '--name-only', argv[since + 1]), ...git('ls-files', '--others', '--exclude-standard')];
  const staged = git('diff', '--cached', '--name-only');
  return staged.length ? staged : [...git('diff', '--name-only', 'HEAD'), ...git('ls-files', '--others', '--exclude-standard')];
};

export const needsBuild = (files) => {
  for (const raw of files) {
    const file = raw.replaceAll('\\', '/');
    if (BUILD.some((pattern) => pattern.test(file))) return { build: true, file, reason: 'builds into the export' };
    if (!NO_BUILD.some((pattern) => pattern.test(file))) return { build: true, file, reason: 'not a test, doc or tool config' };
  }
  return { build: false };
};

if (import.meta.main) {
  const files = filesToCheck(process.argv.slice(2));
  const { build, file, reason } = needsBuild(files);
  console.log(build ? `yes: ${file} (${reason})` : `no: ${files.length ? `${files.length} file${files.length === 1 ? '' : 's'}, all tests, docs or tool config` : 'nothing changed'}`);
  process.exit(build ? 0 : 1);
}
