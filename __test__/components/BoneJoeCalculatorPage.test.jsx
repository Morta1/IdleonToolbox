// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';
import { formatNum } from '@utility/helpers';
import {
  getEffectiveDamage,
  getHitsToKill,
  getSkillDamage,
  getMinibosses,
  getMinibossHp,
  getMinibossPlayerInfo,
  getPickleCapForHits,
  getPickleCount,
  getPrayerHpMulti
} from '@parsers/misc/boneJoeCalculator';
import { getMaxDamage } from '@parsers/damage';
import { getPrayerBonusAndCurse } from '@parsers/world-3/prayers';

// This project does not load jest-dom, so assertions use plain DOM properties.
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

const { AppContext } = await import('@components/common/context/AppProvider');
const BoneJoeCalculator = (await import('../../pages/tools/bone-joe-calculator')).default;

const { characters, account } = parseFixture(raw);
const minibosses = getMinibosses();

// Verminous takes the Royal Guardian rat damage rather than the character's own, so every column
// prices its own swing.
const bossDamage = (playerInfo, rawName, character, price = getEffectiveDamage) =>
  price(getMinibossPlayerInfo(playerInfo, rawName, account), character);

const renderPage = (state) => render(
  <ThemeProvider theme={theme}>
    <AppContext.Provider value={{ state }}>
      <BoneJoeCalculator/>
    </AppContext.Provider>
  </ThemeProvider>
);

// With an account the prayer levels are prefilled from the save, and each prayer has an equip toggle.
const accountCurseMulti = (name) => {
  const prayer = account?.prayers?.find((entry) => entry.name === name);
  return 1 + getPrayerBonusAndCurse([prayer], name).curse / 100;
};
const prayerChip = (name) => screen.getByRole('button', { name: `Equip ${name}` });

const rowCells = (label) => Array.from(screen.getByText(label).closest('tr').querySelectorAll('td'))
  .map((cell) => cell.textContent);

