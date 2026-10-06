import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Characters from '../components/dashboard/Characters';
import Account from '../components/dashboard/Account';
import { tryToParse } from '@utility/helpers';
import Etc from '../components/dashboard/Etc';
import { NextSeo } from 'next-seo';
import DashboardSettings from '../components/common/DashboardSettings';
import { DashboardSettingsProvider } from '@components/common/context/DashboardSettingsProvider';
import Button from '@mui/material/Button';
import { migrateConfig } from '@utility/migrations';
import { IconSettingsFilled } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { baseTrackers } from '@utility/dashboard/baseTrackers';

const Dashboard = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const [open, setOpen] = useState(false);
  // Set when the modal is opened by clicking an alert, so it lands on that alert's own setting.
  const [settingsTarget, setSettingsTarget] = useState(null);
  const [config, setConfig] = useState(() => {
    const migratedConfig = migrateConfig(baseTrackers, state?.trackers);

    return {
      account: migratedConfig.account,
      characters: migratedConfig.characters,
      timers: migratedConfig.timers,
      version: baseTrackers?.version
    };
  });
  const [filters, setFilters] = React.useState(tryToParse(localStorage.getItem('dashboard-filters')) || ['account',
    'characters', 'timers']);
  const [hideAlertless, setHideAlertless] = useLocalStorage({
    key: 'dashboard-hide-alertless',
    defaultValue: false
  });


  const handleOpenSettings = (configType, path) => {
    setSettingsTarget({ configType, path });
    setOpen(true);
  };

  const handleCloseSettings = () => {
    setOpen(false);
    setSettingsTarget(null);
  };

  const handleConfigChange = (updatedConfig) => {
    setConfig(updatedConfig);
    dispatch({ type: 'trackers', data: updatedConfig })
  }

  const handleFilters = (event, newFilters) => {
    if (newFilters.length === 0) return;
    setFilters(newFilters);
    localStorage.setItem('dashboard-filters', JSON.stringify(newFilters));
  };

  const handleHideAlertless = (checked) => {
    setHideAlertless(checked);
  };

  const isDisplayed = (filter) => {
    return filters.includes(filter)
  }

  const handleFileUpload = (data) => {
    const migratedConfig = migrateConfig(baseTrackers, data);
    setConfig(migratedConfig);
    dispatch({ type: 'trackers', data: migratedConfig });
  }

  return <>
    <NextSeo
      title="Dashboard | Idleon Toolbox"
      description="Provides key information about your account and alerts you when there are unfinished tasks"
    />
    <Stack>
      <Stack mb={2} direction={'row'} alignItems={'center'} gap={3} flexWrap={'wrap'}>
        <ToggleButtonGroup value={filters} onChange={handleFilters}>
          <ToggleButton value="account">Account</ToggleButton>
          <ToggleButton value="characters">Characters</ToggleButton>
          <ToggleButton value="timers">Timers</ToggleButton>
        </ToggleButtonGroup>
        <Button variant={'outlined'} sx={{ textTransform: 'none', height: 32 }}
                startIcon={<IconSettingsFilled size={20}/>}
                onClick={() => {
                  setSettingsTarget(null);
                  setOpen(true);
                }}>
          Configure alerts
        </Button>
      </Stack>
      <Stack gap={2}>
        <DashboardSettingsProvider onOpenSettings={handleOpenSettings}>
          {isDisplayed('account') ? <Account trackers={config?.account} characters={characters}
                                             account={account} lastUpdated={lastUpdated}/> : null}
          {isDisplayed('characters') ? <Characters trackers={config?.characters} characters={characters}
                                                   account={account} lastUpdated={lastUpdated}
                                                   hideAlertless={hideAlertless}/> : null}
          {isDisplayed('timers') ? <Etc characters={characters} account={account} trackers={config?.timers}
                                        lastUpdated={lastUpdated}/> : null}
        </DashboardSettingsProvider>
      </Stack>
    </Stack>
    <DashboardSettings onFileUpload={handleFileUpload} onChange={handleConfigChange} open={open}
                       onClose={handleCloseSettings} config={config} target={settingsTarget}
                       hideAlertless={hideAlertless} onHideAlertlessChange={handleHideAlertless}/>
  </>
};

export default Dashboard;
