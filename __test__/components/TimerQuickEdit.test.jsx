// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { DashboardSettingsProvider } from '@components/common/context/DashboardSettingsProvider';

const push = vi.fn();
vi.mock('next/router', () => ({ useRouter: () => ({ push, query: {}, asPath: '/' }) }));

const Etc = (await import('@components/dashboard/Etc')).default;

const trackers = { General: { daily: { checked: true, options: [] }, weekly: { checked: true, options: [] } } };

describe('timer icons', () => {
  it('open the quick edit with the timer target and do not navigate', () => {
    const onOpenAlert = vi.fn();
    const { container } = render(<ThemeProvider theme={darkTheme}>
      <DashboardSettingsProvider onOpenAlert={onOpenAlert}>
        <Etc characters={[]} account={{ finishedWorlds: {} }} trackers={trackers} lastUpdated={Date.now()}/>
      </DashboardSettingsProvider>
    </ThemeProvider>);
    const icons = [...container.querySelectorAll('[role="button"][aria-haspopup="dialog"]')];
    expect(icons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(icons[0]);
    expect(onOpenAlert).toHaveBeenCalledWith(icons[0], 'timers', 'General.daily', undefined);
    expect(push).not.toHaveBeenCalled();
  });
});
