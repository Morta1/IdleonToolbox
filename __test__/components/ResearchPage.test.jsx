// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';

// This project does not load jest-dom, so assertions use plain DOM properties.
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

// The tabs draw the grid, observations and posty notes; this test covers the stat cards above them.
vi.mock('@components/common/Tabber', () => ({ default: () => null }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Research = (await import('../../pages/account/world-7/research')).default;

const { characters, account } = parseFixture(raw);

const renderPage = () => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { characters, account } }}>
      <Research/>
    </AppContext.Provider>
  </ThemeProvider>
);

// The card wraps title and value in one element, so this reads the whole card's text.
const cardText = (title) => screen.getByText(title).closest('[data-card-title-value]').textContent;

describe('Research page', () => {
  it('renders the level with its EXP progress and the level up ETAs', () => {
    renderPage();
    const { researchLevel, researchEXPpercent } = account.research;
    expect(cardText('Research Level')).toContain(`${researchLevel} (${researchEXPpercent.toFixed(2)}%)`);
    // 81.6h to level at the fixture's rate, 54.4h once the tournament registration is counted.
    expect(cardText('Time To Level')).toContain('3d 10h');
    expect(cardText('Time With Registrant')).toContain('2d 6h');
  });

  // Registering for the tournament banks 12hrs of research gains once per tournament day, so the
  // assumption behind the second ETA hangs off an info icon rather than sitting in the value.
  it('explains the registrant assumption on an info icon, not on the card', () => {
    renderPage();
    const card = screen.getByText('Time With Registrant').closest('[data-card-title-value]');
    expect(card.getAttribute('aria-label')).toBe('');
    const icon = card.querySelector('[aria-label*="12hrs of research gains"]');
    expect(icon).not.toBeNull();
  });
});
