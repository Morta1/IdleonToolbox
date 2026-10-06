import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getResearch } from '@parsers/world-7/research';
import { parseFixture } from '../helpers/parsed-fixtures';
import latest from '../fixtures/latest.json';

const withResearch = (character, research) => ({
  ...character,
  skillsInfo: { ...character.skillsInfo, research: { ...character.skillsInfo?.research, ...research } }
});

describe('getResearch EXP left', () => {
  it('takes exp and expReq from the same character when one is a level behind', () => {
    const { account, characters } = parseFixture(latest);
    const fresh = withResearch(characters[0], { level: 50, exp: 10, expReq: 1000 });
    const stale = withResearch(characters[1], { level: 49, exp: 900, expReq: 950 });

    const research = getResearch(latest.data ?? latest, account, [stale, fresh]);

    expect(research.researchEXP).toBe(10);
    expect(research.researchEXPreq).toBe(1000);
    expect(research.researchEXPreq - research.researchEXP).toBe(990);
  });
});
