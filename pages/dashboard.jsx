import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box, Stack, ToggleButton, ToggleButtonGroup, useMediaQuery } from '@mui/material';
import Characters from '../components/dashboard/Characters';
import Account from '../components/dashboard/Account';
import SettingsIcon from '@mui/icons-material/Settings';
import { isProd, migrateConfig, tryToParse } from '@utility/helpers';
import Etc from '../components/dashboard/Etc';
import { NextSeo } from 'next-seo';
import { getRawShopItems } from '@parsers/shops';
import { Adsense } from '@ctrl/react-adsense';
import DashboardSettings from '../components/common/DashboardSettings';
import { CONTENT_PERCENT_SIZE } from '@utility/consts';
import Button from '@mui/material/Button';

const baseTrackers = {
  version: 1,
  account: {
    General: {
      tasks: {
        checked: true,
        options: [{
          name: 'tasks',
          type: 'array',
          category: 'Worlds',
          props: { value: [1, 2, 3, 4].toSimpleObject() },
          checked: true
        }]
      },
      materialTracker: {
        checked: true, options: []
      },
      guild: { checked: true, options: [{ name: 'daily', checked: true }, { name: 'weekly', checked: true }] },
      shops: {
        checked: true,
        options: [{
          name: 'shops', type: 'array', props: { value: getRawShopItems(), type: 'img' }, checked: true
        }]
      },
      etc: {
        checked: true,
        options: [
          { name: 'dungeonTraits', checked: true },
          { name: 'randomEvents', checked: true },
          { name: 'keys', checked: true },
          {
            name: 'miniBosses',
            type: 'input',
            props: { label: 'Bosses threshold', value: 2, minValue: 2 },
            checked: true
          },
          { name: 'newCharacters', checked: true },
          { name: 'gemsFromBosses', checked: true }
        ]
      }
    },
    'World 1': {
      stamps: {
        checked: true,
        options: [{ name: 'gildedStamps', checked: true }]
      }
    },
    'World 2': {
      alchemy: {
        checked: true,
        options: [
          { name: 'bargainTag', checked: true },
          { name: 'sigils', checked: true },
          {
            name: 'liquids',
            category: 'liquids',
            type: 'input',
            props: { label: 'Liquid percent', value: 90, maxValue: 100, minValue: 0 },
            checked: true
          },
          { name: 'vials', category: 'vials', checked: true },
          { name: 'vialsAttempts', checked: true },
          { name: 'subtractGreenStacks', checked: true },
          { name: 'alternateParticles', checked: true }
        ]
      },
      islands: {
        checked: true,
        options: [
          {
            name: 'unclaimedDays',
            type: 'input',
            props: { label: 'Threshold', value: 1, minValue: 1 },
            checked: true
          },
          { name: 'shimmerIsland', checked: true }
        ]
      },
      postOffice: {
        checked: true,
        options: [
          {
            name: 'dailyShipments', type: 'array',
            category: 'dailyShipments', checked: true, props: { value: [1, 2, 3, 4, 5, 6].toSimpleObject() }
          },
          { name: 'showAlertOnlyWhen0Shields', checked: false, helperText: 'Daily shipments alert' }
        ]
      },
      arcade: { checked: true, options: [{ name: 'balls', checked: true }] },
      weeklyBosses: { checked: true, options: [] },
      killRoy: { checked: true, options: [] }
    },
    'World 3': {
      printer: {
        checked: true,
        options: [
          { name: 'includeOakAndCopper', category: 'atoms', checked: false },
          { name: 'showAlertWhenFull', checked: false }]
      },
      library: {
        checked: true,
        options: [{ name: 'books', checked: true }]
      },
      construction: {
        checked: true, options: [
          { name: 'flags', checked: true },
          { name: 'buildings', checked: true },
          { name: 'materials', category: 'refinery', checked: true },
          { name: 'rankUp', checked: true }
        ]
      },
      equinox: {
        checked: true, options: [
          { name: 'bar', checked: true },
          { name: 'challenges', checked: true },
          { name: 'foodLust', checked: true }
        ]
      },
      atomCollider: {
        checked: true, options: [{
          name: 'stampReducer',
          type: 'input',
          props: { label: 'Threshold', value: 90, maxValue: 90, minValue: 0, endAdornment: '%' },
          checked: true
        }]
      }
    },
    'World 4': {
      breeding: {
        checked: true,
        options: [
          { name: 'eggs', checked: true },
          {
            name: 'eggsRarity',
            type: 'input',
            props: {
              label: 'Eggs rarity',
              value: 1,
              minValue: 1,
              helperText: '1=Copper, 2=Iron, 3=Gold'
            },
            checked: false
          },
          { name: 'shinies', type: 'input', props: { label: 'Level threshold', value: 5 }, checked: true }
        ]
      },
      cooking: { checked: true, options: [{ name: 'spices', checked: true }] }
    },
    'World 5': {
      gaming: {
        checked: true, options: [
          { name: 'sprouts', checked: true },
          {
            name: 'squirrel',
            type: 'input',
            props: { label: 'Hours threshold', value: 1, minValue: 1 },
            checked: true
          },
          { name: 'shovel', type: 'input', props: { label: 'Hours threshold', value: 1, minValue: 1 }, checked: true }
        ]
      },
      sailing: { checked: true, options: [{ name: 'captains', checked: true }, { name: 'chests', checked: true }] }
    },
    'World 6': {
      sneaking: {
        checked: true,
        options: [
          {
            name: 'lastLooted',
            type: 'input',
            props: { label: 'Last looted', value: 120, minValue: 0, helperText: 'in minutes' },
            checked: true
          }
        ]
      },
      farming: {
        checked: true,
        options: [
          {
            name: 'plots',
            type: 'input',
            props: { label: 'OG Threshold', value: 0, minValue: 0, helperText: '1=x2, 2=x4, 3=x8, 4=x16' },
            checked: true
          },
          {
            name: 'totalCrops',
            type: 'input',
            props: { label: 'Crop Threshold', value: 1, minValue: 1, helperText: '' },
            checked: false
          },
          { name: 'missingPlots', checked: true }
        ]
      },
      summoning: {
        checked: true, options: [
          {
            name: 'familiar',
            checked: true,
            type: 'input',
            props: { label: 'Threshold', value: 10, minValue: 0, helperText: '' }
          }
        ]
      }
    }
  },
  characters: {
    cards: { checked: true, options: [{ name: 'cardSet', checked: true }] },
    anvil: {
      checked: true,
      options: [
        { name: 'unspentPoints', checked: true },
        { name: 'missingHammers', checked: true },
        { name: 'anvilOverdue', checked: true },
        { name: 'showAlertBeforeFull', checked: true, category: 'anvil overdue' }
      ]
    },
    worship: {
      checked: true,
      options: [{ name: 'unendingEnergy', checked: true }, { name: 'chargeOverdue', checked: true }]
    },
    traps: {
      checked: true,
      options: [{ name: 'missingTraps', checked: true }, { name: 'trapsOverdue', checked: true }]
    },
    alchemy: { checked: true, options: [{ name: 'missingBubbles', checked: true }] },
    obols: { checked: true, options: [{ name: 'missingObols', checked: true }] },
    postOffice: {
      checked: true,
      options: [{
        name: 'unspentPoints',
        checked: true,
        type: 'input',
        props: { label: 'Number of boxes', value: 1 }
      }]
    },
    starSigns: { checked: true, options: [{ name: 'missingStarSigns', checked: true }] },
    crystalCountdown: {
      checked: true, options: [
        { name: 'showMaxed', checked: true },
        { name: 'showNonMaxed', checked: false }
      ]
    },
    tools: { checked: true, options: [] },
    divinityStyle: { checked: true, options: [] },
    talents: {
      checked: true,
      options: [{
        name: 'talents',
        type: 'array',
        category: 'cooldowns',
        checked: true,
        props: {
          value: {
            printerGoBrrr: true,
            refineryThrottle: true,
            craniumCooking: true,
            'itsYourBirthday!': true,
            voidTrialRerun: true,
            arenaSpirit: true,
            tasteTest: true
          }
        }
      }, {
        category: 'Misc',
        name: 'alwaysShowTalents',
        checked: false
      }]
    },
    equipment: { checked: true, options: [{ name: 'availableUpgradesSlots', checked: true }] }
  }
}

