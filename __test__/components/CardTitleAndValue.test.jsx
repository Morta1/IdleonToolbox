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

  it('renders a 0 as "0" with its title, not children or an empty card', () => {
    renderCard(<CardTitleAndValue title={'Level'} value={0}><span>from children</span></CardTitleAndValue>);
    expect(screen.getByText('Level')).toBeDefined();
    expect(screen.queryByText('from children')).toBeNull();
    expect(screen.getByText('0')).toBeDefined();
  });
});
