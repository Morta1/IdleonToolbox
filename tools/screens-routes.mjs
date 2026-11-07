// Lists every screenshot route from the last screens run: project, route, the SCREENS_COUNT count, and
// whether its screenshot changed. --check prints only the routes where the two disagree.
import fs from 'node:fs';

const file = process.argv.find((arg) => arg.endsWith('.json')) ?? '.screens/last-run.json';
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const specs = (suite) => [...(suite.specs ?? []), ...(suite.suites ?? []).flatMap(specs)];
const rows = report.suites.flatMap(specs).flatMap((spec) => spec.tests.map((test) => {
  const notes = [...(test.annotations ?? []), ...test.results.flatMap((result) => result.annotations ?? [])];
  const count = Number(notes.find(({ type }) => type === 'count')?.description ?? 0);
  const changed = test.results.some(({ status }) => status === 'failed' || status === 'timedOut');
  return { project: test.projectName, route: spec.title, count, changed };
}));
const shown = process.argv.includes('--check') ? rows.filter(({ count, changed }) => (count > 0) !== changed) : rows;
shown.forEach(({ project, route, count, changed }) => console.log([project, route, count, changed ? 'changed' : 'same'].join('\t')));
console.log(`${rows.filter(({ changed }) => changed).length} changed, ${rows.filter(({ count }) => count > 0).length} with a match, ${shown.length} listed`);