describe('Bone Joe Calculator page', () => {
  // The inputs persist to local storage, so one test's typing would otherwise seed the next.
  beforeEach(() => localStorage.clear());

  it('renders every miniboss logged out at base HP, then scales it by 1.1 per pickle', () => {
    renderPage({});
    minibosses.forEach(({ name }) => {
      expect(screen.getAllByText(name.replace(/_/g, ' ')).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/pickles each character can carry shows here once you sign in/)).toBeDefined();
    const [, baseHp, hp] = rowCells('Glunko The Massive');
    expect(baseHp).toBe(formatNum(10000));
    expect(hp).toBe(baseHp);

    fireEvent.change(screen.getByLabelText('Pickles'), { target: { value: '3' } });
    expect(rowCells('Glunko The Massive')[2]).toBe(formatNum(10000 * Math.pow(1.1, 3)));
  });

  it('adds the prayer curse on top of the pickle multiplier', () => {
    renderPage({});
    fireEvent.change(screen.getByLabelText('Midas Minded'), { target: { value: '50' } });
    expect(screen.getByText('Monster HP curse').nextSibling.textContent).toBe('+1,475%');
    expect(rowCells('Glunko The Massive')[2]).toBe(formatNum(10000 * 15.75));
  });

  it('caps the prayer level input at the prayer max level', () => {
    renderPage({});
    fireEvent.change(screen.getByLabelText('Jawbreaker'), { target: { value: '999' } });
    fireEvent.blur(screen.getByLabelText('Jawbreaker'));
    expect(screen.getByLabelText('Jawbreaker').value).toBe('50');
  });

  it('keeps the inputs across a remount', () => {
    const { unmount } = renderPage({});
    fireEvent.change(screen.getByLabelText('Pickles'), { target: { value: '17' } });
    fireEvent.change(screen.getByLabelText('Big Brain Time'), { target: { value: '12' } });
    unmount();

    renderPage({});
    expect(screen.getByLabelText('Pickles').value).toBe('17');
    expect(screen.getByLabelText('Big Brain Time').value).toBe('12');
  });

  it('prefills prayer levels from the account and toggles them', () => {
    renderPage({ characters, account });
    const midas = account.prayers.find(({ name }) => name === 'Midas_Minded');
    expect(screen.getByLabelText('Midas Minded').value).toBe(String(midas.level));
    expect(prayerChip('Midas Minded').getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(prayerChip('Midas Minded'));
    expect(prayerChip('Midas Minded').getAttribute('aria-pressed')).toBe('true');
    expect(rowCells('Glunko The Massive')[2]).toBe(formatNum(10000 * accountCurseMulti('Midas_Minded')));

    fireEvent.click(prayerChip('Midas Minded'));
    expect(rowCells('Glunko The Massive')[2]).toBe(formatNum(10000));
  });

  it('lets a logged in user try a level the account does not have yet', () => {
    renderPage({ characters, account });
    const midas = account.prayers.find(({ name }) => name === 'Midas_Minded');
    const whatIf = midas.level === 50 ? 20 : 50;
    fireEvent.click(prayerChip('Midas Minded'));
    fireEvent.change(screen.getByLabelText('Midas Minded'), { target: { value: String(whatIf) } });

    const curse = 250 + 250 * (whatIf - 1) / 10;
    expect(rowCells('Glunko The Massive')[2]).toBe(formatNum(10000 * (1 + curse / 100)));
    const reset = screen.getByRole('button', { name: 'Reset Midas Minded to account level' });

    // Resetting drops the override, so the field follows the save again. The click takes focus off the field first.
    fireEvent.blur(screen.getByLabelText('Midas Minded'));
    fireEvent.click(reset);
    expect(screen.getByLabelText('Midas Minded').value).toBe(String(midas.level));
    expect(screen.queryByRole('button', { name: 'Reset Midas Minded to account level' })).toBe(null);
    expect(JSON.parse(localStorage.getItem('boneJoeCalculator:prayerLevelOverrides'))).toEqual({});
  });

  it('leaves the characters as they are while the toggle is off', () => {
    renderPage({ characters, account });
    const before = rowCells(characters[0].name);

    fireEvent.change(screen.getByLabelText('Pickles'), { target: { value: '5' } });
    fireEvent.click(prayerChip('Midas Minded'));

    expect(rowCells('Glunko The Massive')[2])
      .toBe(formatNum(10000 * accountCurseMulti('Midas_Minded') * Math.pow(1.1, 5)));
    expect(rowCells(characters[0].name)).toEqual(before);
  });

  it('prices the characters off the configuration once the toggle is on, and goes back to their own when it is off', async () => {
    renderPage({ characters, account });
    const character = characters[0];
    const playerInfo = getMaxDamage(character, characters, account);
    const hpMulti = accountCurseMulti('Midas_Minded');

    fireEvent.change(screen.getByLabelText('Pickles'), { target: { value: '5' } });
    fireEvent.click(prayerChip('Midas Minded'));
    fireEvent.click(screen.getByLabelText('Apply to characters'));

    // The pickles and the prayer curse reach the table on two SEPARATE debounces, so waiting on the
    // pickle column alone is not enough: under load the pickles land a render before the curse
    // does, and the caps are then computed against an uncursed miniboss. Waiting on a cap waits on
    // both, since a cap is only right once the curse has arrived too.
    const capOf = ({ rawName, baseHp }) => {
      const cap = getPickleCapForHits(bossDamage(playerInfo, rawName, character), baseHp, hpMulti);
      return cap < 0 ? '-' : formatNum(cap, 'whole');
    };
    await waitFor(() => {
      expect(rowCells(character.name)[2]).toBe('5');
      minibosses.forEach((miniboss, index) => {
        expect(rowCells(character.name)[3 + index]).toContain(capOf(miniboss));
      });
    });
    expect(screen.getByText(/using the configuration above/)).toBeDefined();

    fireEvent.click(screen.getByLabelText('Apply to characters'));
    expect(rowCells(character.name)[2]).toBe(String(getPickleCount(character)));
    expect(screen.getByText(/own equipped prayers and carried pickles/)).toBeDefined();
  });

  it('raises every cap to the target number of hits', async () => {
    renderPage({ characters, account });
    const character = characters[0];
    const playerInfo = getMaxDamage(character, characters, account);
    const prayerHpMulti = getPrayerHpMulti(character, account);

    fireEvent.change(screen.getByLabelText('Target hits'), { target: { value: '5' } });
    await waitFor(() => {
      minibosses.forEach(({ rawName, baseHp }, index) => {
        const cap = getPickleCapForHits(bossDamage(playerInfo, rawName, character), baseHp, prayerHpMulti, 5);
        expect(rowCells(character.name)[3 + index]).toContain(cap < 0 ? '-' : formatNum(cap, 'whole'));
      });
    });
    expect(screen.getByText(/within 5 hits/)).toBeDefined();
  });

  it('shows a hit cap per character that matches the parser, and counts hits off the crit lifted swing rather than the plain average', () => {
    renderPage({ characters, account });
    const character = characters[0];
    const playerInfo = getMaxDamage(character, characters, account);
    const prayerHpMulti = getPrayerHpMulti(character, account);
    const carried = getPickleCount(character);
    const effectiveDamage = getEffectiveDamage(playerInfo);
    const cells = rowCells(character.name);

    expect(cells[1]).toBe(formatNum(playerInfo.maxDamage));
    expect(cells[2]).toBe(String(carried));
    minibosses.forEach(({ rawName, baseHp }, index) => {
      const cap = getPickleCapForHits(bossDamage(playerInfo, rawName, character), baseHp, prayerHpMulti);
      expect(cells[3 + index]).toContain(cap < 0 ? '-' : formatNum(cap, 'whole'));
    });

    // Crits are worth a real multiple here, so pricing a swing at the plain average would inflate
    // every hit count on the row. That gap is the bug this covers.
    const averageDamage = (playerInfo.minDamage + playerInfo.maxDamage) / 2;
    expect(effectiveDamage).toBeGreaterThan(averageDamage);

    const skillDamage = getSkillDamage(playerInfo, character);
    // The skill bound has to be the optimistic end, or the range reads backwards.
    expect(skillDamage).toBeGreaterThanOrEqual(effectiveDamage);

    minibosses.forEach(({ rawName, baseHp }, index) => {
      const hp = getMinibossHp(baseHp, prayerHpMulti, carried);
      const hits = getHitsToKill(hp, bossDamage(playerInfo, rawName, character));
      const skillHits = getHitsToKill(hp, bossDamage(playerInfo, rawName, character, getSkillDamage));
      // Worst case is always shown; the best case joins it whenever the two differ.
      expect(cells[3 + index]).toContain(hits <= 1 ? '1 hit' : formatNum(hits, 'whole'));
      if (Math.ceil(skillHits) !== Math.ceil(hits)) {
        expect(cells[3 + index]).toContain(`${formatNum(skillHits, 'whole')} to `);
      }
    });
  });
});
