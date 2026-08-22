// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
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
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { characters: chars, account: acc } }}>
      <Speedrun/>
    </AppContext.Provider>
  </ThemeProvider>
  );
};

const cardValue = (title) => screen.getByText(title).parentElement.textContent.replace(title, '');

// useCheckbox persists to localStorage by label, so one test's toggle would leak into the next.
beforeEach(() => window.localStorage.clear());

const showDetails = () => fireEvent.click(screen.getByLabelText('Detailed view'));

describe('Speedrun page', () => {
  it('renders the highscore panel for the demo account', () => {
    renderWith(characters);
    expect(screen.getByText('Portal highscore')).toBeTruthy();
    expect(screen.getByText('Run duration')).toBeTruthy();
    expect(screen.getByText('Void talent pts / run')).toBeTruthy();
    expect(screen.getByText('Multikill per tier')).toBeTruthy();
    expect(screen.getByText('Portals to next step')).toBeTruthy();
    expect(screen.getByText('Equinox goal (75)')).toBeTruthy();
  });

  it('hangs each explanation off an info icon rather than the whole card', async () => {
    const { container } = renderWith(characters);
    // Six tooltips (run duration, void points, multikill, next step, void radius, equinox) plus
    // three breakdowns (kill per kill, portal progress, damage).
    expect(container.querySelectorAll('.tabler-icon-info-circle-filled')).toHaveLength(9);

    const card = screen.getByText('Run duration').closest('[data-card-title-value]');
    const icon = card.querySelector('.tabler-icon-info-circle-filled');
    expect(icon).toBeTruthy();
    fireEvent.mouseOver(icon);
    expect(await screen.findByText('Level Void Trial Rerun to start a speedrun')).toBeTruthy();
  });

  it('shows the highscore from the save rather than a placeholder', () => {
    renderWith(characters);
    const highscore = account?.accountOptions?.[158];
    expect(highscore).toBeGreaterThan(0);
    expect(cardValue('Portal highscore')).toContain(String(highscore));
  });

  it('renders no NaN or undefined anywhere on the page', () => {
    const { container } = renderWith(characters);
    expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('groups the portals by world rather than ranking them', () => {
    renderWith(characters);
    const portals = screen.getByLabelText('speedrun portals');
    const worlds = within(portals).getAllByRole('heading').map((heading) => heading.textContent);
    expect(worlds).toEqual([...worlds].sort());
    expect(worlds[0]).toBe('World 1');
    expect(worlds.length).toBeGreaterThan(1);
  });

  it('keeps the per-portal numbers out of the way until detailed view is on', () => {
    renderWith(characters);
    const portals = screen.getByLabelText('speedrun portals');
    expect(within(portals).queryByText(/^Kills needed/)).toBeNull();
    showDetails();
    expect(within(portals).getAllByText(/^Kills needed/).length).toBeGreaterThan(100);
  });

  it('prices every portal both bare and under Void Radius', () => {
    renderWith(characters);
    showDetails();
    const portals = screen.getByLabelText('speedrun portals');
    expect(within(portals).getAllByText(/^Kills needed/).length).toBeGreaterThan(100);
    expect(within(portals).getAllByText(/^Clear time/).length).toBeGreaterThan(100);
    expect(within(portals).getAllByText(/^With Void Radius/).length).toBeGreaterThan(0);
  });

  it('names which door each portal is on maps that have two', () => {
    renderWith(characters);
    showDetails();
    const portals = screen.getByLabelText('speedrun portals');
    expect(within(portals).getByText('Door to Forest Outskirts')).toBeTruthy();
    // Two different maps have a door to Spike Surprise, so this is deliberately getAll.
    expect(within(portals).getAllByText('Door to Spike Surprise').length).toBeGreaterThan(0);
    // Single-portal maps carry no door caption at all.
    expect(within(portals).queryByText(/^Portal 1$/)).toBeNull();
  });

  it('breaks portal progress down into the bonuses most players miss', async () => {
    renderWith(characters);
    const card = screen.getByText('Portal progress / kill').closest('[data-card-title-value]');
    fireEvent.mouseOver(card.querySelector('.tabler-icon-info-circle-filled'));
    expect(await screen.findByText('Active Murdering (vault 43)')).toBeTruthy();
    expect(screen.getByText('Seawater vial')).toBeTruthy();
  });

  it('names all six world bosses with their portal payout', () => {
    renderWith(characters);
    ['Amarok', 'Efaunt', 'Chizoar', 'Troll', 'Kattlekruk', 'Emperor']
      .forEach((boss) => expect(screen.getByText(boss)).toBeTruthy());
  });

  it('renders the character stats without crashing', () => {
    const { container } = renderWith(characters);
    // "Kill per kill" is both a card and a source inside the portal-progress breakdown.
    expect(screen.getAllByText('Kill per kill').length).toBeGreaterThan(0);
    expect(screen.getByText('Portal progress / kill')).toBeTruthy();
    expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('falls back to a prompt when the account has no voidwalker', () => {
    renderWith(characters.filter((c) => !checkCharClass(c?.class, CLASSES.Voidwalker)));
    expect(screen.getByText(/Create a Voidwalker/)).toBeTruthy();
    expect(screen.queryByLabelText('speedrun portals')).toBeNull();
  });

  it('renders on an empty account without crashing', () => {
    const { container } = renderWith([], {});
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('picks a voidwalker rather than the first character in the account', () => {
    expect(voidwalker).toBeDefined();
    expect(characters[0]).not.toBe(voidwalker);
    renderWith(characters);
    // The demo voidwalker has not learned Void Trial Rerun, and bigBase growth answers 150 at
    // level 0 - the panel must say so instead of advertising a 151s run.
    expect(cardValue('Run duration')).toBe('Talent not learned');
  });
});
