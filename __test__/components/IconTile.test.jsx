// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import IconTile from '@components/common/cards/IconTile';
import theme from '../../styles/theme/theme';

const tileText = (props) => render(<ThemeProvider theme={theme}><IconTile icon={'data/Hat1.png'} alt={'Hat'} {...props}/></ThemeProvider>)
  .container.textContent;

describe('IconTile', () => {
  // A collection's tile names its sprite under it; an empty slot has nothing to name
  it.each([
    ['a label and a value', { label: 'Invisible Hat', value: '125' }, 'Invisible Hat125'],
    ['a value alone', { value: '125' }, '125'],
    ['a label on an empty slot', { label: 'Invisible Hat', status: 'empty' }, '']
  ])('draws %s', (_, props, expected) => {
    expect(tileText(props)).toBe(expected);
  });
});
