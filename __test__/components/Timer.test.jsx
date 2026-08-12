// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Timer from '@components/common/Timer';

describe('Timer with no save loaded', () => {
  const HOUR = 3600_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('counts down from the target date rather than from the epoch', () => {
    render(<Timer type={'countdown'} date={Date.now() + 3 * HOUR}/>);
    const text = document.body.textContent;
    expect(text).not.toMatch(/\d{4,}d:/);
    expect(text).toBe('03h:00m:00s');
  });

  it('does not render an epoch-sized duration for a date days out', () => {
    render(<Timer type={'countdown'} date={Date.now() + 7 * 24 * HOUR}/>);
    expect(document.body.textContent).not.toMatch(/\d{4,}d:/);
    expect(document.body.textContent).toBe('07d:00h:00m');
  });

  it('still shifts by elapsed time when a real lastUpdated is given', () => {
    render(<Timer type={'countdown'} date={Date.now() + 6 * HOUR} lastUpdated={Date.now() - 2 * HOUR}/>);
    expect(document.body.textContent).toBe('04h:00m:00s');
  });

  it('renders the placeholder for a target already in the past', () => {
    render(<Timer type={'countdown'} date={Date.now() - HOUR} placeholder={'Go claim!'}/>);
    expect(screen.getByText('Go claim!')).toBeDefined();
  });
});
