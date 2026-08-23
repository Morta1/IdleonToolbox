// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';
import { notateNumber } from '@utility/helpers';
import {
  getMinibosses,
  getMinibossHp,
  getOneShotPickleCap,
  getPickleCount,
  getPrayerHpMulti
} from '@parsers/misc/boneJoeCalculator';
import { getMaxDamage } from '@parsers/damage';

// This project does not load jest-dom, so assertions use plain DOM properties.
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

// Spied rather than stubbed: the per character table is the expensive half of the page, and pricing
// it again on a keystroke in the manual inputs is the stutter this page has to avoid.
vi.mock('@parsers/damage', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getMaxDamage: vi.fn(actual.getMaxDamage) };
});

const { AppContext } = await import('@components/common/context/AppProvider');
const BoneJoeCalculator = (await import('../../pages/tools/bone-joe-calculator')).default;

const { characters, account } = parseFixture(raw);
const minibosses = getMinibosses();

const renderPage = (state) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state }}>
      <BoneJoeCalculator/>
    </AppContext.Provider>
  </ThemeProvider>
);

const rowCells = (label) => Array.from(screen.getByText(label).closest('tr').querySelectorAll('td'))
  .map((cell) => cell.textContent);

describe('Bone Joe Calculator page', () => {
  // The inputs persist to local storage, so one test's typing would otherwise seed the next.
  beforeEach(() => localStorage.clear());

  it('renders every miniboss with no account, so the page is not empty logged out', () => {
    renderPage({});
    minibosses.forEach(({ name }) => {
      expect(screen.getAllByText(name.replace(/_/g, ' ')).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Log in to see how many pickles/)).toBeDefined();
  });

  it('leaves HP at base with no pickles and no prayers, then scales it by 1.1 per pickle', () => {
    renderPage({});
    const [, baseHp, hp] = rowCells('Glunko The Massive');
    expect(baseHp).toBe(notateNumber(10000, 'Big'));
    expect(hp).toBe(baseHp);

    fireEvent.change(screen.getByLabelText('Pickles'), { target: { value: '3' } });
    expect(rowCells('Glunko The Massive')[2]).toBe(notateNumber(10000 * Math.pow(1.1, 3), 'Big'));
  });

  it('adds the prayer curse on top of the pickle multiplier', () => {
    renderPage({});
    fireEvent.change(screen.getByLabelText('Midas Minded'), { target: { value: '50' } });
    expect(screen.getByText(/Monster HP curse: \+1,475%/)).toBeDefined();
    expect(rowCells('Glunko The Massive')[2]).toBe(notateNumber(10000 * 15.75, 'Big'));
  });

  it('caps the prayer level input at the prayer max level', () => {
    renderPage({});
    fireEvent.change(screen.getByLabelText('Jawbreaker'), { target: { value: '999' } });
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

  it('does not reprice the characters while the toggle is off', () => {
    renderPage({ characters, account });
    getMaxDamage.mockClear();

    fireEvent.change(screen.getByLabelText('Pickles'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Midas Minded'), { target: { value: '20' } });

    // Midas Minded at Lv 20 curses 250 + 250 * 19 / 10 = 725%.
    expect(rowCells('Glunko The Massive')[2]).toBe(notateNumber(10000 * 8.25 * Math.pow(1.1, 5), 'Big'));
    expect(getMaxDamage).not.toHaveBeenCalled();
  });

  it('prices the characters off the configuration once the toggle is on', async () => {
    renderPage({ characters, account });
    const character = characters[0];
    const { maxDamage } = getMaxDamage(character, characters, account);

    fireEvent.change(screen.getByLabelText('Pickles'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Midas Minded'), { target: { value: '50' } });
    fireEvent.click(screen.getByLabelText('Apply to characters'));

    // The configuration reaches the table on a debounce, so the pickle column lands a beat later.
    await waitFor(() => expect(rowCells(character.name)[2]).toBe('5'));
    minibosses.forEach(({ baseHp }, index) => {
      const cap = getOneShotPickleCap(maxDamage, baseHp, 15.75);
      expect(rowCells(character.name)[3 + index]).toContain(cap < 0 ? '—' : String(cap));
    });
    expect(screen.getByText(/using the configuration above/)).toBeDefined();
  });

  it('goes back to each character own prayers and pickles when the toggle is off again', async () => {
    renderPage({ characters, account });
    const character = characters[0];

    fireEvent.change(screen.getByLabelText('Pickles'), { target: { value: '5' } });
    fireEvent.click(screen.getByLabelText('Apply to characters'));
    await waitFor(() => expect(rowCells(character.name)[2]).toBe('5'));

    fireEvent.click(screen.getByLabelText('Apply to characters'));
    expect(rowCells(character.name)[2]).toBe(String(getPickleCount(character)));
    expect(screen.getByText(/own equipped prayers and carried pickles/)).toBeDefined();
  });

  it('shows a one shot cap per character that matches the parser', () => {
    renderPage({ characters, account });
    const character = characters[0];
    const { maxDamage } = getMaxDamage(character, characters, account);
    const prayerHpMulti = getPrayerHpMulti(character, account);
    const cells = rowCells(character.name);

    expect(cells[1]).toBe(notateNumber(maxDamage, 'Big'));
    expect(cells[2]).toBe(String(getPickleCount(character)));
    minibosses.forEach(({ baseHp }, index) => {
      const cap = getOneShotPickleCap(maxDamage, baseHp, prayerHpMulti);
      expect(cells[3 + index]).toContain(cap < 0 ? '—' : String(cap));
    });
  });

  it('reports one shot in a cell whose HP is inside a single max hit', () => {
    renderPage({ characters, account });
    const character = characters[0];
    const { maxDamage } = getMaxDamage(character, characters, account);
    const prayerHpMulti = getPrayerHpMulti(character, account);
    const carried = getPickleCount(character);
    const cells = rowCells(character.name);

    minibosses.forEach(({ baseHp }, index) => {
      const hp = getMinibossHp(baseHp, prayerHpMulti, carried);
      if (hp <= maxDamage) expect(cells[3 + index]).toContain('one shot');
    });
  });
});
