// @vitest-environment jsdom
// The suite default is `node` (vitest.config.js); this file renders a component.
import '../../polyfills';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Timer from '@components/common/Timer';

/**
 * `lastUpdated` is the moment the save was taken; the Timer measures how much real time has passed
 * since, and shifts the countdown by it. With no save there is no such moment, and the old
 * `lastUpdated ?? 0` measured from the epoch instead - about 56.6 years - so every timer on a page
 * rendered "20660d:12h:51m" to a signed-out visitor. Three routes shipped that way (dashboard, pets,
 * breeding).
 *
 * It is a finite, well-formed number, which is exactly why no NaN gate ever saw it.
 */
describe('Timer with no save loaded', () => {
  const HOUR = 3600_000;

  // The component reads the clock itself, so a test computing its expected duration from a second
  // Date.now() lands a millisecond later and turns "4h" into "3h:59m:59s". Freeze it instead of
  // loosening the assertions, which is what makes exact durations checkable at all.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('counts down from the target date rather than from the epoch', () => {
    render(<Timer type={'countdown'} date={Date.now() + 3 * HOUR}/>);
    const text = document.body.textContent;
    expect(text).not.toMatch(/\d{4,}d:/);
    // Three hours out, so it should report no whole days at all.
    expect(text).toBe('03h:00m:00s');
  });

  it('does not render an epoch-sized duration for a date days out', () => {
    render(<Timer type={'countdown'} date={Date.now() + 7 * 24 * HOUR}/>);
    expect(document.body.textContent).not.toMatch(/\d{4,}d:/);
    expect(document.body.textContent).toBe('07d:00h:00m');
  });

  it('still shifts by elapsed time when a real lastUpdated is given', () => {
    // A save taken two hours ago against a target six hours out leaves four hours on the clock -
    // the behaviour for a signed-in visitor, which must be untouched by the no-save guard.
    render(<Timer type={'countdown'} date={Date.now() + 6 * HOUR} lastUpdated={Date.now() - 2 * HOUR}/>);
    expect(document.body.textContent).toBe('04h:00m:00s');
  });

  it('renders the placeholder for a target already in the past', () => {
    render(<Timer type={'countdown'} date={Date.now() - HOUR} placeholder={'Go claim!'}/>);
    expect(screen.getByText('Go claim!')).toBeDefined();
  });
});
