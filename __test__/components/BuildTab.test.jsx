// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render as rtlRender } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import BuildTab from '@components/tools/builds/BuildTab';
import { SUPER_TALENT_MAX_POINTS } from '@utility/builds/superTalents';

// The shared Tooltip reads theme.typography.pxToRem, so these need a real theme.
const theme = createTheme();
const render = (ui) => rtlRender(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const talent = (skillIndex, extra = {}) => ({
  name: `TALENT_${skillIndex}`,
  skillIndex,
  description: 'Does_a_thing',
  x1: 1,
  x2: 1,
  funcX: 'add',
  y1: null,
  y2: null,
  funcY: 'txt',
  lvlUpText: '',
  level: 10,
  isActiveTalent: false,
  isSuperTalent: false,
  ...extra
});

const superBorders = (container) =>
  [...container.querySelectorAll('img')].filter((img) => img.src.includes('Super_Talent'));

describe('BuildTab super talents', () => {
  it('draws the border in view mode only for starred talents', () => {
    const { container } = render(
      <BuildTab
        createMode={false}
        tabIndex={0}
        talents={[talent(1, { isSuperTalent: true }), talent(2)]}
      />
    );
    const borders = superBorders(container);
    expect(borders).toHaveLength(1);
    expect(borders[0].src).toContain('Super_Talent_Passive_Border.png');
  });

  it('uses the active border for talents with a mana cost and cooldown', () => {
    const { container } = render(
      <BuildTab
        createMode={false}
        tabIndex={0}
        talents={[talent(1, { isSuperTalent: true, isActiveTalent: true })]}
      />
    );
    expect(superBorders(container)[0].src).toContain('Super_Talent_Active_Border.png');
  });

  it('toggles a talent on click in create mode', () => {
    const onCustomBuildChange = vi.fn();
    const { container } = render(
      <BuildTab
        createMode
        tabIndex={2}
        talents={[talent(1), talent(2)]}
        onCustomBuildChange={onCustomBuildChange}
      />
    );
    fireEvent.click(container.querySelector('img[alt="skill-icon"]').parentElement);
    expect(onCustomBuildChange).toHaveBeenCalledTimes(1);
    const { tabIndex, tabTalents } = onCustomBuildChange.mock.calls[0][0];
    expect(tabIndex).toBe(2);
    expect(tabTalents[0].isSuperTalent).toBe(true);
    expect(tabTalents[1].isSuperTalent).toBe(false);
  });

  it('unstars a talent that is already starred', () => {
    const onCustomBuildChange = vi.fn();
    const { container } = render(
      <BuildTab
        createMode
        tabIndex={0}
        talents={[talent(1, { isSuperTalent: true })]}
        superUsed={SUPER_TALENT_MAX_POINTS}
        onCustomBuildChange={onCustomBuildChange}
      />
    );
    fireEvent.click(container.querySelector('img[alt="skill-icon"]').parentElement);
    expect(onCustomBuildChange.mock.calls[0][0].tabTalents[0].isSuperTalent).toBe(false);
  });

  it('refuses to star past the point cap', () => {
    const onCustomBuildChange = vi.fn();
    const { container } = render(
      <BuildTab
        createMode
        tabIndex={0}
        talents={[talent(1)]}
        superUsed={SUPER_TALENT_MAX_POINTS}
        onCustomBuildChange={onCustomBuildChange}
      />
    );
    fireEvent.click(container.querySelector('img[alt="skill-icon"]').parentElement);
    expect(onCustomBuildChange).not.toHaveBeenCalled();
  });

  it('refuses to star a talent the game bans', () => {
    const onCustomBuildChange = vi.fn();
    const { container } = render(
      <BuildTab
        createMode
        tabIndex={0}
        talents={[talent(49)]}
        onCustomBuildChange={onCustomBuildChange}
      />
    );
    fireEvent.click(container.querySelector('img[alt="skill-icon"]').parentElement);
    expect(onCustomBuildChange).not.toHaveBeenCalled();
  });

  it('shows the point counter in create mode only', () => {
    const { container: editing } = render(
      <BuildTab createMode tabIndex={0} talents={[talent(1)]} superUsed={3}/>
    );
    expect(editing.textContent).toContain(`3/${SUPER_TALENT_MAX_POINTS}`);

    const { container: viewing } = render(
      <BuildTab createMode={false} tabIndex={0} talents={[talent(1)]} superUsed={3}/>
    );
    expect(viewing.textContent).not.toContain('Super Talent');
  });
});
