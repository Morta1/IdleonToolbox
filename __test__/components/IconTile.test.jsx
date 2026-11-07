// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import IconTile from '@components/common/cards/IconTile';
import theme from '../../styles/theme/theme';

const renderTile = (props) => render(<ThemeProvider theme={theme}><IconTile icon={'data/Hat1.png'} alt={'Hat'} {...props}/></ThemeProvider>);
const tileText = (props) => renderTile(props).container.textContent;
// The images in paint order: a later one draws over an earlier one
const paintOrder = (props) => [...renderTile(props).container.querySelectorAll('img')].map((img) => img.getAttribute('src').split('/').pop());

describe('IconTile', () => {
  // A collection's tile names its sprite under it; an empty slot has nothing to name
  it.each([
    ['a label and a value', { label: 'Invisible Hat', value: '125' }, 'Invisible Hat125'],
    ['a value alone', { value: '125' }, '125'],
    ['a label on an empty slot', { label: 'Invisible Hat', status: 'empty' }, '']
  ])('draws %s', (_, props, expected) => {
    expect(tileText(props)).toBe(expected);
  });

  // A frame sits behind its sprite, except a border the sprite would hide (a super talent's), which goes over it
  it.each([
    ['behind the sprite', {}, ['Border.png', 'Hat1.png']],
    ['over the sprite with frameAbove', { frameAbove: true }, ['Hat1.png', 'Border.png']]
  ])('draws a frame %s', (_, props, expected) => {
    expect(paintOrder({ frame: 'etc/Border.png', ...props })).toEqual(expected);
  });
});