const Dashboard = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState();
  const [filters, setFilters] = React.useState(tryToParse(localStorage.getItem('dashboard-filters')) || ['account',
    'characters', 'timers']);
  const showWideSideBanner = useMediaQuery('(min-width: 1600px)', { noSsr: true });
  const showNarrowSideBanner = useMediaQuery('(min-width: 850px)', { noSsr: true });

  useEffect(() => {
    const finalAccountTrackers = migrateConfig('account', baseTrackers?.account, state?.trackers?.account, baseTrackers?.version, state?.trackers?.version);
    const finalCharactersTrackers = migrateConfig('characters', baseTrackers?.characters, state?.trackers?.characters, baseTrackers?.version, state?.trackers?.version);
    setConfig({
      account: finalAccountTrackers,
      characters: finalCharactersTrackers
    })
  }, []);

  const handleConfigChange = (updatedConfig) => {
    setConfig(updatedConfig);
    dispatch({ type: 'trackers', data: updatedConfig })
  }

  const handleFilters = (event, newFilters) => {
    if (newFilters.length === 0) return;
    setFilters(newFilters);
    localStorage.setItem('dashboard-filters', JSON.stringify(newFilters));
  };

  const isDisplayed = (filter) => {
    return filters.includes(filter)
  }

  const handleFileUpload = (data) => {
    setConfig(data);
    dispatch({ type: 'trackers', data });
  }

  return <>
    <NextSeo
      title="Dashboard | Idleon Toolbox"
      description="Provides key information about your account and alerts you when there are unfinished tasks"
    />
    <Stack direction="row" gap={2} justifyContent={'space-between'}>
      <Stack sx={{ maxWidth: !showNarrowSideBanner && !showWideSideBanner ? '100%' : CONTENT_PERCENT_SIZE }}>
        <Stack mb={1} direction={'row'} alignItems={'center'} gap={3} flexWrap={'wrap'}>
          <ToggleButtonGroup value={filters} onChange={handleFilters}>
            <ToggleButton sx={{ textTransform: 'none' }} value="account">Account</ToggleButton>
            <ToggleButton sx={{ textTransform: 'none' }} value="characters">Characters</ToggleButton>
            <ToggleButton sx={{ textTransform: 'none' }} value="timers">Timers</ToggleButton>
          </ToggleButtonGroup>
          <Button variant={'outlined'} sx={{ textTransform: 'none' }} startIcon={<SettingsIcon/>}
                  onClick={() => setOpen(true)}>
            Configure alerts
          </Button>
        </Stack>
        <Stack gap={2}>
          {isDisplayed('account') ? <Account trackers={config?.account} characters={characters}
                                             account={account} lastUpdated={lastUpdated}/> : null}
          {isDisplayed('characters') ? <Characters trackers={config?.characters} characters={characters}
                                                   account={account} lastUpdated={lastUpdated}/> : null}
          {isDisplayed('timers') ? <Etc characters={characters} account={account} lastUpdated={lastUpdated}/> : null}
        </Stack>
      </Stack>
      <DashboardSettings onFileUpload={handleFileUpload} onChange={handleConfigChange} open={open}
                         onClose={() => setOpen(false)} config={config}/>
      {showWideSideBanner || showNarrowSideBanner ? <Box
        sx={{
          backgroundColor: isProd ? '' : '#d73333',
          width: showWideSideBanner ? 300 : showNarrowSideBanner ? 160 : 0,
          height: 600,
          position: 'sticky',
          top: 100
        }}>
        {showWideSideBanner ? <Adsense
          client="ca-pub-1842647313167572"
          slot="2700532291"
        /> : null}
        {showNarrowSideBanner && !showWideSideBanner ? <Adsense
          client="ca-pub-1842647313167572"
          slot="8040203474"
        /> : null}
      </Box> : null}
    </Stack>
  </>
};

export default Dashboard;
