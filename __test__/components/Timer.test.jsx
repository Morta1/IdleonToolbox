// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import Timer from '@components/common/Timer';

describe('Timer with no save loaded', () => {
  const HOUR = 3600_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });
  // Explicit: with isolate:false the RTL module (and so its auto-cleanup hook) is shared between
  // test files, and these assertions read the whole body, so a leftover render from the previous
  // case would be counted as this one's output.
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

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

  // Read from this render's container, never from `screen`: with isolate:false the shared
  // testing-library module binds `screen` to the first jsdom's body, stale in every later file.
  it('renders the placeholder for a target already in the past', () => {
    const { container } = render(<Timer type={'countdown'} date={Date.now() - HOUR} placeholder={'Go claim!'}/>);
    expect(container.textContent).toBe('Go claim!');
  });
});
