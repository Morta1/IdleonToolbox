// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import DashboardSettings from '@components/common/DashboardSettings';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/', isReady: true }) }));

const config = {
  account: {
    'World 5': {
      sailing: {
        checked: true,
        options: [
          { name: 'captains', checked: true },
          { name: 'alwaysAlertEnderCaptains', checked: false }
        ]
      }
    }
  },
  characters: {},
  timers: {}
};

describe('dashboard settings ender captains event', () => {
  it('sends a GA event with the new state when the toggle flips', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    Element.prototype.scrollIntoView = () => {};
    render(<ThemeProvider theme={darkTheme}>
      <DashboardSettings open config={config} onChange={() => {}} onClose={() => {}}
                         target={{ configType: 'account', path: 'World 5.sailing.alwaysAlertEnderCaptains' }}/>
    </ThemeProvider>);

    fireEvent.click(screen.getByLabelText('Always Alert Ender Captains'));
    expect(gtag).toHaveBeenCalledWith('event', 'dashboard_ender_captains_toggled',
      expect.objectContaining({ enabled: true }));

    fireEvent.click(screen.getByLabelText('Captains'));
    expect(gtag).toHaveBeenCalledTimes(1);
    delete window.gtag;
  });
});
