// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';
import { formatNum } from '@utility/helpers';

// This project does not load jest-dom, so assertions use plain DOM properties.
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

// The tabs draw the grid, observations and posty notes; this test covers the stat cards above them.
vi.mock('@components/common/Tabber', () => ({ default: () => null }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Research = (await import('../../pages/account/world-7/research')).default;

const { characters, account } = parseFixture(raw);

const renderPage = () => render(
  <ThemeProvider theme={theme}>
    <AppContext.Provider value={{ state: { characters, account } }}>
      <Research/>
    </AppContext.Provider>
  </ThemeProvider>
);

// The card wraps title and value in one element, so this reads the whole card's text.
const cardText = (title) => screen.getByText(title).closest('[data-stat-tile]').textContent;

describe('Research page', () => {
  // Registering for the tournament banks 12 hours of research gains once per tournament day, so the
  // assumption behind the second ETA hangs off an info icon rather than sitting in the value.
  it('renders the level with its EXP progress and the level up ETAs, the registrant assumption on an info icon', () => {
    renderPage();
    const { researchLevel, researchEXPpercent } = account.research;
    expect(cardText('Research level')).toContain(`${researchLevel} (${formatNum(researchEXPpercent, 'pct')})`);
    // 60h to level at the fixture's rate (2.3.561: Research Skill Mastery), 40h once the tournament registration is counted.
    expect(cardText('Time to level')).toContain('2d 12h');
    expect(cardText('Time with registrant')).toContain('1d 16h');
    const card = screen.getByText('Time with registrant').closest('[data-stat-tile]');
    expect(card.getAttribute('aria-label')).toBeNull();
    const icon = card.querySelector('[aria-label="About Time with registrant"]');
    expect(icon).not.toBeNull();
  });
});
