// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import darkTheme from '../../styles/theme/darkTheme';

const renderCard = (ui) => render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

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
