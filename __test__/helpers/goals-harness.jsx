import React, { useEffect } from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { AppContext } from '@components/common/context/AppProvider';
import { GoalsProvider, useGoals } from '@components/goals/GoalsProvider';
import { GOALS_STORAGE_KEY } from '@utility/goals/store';
import SnackbarHost from '@components/common/Overlays/SnackbarHost';

const ACCOUNT_KEY = 'uid-test';

// The tree a goals component runs under on the site. `api` always holds the latest useGoals() value.
export const goalsHarness = ({ account, characters }) => {
  const api = {};
  const Probe = () => {
    const value = useGoals();
    useEffect(() => {
      Object.assign(api, value);
    });
    return null;
  };
  const mount = (ui, state = {}) => render(
    <ThemeProvider theme={theme}>
      <AppContext.Provider value={{ state: { uid: ACCOUNT_KEY, account, characters, ...state }, dispatch: () => {} }}>
        <GoalsProvider>
          <Probe/>
          {ui}
          <SnackbarHost/>
        </GoalsProvider>
      </AppContext.Provider>
    </ThemeProvider>
  );
  const seed = (...goals) => localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { [ACCOUNT_KEY]: goals } }));
  return { api, mount, seed };
};
