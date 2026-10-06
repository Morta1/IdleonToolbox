import React, { useContext, useEffect, useState } from 'react';
import { AppContext, writeStored } from '@components/common/context/AppProvider';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Characters from '../components/dashboard/Characters';
import Account from '../components/dashboard/Account';
import { tryToParse } from '@utility/helpers';
import Etc from '../components/dashboard/Etc';
import { NextSeo } from 'next-seo';
import DashboardSettings from '../components/common/DashboardSettings';
import { DashboardSettingsProvider } from '@components/common/context/DashboardSettingsProvider';
import Button from '@mui/material/Button';
import { IconSettingsFilled } from '@tabler/icons-react';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { LEGACY_BACKUP_KEY, loadTrackers, toStoredTrackers } from '@utility/dashboard/trackerStore';

const Dashboard = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const [open, setOpen] = useState(false);
  // Set when the modal is opened by clicking an alert, so it lands on that alert's own setting.
  const [settingsTarget, setSettingsTarget] = useState(null);
  const [initialLoad] = useState(() => loadTrackers(baseTrackers, state?.trackers));
  const [config, setConfig] = useState(initialLoad.config);
  // Set when the stored config could not be converted: keep saving it the pre-R1 way.
  const [legacyMode, setLegacyMode] = useState(initialLoad.status === 'failed');

  useEffect(() => {
    if (initialLoad.status === 'converted') {
      if (!readLocalStorageValue({ key: LEGACY_BACKUP_KEY })) writeStored(LEGACY_BACKUP_KEY, initialLoad.legacy);
      dispatch({ type: 'trackers', data: initialLoad.stored });
    } else if (initialLoad.status === 'failed' && typeof window.gtag !== 'undefined') {
      window.gtag('event', 'dashboard_config_conversion_failed', {
        event_category: 'dashboard',
        event_label: String(initialLoad.error?.message ?? '').slice(0, 100)
      });
    }
    // Runs once: initialLoad never changes after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    dispatch({ type: 'trackers', data: legacyMode ? updatedConfig : toStoredTrackers(baseTrackers, updatedConfig) });
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
    const result = loadTrackers(baseTrackers, data);
    setConfig(result.config);
    setLegacyMode(result.status === 'failed');
    dispatch({ type: 'trackers', data: result.stored ?? result.config });
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
                       exportConfig={legacyMode ? config : toStoredTrackers(baseTrackers, config)}
                       hideAlertless={hideAlertless} onHideAlertlessChange={handleHideAlertless}/>
  </>
};

export default Dashboard;
