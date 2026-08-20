// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { parseFixture } from '../helpers/parsed-fixtures';
import { checkCharClass, CLASSES } from '@parsers/talents';
import raw from '../../data/raw.json';

// This project does not load jest-dom, so assertions use plain DOM properties.
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

// The tabs below the stat cards each draw a whole sub-page; the character selection this test
// covers is decided above them. Children still render so the optimizer's props can be checked.
vi.mock('@components/common/Tabber', () => ({ default: ({ children }) => <>{children}</> }));
vi.mock('@components/account/Misc/class-specific/Compass/Upgrades', () => ({ default: () => null }));
vi.mock('@components/account/Misc/class-specific/Compass/Abominations', () => ({ default: () => null }));
vi.mock('@components/account/Misc/class-specific/Compass/Medallions', () => ({ default: () => null }));
vi.mock('@components/account/Misc/class-specific/Compass/Portals', () => ({ default: () => null }));

const optimizerCharacter = vi.fn();
vi.mock('@components/account/Misc/class-specific/Compass/UpgradeOptimizer', () => ({
  default: ({ character }) => {
    optimizerCharacter(character?.name);
    return null;
  }
}));

const { AppContext } = await import('@components/common/context/AppProvider');
const Compass = (await import('../../pages/account/class-specific/compass')).default;

const { characters, account } = parseFixture(raw);
const windWalker = characters.find((c) => checkCharClass(c?.class, CLASSES.Wind_Walker));
const nonWindWalker = characters[0];

const renderWith = (chars) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { characters: chars, account } }}>
      <Compass/>
    </AppContext.Provider>
  </ThemeProvider>
);

// Every stat card is computed from the selected character, so multishot stands in for all of them.
const multishotValue = () => screen.getByText('Multishot').parentElement.textContent;

describe('Compass character selection', () => {
  it('uses the wind walker, not the first character, when the account has one', () => {
    expect(nonWindWalker.playerId).toBe(0);
    expect(windWalker.playerId).not.toBe(0);
    renderWith(characters);
    expect(multishotValue()).toContain('3903.51%');
  });

  // The bug: the old code only picked a wind walker when there was exactly one, so two or more
  // fell back to characters[0] - a Siege Breaker here - for every stat on the page.
  it('defaults to the first wind walker when the account has several', () => {
    const secondWindWalker = { ...windWalker, name: 'SecondWW', playerId: 7 };
    renderWith([...characters, secondWindWalker]);
    expect(multishotValue()).toContain('3903.51%');
    expect(multishotValue()).not.toContain('1907.46%');
  });

  it('switches stats when another wind walker is picked', () => {
    const weaker = { ...nonWindWalker, class: windWalker.class, name: 'WeakWW', playerId: 7 };
    renderWith([...characters, weaker]);
    expect(multishotValue()).toContain('3903.51%');

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('WeakWW'));
    expect(multishotValue()).toContain('1907.46%');
  });

  it('renders without a wind walker on the account', () => {
    const noWindWalkers = characters.filter((c) => !checkCharClass(c?.class, CLASSES.Wind_Walker));
    expect(() => renderWith(noWindWalkers)).not.toThrow();
    expect(screen.getByText('Multishot')).toBeDefined();
  });

  it('hands the optimizer the same wind walker the stat cards use', () => {
    optimizerCharacter.mockClear();
    renderWith(characters);
    expect(optimizerCharacter).toHaveBeenCalledWith(windWalker.name);
  });
});
