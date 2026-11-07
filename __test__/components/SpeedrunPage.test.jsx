// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { parseFixture } from '../helpers/parsed-fixtures';
import { checkCharClass, CLASSES } from '@parsers/talents';
import raw from '../../data/raw.json';

// This project does not load jest-dom, so assertions use plain DOM properties.
// Tabber picks its tab off the router query rather than local state, so the mock has to carry one.
const { routerQuery } = vi.hoisted(() => ({ routerQuery: { current: {} } }));
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: routerQuery.current, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Speedrun = (await import('../../pages/account/class-specific/speedrun')).default;

const { characters, account } = parseFixture(raw);
const voidwalker = characters.find((c) => checkCharClass(c?.class, CLASSES.Voidwalker));

const renderWith = (chars, acc = account, query = {}) => {
  routerQuery.current = query;
  return render(
  <ThemeProvider theme={theme}>
    <AppContext.Provider value={{ state: { characters: chars, account: acc } }}>
      <Speedrun/>
    </AppContext.Provider>
  </ThemeProvider>
  );
};

const cardValue = (title) => screen.getByText(title).parentElement.textContent.replace(title, '');

// The page's choices persist to localStorage, so one test's toggle would leak into the next.
beforeEach(() => window.localStorage.clear());

const showDetails = () => fireEvent.click(screen.getByRole('button', { name: 'Detailed view' }));

// 30 s: each test renders the whole page, every portal priced, and the full suite's load can stretch that past 20 s.
describe('Speedrun page', { timeout: 30_000 }, () => {
  it('reads the demo account: its panel with its notes, its voidwalker, the portals by world and every world boss', async () => {
    expect(characters[0]).not.toBe(voidwalker);
    const { container } = renderWith(characters);
    ['Run duration', 'Void talent points per run', 'Multikill per tier', 'Portals to next step', 'Equinox goal', 'Portal progress per kill']
      .forEach((title) => expect(screen.getByText(title)).toBeTruthy());
    // "Kill per kill" is both a card and a source inside the portal-progress breakdown.
    expect(screen.getAllByText('Kill per kill').length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);

    const highscore = account?.accountOptions?.[158];
    expect(highscore).toBeGreaterThan(0);
    expect(cardValue('Portal highscore')).toContain(String(highscore));

    // The demo voidwalker has not learned Void Trial Rerun, and bigBase growth answers 150 at
    // level 0 - the panel must say so instead of advertising a 151s run.
    expect(cardValue('Run duration')).toBe('Talent not learned');

    const portals = screen.getByLabelText('speedrun portals');
    const worlds = within(portals).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(worlds).toEqual([...worlds].sort());
    expect(worlds[0]).toBe('World 1');
    expect(worlds.length).toBeGreaterThan(1);

    ['Amarok', 'Efaunt', 'Chizoar', 'Troll', 'Kattlekruk', 'Emperor']
      .forEach((boss) => expect(screen.getByText(boss)).toBeTruthy());

    // Six notes (run duration, void points, multikill, next step, void radius, equinox). The three
    // breakdowns (kill per kill, portal progress, damage) open from their value, not an icon.
    expect(screen.getAllByRole('button', { name: /^About / })).toHaveLength(6);
    fireEvent.click(screen.getByRole('button', { name: 'About Run duration' }));
    expect(await screen.findByText('Level Void Trial Rerun to start a speedrun')).toBeTruthy();
  });

  it('detailed view prices every portal bare and names the door on maps with two', () => {
    renderWith(characters);
    const portals = screen.getByLabelText('speedrun portals');
    expect(within(portals).queryByText(/^Kills needed/)).toBeNull();
    showDetails();
    expect(within(portals).getAllByText(/^Kills needed/).length).toBeGreaterThan(100);
    expect(within(portals).getAllByText(/^Clear time/).length).toBeGreaterThan(100);
    expect(within(portals).getByText('Door to Forest Outskirts')).toBeTruthy();
    // Two different maps have a door to Spike Surprise, so this is deliberately getAll.
    expect(within(portals).getAllByText('Door to Spike Surprise').length).toBeGreaterThan(0);
    // Single-portal maps carry no door caption at all.
    expect(within(portals).queryByText(/^Portal 1$/)).toBeNull();
    // The demo voidwalker cannot start a run, so Void Radius never gets its speedrun bonus
    expect(within(portals).queryByText(/^With Void Radius/)).toBeNull();
  });

  it('adds the Void Radius clear time once Void Trial Rerun is learned', () => {
    const learned = characters.map((character) => character === voidwalker
      ? {
        ...character,
        flatTalents: character.flatTalents.map((talent) => talent.name === 'VOID_TRIAL_RERUN'
          ? { ...talent, level: 1, baseLevel: 1 }
          : talent)
      }
      : character);
    renderWith(learned);
    showDetails();
    expect(within(screen.getByLabelText('speedrun portals')).getAllByText(/^With Void Radius/).length).toBeGreaterThan(0);
  });

  it('breaks portal progress down into the bonuses most players miss', async () => {
    renderWith(characters);
    const card = screen.getByText('Portal progress per kill').closest('[data-stat-tile]');
    fireEvent.click(within(card).getByRole('button'));
    expect(await screen.findByText('Active Murdering (vault 43)')).toBeTruthy();
    expect(screen.getByText('Seawater vial')).toBeTruthy();
  });

  it('says so above the portal catalog when the account has no voidwalker', () => {
    renderWith(characters.filter((c) => !checkCharClass(c?.class, CLASSES.Voidwalker)));
    expect(screen.getByText(/Create a Voidwalker/)).toBeTruthy();
    expect(screen.getByLabelText('speedrun portals').textContent).toMatch(/Kills needed/);
    expect(screen.getByLabelText('speedrun portals').textContent).not.toMatch(/Clear time/);
  });

  it('renders on an empty account without crashing', () => {
    const { container } = renderWith([], {});
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
});
