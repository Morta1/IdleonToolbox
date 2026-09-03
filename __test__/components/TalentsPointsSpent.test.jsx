// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import Talents from '@components/characters/Talents';

// The parser stores the invested points in baseLevel and the boosted level in level, so a page of
// Royal Guardian talents on an account with Talent Reattainment at 50 reads baseLevel + 50.
const talent = (skillIndex, baseLevel, addedLevels) => ({
  talentId: skillIndex,
  skillIndex,
  name: `TALENT_${skillIndex}`,
  baseLevel,
  level: baseLevel >= 1 ? baseLevel + addedLevels : baseLevel,
  maxLevel: 396
});

const royalGuardianPage = (addedLevels) => ({
  name: 'Royal_Guardian',
  id: 11,
  orderedTalents: [talent(225, 119, addedLevels), talent(226, 0, addedLevels), talent(230, 1, addedLevels)]
});

const renderTalents = ({ addedLevels, cap }) => render(
  <ThemeProvider theme={darkTheme}>
    <Talents
      talents={{ 0: royalGuardianPage(Math.min(addedLevels, cap)) }}
      starTalents={{ orderedTalents: [] }}
      addedLevels={addedLevels}
      addedLevelsBreakdown={{ statName: 'Added levels', totalValue: addedLevels, categories: [] }}
      selectedTalentPreset={0}
      maxBookLv={396}
      account={{ royalGuardian: { armory: { upgrades: [{ index: 55, bonus: cap }] } } }}
    />
  </ThemeProvider>
);

describe('Talents tab', () => {
  it('counts the points invested, not the added levels on top of them', () => {
    renderTalents({ addedLevels: 237, cap: 300 });

    expect(screen.getByText('Total Points Spent: 120')).toBeTruthy();
  });

  it('shows the added levels a Royal Guardian talent actually receives', () => {
    renderTalents({ addedLevels: 237, cap: 50 });

    expect(screen.getByText('Added levels: 50')).toBeTruthy();
  });

  it('shows no added levels without the Talent Reattainment upgrade', () => {
    renderTalents({ addedLevels: 237, cap: 0 });

    expect(screen.getByText('Added levels: 0')).toBeTruthy();
  });
});
