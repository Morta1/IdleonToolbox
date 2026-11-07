import fs from 'node:fs';
import path from 'node:path';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

// The saves the section regressions run on, from early progress to the newest
export const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

// Every save in __test__/fixtures as [name, fixture], for the sweeps that must meet a save the day it lands there.
// Read once per worker, so parseFixture's cache holds across files.
let everyFixture;
export const allFixtures = () => {
  const dir = path.resolve(__dirname, '../fixtures');
  everyFixture ??= fs.readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => [file.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))]);
  return everyFixture;
};

// One rule on several saves is one test: a failure says which save broke it.
export const onEachFixture = (fixtures, check) => {
  for (const [name, fixture] of fixtures) {
    try {
      check(fixture, name);
    } catch (error) {
      error.message = `${name}: ${error.message}`;
      throw error;
    }
  }
};
