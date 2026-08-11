// @vitest-environment jsdom
// The suite default is `node` (vitest.config.js); this file renders a component.
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import darkTheme from '../../styles/theme/darkTheme';

// The card renders a MUI Tooltip, which reads theme.typography.pxToRem - it cannot mount without a
// theme in context.
const renderCard = (ui) => render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

/**
 * `CardTitleAndValue` gated its value on truthiness, so a numeric 0 rendered a card with a title and
 * an empty body - on every stat sitting at zero, which for a signed-out visitor is every stat on
 * every page. It is used in ~600 places, so the distinction between "zero" and "absent" is pinned
 * here rather than left to whichever page happened to notice.
 */
describe('CardTitleAndValue', () => {
  it('renders a numeric 0 as "0", not as an empty card', () => {
    renderCard(<CardTitleAndValue title={'Unlocked caverns'} value={0}/>);
    expect(screen.getByText('Unlocked caverns')).toBeDefined();
    expect(screen.getByText('0')).toBeDefined();
  });

  it('renders a 0 alongside an icon', () => {
    renderCard(<CardTitleAndValue title={'Opals invested'} value={0} icon={'data/Opal.png'}/>);
    expect(screen.getByText('0')).toBeDefined();
  });

  it('falls back to children when the value is genuinely absent', () => {
    for (const absent of [undefined, null, '']) {
      const { unmount } = renderCard(
        <CardTitleAndValue title={'Reef Day Gains'} value={absent}><span>from children</span></CardTitleAndValue>
      );
      expect(screen.getByText('from children')).toBeDefined();
      unmount();
    }
  });

  it('does not render children when the value is 0', () => {
    renderCard(<CardTitleAndValue title={'Level'} value={0}><span>from children</span></CardTitleAndValue>);
    expect(screen.queryByText('from children')).toBeNull();
    expect(screen.getByText('0')).toBeDefined();
  });

  it('still renders a non-zero value', () => {
    renderCard(<CardTitleAndValue title={'Rocks'} value={'1.2K'}/>);
    expect(screen.getByText('1.2K')).toBeDefined();
  });
});
