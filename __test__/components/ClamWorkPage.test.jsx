// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';

// This project does not load jest-dom, so assertions use plain DOM properties.
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

// The tabs each draw a whole sub-page; this test covers the stat cards above them.
vi.mock('@components/common/Tabber', () => ({ default: () => null }));

const { AppContext } = await import('@components/common/context/AppProvider');
const ClamWork = (await import('../../pages/account/world-7/clam-work')).default;

const { characters, account } = parseFixture(raw);

const renderPage = () => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { characters, account } }}>
      <ClamWork/>
    </AppContext.Provider>
  </ThemeProvider>
);

// The card wraps title and value in one element, so this reads the whole card's text.
const cardText = (title) => screen.getByText(title).closest('[data-card-title-value]').textContent;

describe('Clam Work page', () => {
  it('renders the clam stat cards', () => {
    renderPage();
    expect(cardText('Worker Class')).toContain('Lv. 5');
    expect(cardText('Clam Mobs')).toContain('13');
    expect(cardText('Black Pearl Value')).toContain('450');
  });

  // The tooltip hangs off an info icon beside the label, not off the whole card, so that hovering
  // the character dropdown or the multikill input does not pop it open. CardTitleAndValue always
  // wraps the card in a Tooltip, so the card carries an empty aria-label rather than none at all.
  it('puts an info icon beside the two input labels, not on the card', () => {
    renderPage();
    const tooltips = {
      'Clamworks Character': /MULTI-SCALPING scales with the multikill/,
      'Multikill': /Calculated against clam HP/
    };
    Object.entries(tooltips).forEach(([label, expected]) => {
      const labelEl = screen.getByText(label);
      const icon = labelEl.querySelector('svg');
      expect(icon).toBeTruthy();
      expect(icon.closest('[aria-label]').getAttribute('aria-label')).toMatch(expected);
      expect(labelEl.closest('[data-card-title-value]').getAttribute('aria-label')).toBeFalsy();
    });
  });

  it('recalculates pearl value from the multikill input', () => {
    renderPage();
    expect(cardText('Pearl Value Multiplier')).toContain('41');
    // Well above the auto-suggested multikill, so the override has to visibly move the value.
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3585' } });
    expect(cardText('Pearl Value Multiplier')).toContain('73');
  });
});
