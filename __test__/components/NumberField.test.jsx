// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import NumberField from '@components/common/NumberField';
import darkTheme from '../../styles/theme/darkTheme';

const renderField = (props) => {
  const onChange = vi.fn();
  render(<ThemeProvider theme={darkTheme}><NumberField label="Threshold" onChange={onChange} {...props}/></ThemeProvider>);
  return { onChange, input: screen.getByLabelText('Threshold') };
};

describe('NumberField', () => {
  it('is a text field, so neither a spinner nor the mouse wheel can change it', () => {
    const { input } = renderField({ value: 75 });
    expect([input.getAttribute('type'), input.getAttribute('inputmode')]).toEqual(['text', 'decimal']);
  });

  it('reads game notation and shows the value it read', () => {
    const { onChange, input } = renderField({ value: null });
    fireEvent.change(input, { target: { value: '1.5B' } });
    expect(onChange).toHaveBeenLastCalledWith(1.5e9);
    expect(screen.getByText('= 1,500,000,000')).toBeDefined();
  });

  it('names the limit a value crossed and takes it when the field is left', () => {
    const { onChange, input } = renderField({ value: 75, min: 0, max: 100 });
    expect(screen.getByText('0 to 100')).toBeDefined();
    fireEvent.change(input, { target: { value: '140' } });
    expect(screen.getByText('Up to 100')).toBeDefined();
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('leaves an empty field to the default, which the placeholder shows', () => {
    const { onChange, input } = renderField({ value: 75, defaultValue: 75 });
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input.getAttribute('placeholder')).toBe('75 (default)');
  });

  // "1,234" minus its last digit is "1,23", which parseShorthandNumber reads as the decimal 1.23.
  it('edits the digits without grouping, so deleting one never reads as a decimal comma', () => {
    const { onChange, input } = renderField({ value: 1234 });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: input.value.slice(0, -1) } });
    expect(onChange).toHaveBeenLastCalledWith(123);
  });

  it('names itself without a label, can leave the range out, and reports the value it is left with', () => {
    const onCommit = vi.fn();
    render(<ThemeProvider theme={darkTheme}>
      <NumberField ariaLabel="World 3 value" value={15} min={0} max={100} help={false} onCommit={onCommit}/>
    </ThemeProvider>);
    const input = screen.getByLabelText('World 3 value');
    expect(screen.queryByText('0 to 100')).toBeNull();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenLastCalledWith(null);
  });
});
