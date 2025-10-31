import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box, Stack, ToggleButton, ToggleButtonGroup, useMediaQuery } from '@mui/material';
import Characters from '../components/dashboard/Characters';
import Account from '../components/dashboard/Account';
import { isProd, tryToParse } from '@utility/helpers';
import Etc from '../components/dashboard/Etc';
import { NextSeo } from 'next-seo';
import { getRawShopItems } from '@parsers/shops';
import { Adsense } from '@ctrl/react-adsense';
import DashboardSettings from '../components/common/DashboardSettings';
import { CONTENT_PERCENT_SIZE } from '@utility/consts';
import Button from '@mui/material/Button';
import { migrateConfig } from '@utility/migrations';
import { IconSettingsFilled } from '@tabler/icons-react';
import { getPrinterExclusions } from '@parsers/printer';
import { getCrystalCountdownSkills } from '@parsers/talents';

const baseTrackers = {
  version: 26,
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
      materialTracker: { checked: true, options: [] },
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
          { name: 'gemsFromBosses', checked: true },
          { name: 'familyObols', checked: true },
          { name: 'freeCompanion', checked: true }
        ]
      }
    },
    'World 1': {
      stamps: {
        checked: true,
        options: [{ name: 'gildedStamps', checked: true }, { name: 'showGildedWhenNoAtomDiscount', checked: false }]
      },
      owl: {
        checked: true,
        options: [{ name: 'featherRestart', checked: true }, { name: 'megaFeatherRestart', checked: true }]
      },
      forge: {
        checked: true,
        options: [{ name: 'emptySlots', checked: true }]
      }
    },
    'World 2': {
      alchemy: {
        checked: true,
        options: [
          { name: 'bargainTag', checked: true, category: 'liquidShop' },
          { name: 'gems', checked: true },
          { name: 'sigils', checked: true, category: 'sigils' },
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
          { name: 'shimmerIsland', checked: true },
          { name: 'garbageUpgrade', checked: true }
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
      killRoy: {
        checked: true,
        options: [
          { name: 'general', checked: true, helperText: 'Alert when Killroy is available' },
          { name: 'underHundredKills', checked: true, helperText: 'Alert when current Killroy has monsters below 100 kills (for equinox)' }
        ]
      },
      kangaroo: {
        checked: true,
        options: [
          {
            name: 'shinyThreshold',
            type: 'input',
            props: { label: 'Shiny Catch %', value: 100, minValue: 100 },
            checked: true
          },
          { name: 'fisherooReset', checked: true },
          { name: 'greatestCatch', checked: true }]
      }
    },
    'World 3': {
      printer: {
        checked: true,
        options: [
          {
            name: 'includeResource',
            type: 'array',
            props: { value: getPrinterExclusions(), type: 'img' },
            checked: true,
            category: 'atoms',
            helperText: 'Exclude'
          },
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
      },
      traps: {
        checked: true,
        options: [{ name: 'trapsOverdue', checked: true }]
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
              helperText: '1=Base, 2=Copper, 3=Iron'
            },
            checked: false
          },
          { name: 'shinies', type: 'input', props: { label: 'Level threshold', value: 5 }, checked: true },
          { name: 'breedability', type: 'input', props: { label: 'Level threshold', value: 5 }, checked: true }
        ]
      },
      cooking: {
        checked: true,
        options: [
          { name: 'spices', checked: true },
          {
            name: 'ribbons',
            type: 'input',
            props: {
              label: 'Ribbons threshold',
              value: 0,
              maxValue: 28,
              minValue: 0,
              helperText: 'Empty ribbon slots'
            },
            checked: true
          },
          { name: 'meals', checked: true, category: 'meals' },
          { name: 'alertOnlyCookedMeal', checked: false }
        ]
      },
      laboratory: {
        checked: true, options: [
          { name: 'chipsRotation', checked: true },
          { name: 'jewelsRotation', checked: true }
        ]
      }
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
      sailing: { checked: true, options: [{ name: 'captains', checked: true }, { name: 'chests', checked: true }] },
      hole: {
        checked: true,
        options: [
          {
            name: 'buckets', type: 'input',
            props: { label: 'Sediment threshold', value: 1000, minValue: 1, helperText: 'Set 0 for max' },
            checked: true
          },
          { name: 'motherlode', checked: true },
          {
            name: 'bravery',
            checked: true,
            type: 'input',
            props: { label: 'Reward multi threshold', value: 1, minValue: 1, helperText: '' }
          },
          { name: 'theWell', checked: true },
          {
            name: 'theHarp',
            checked: true,
            type: 'input',
            props: { label: 'Power threshold', value: 100, minValue: 1, helperText: '%' }
          },
          { name: 'theHive', checked: true },
          { name: 'grotto', checked: true },
          {
            name: 'justice',
            checked: true,
            type: 'input',
            props: { label: 'Reward multi threshold', value: 1, minValue: 1, helperText: '' }
          },
          { name: 'villagersLevelUp', checked: true },
          {
            name: 'wisdom',
            checked: true,
            type: 'input',
            props: { label: 'Reward multi threshold', value: 1, minValue: 1, helperText: '' }
          },
          {
            name: 'jars',
            checked: true,
            type: 'input',
            props: { label: 'Jars threshold', value: 120, minValue: 1, maxValue: 120, helperText: 'Max of 120 jars' }
          },
          { name: 'studyLevelUp', checked: true }
        ]
      }
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
          { name: 'missingPlots', checked: true },
          {
            name: 'beanTrade',
            type: 'input',
            props: { label: 'Bean trade value', value: 1, minValue: 1, helperText: '' },
            checked: false
          }
        ]
      },
      summoning: {
        checked: true,
        options: [
          {
            name: 'familiar',
            checked: true,
            type: 'input',
            props: { label: 'Threshold', value: 10, minValue: 0, helperText: '' }
          },
          { name: 'battleAttempts', checked: true }
        ]
      },
      etc: {
        checked: true,
        options: [
          {
            name: 'emperor',
            type: 'input',
            props: { label: 'Attempts', value: 20 },
            checked: true
          }
        ]
      }
    },
    'World 7': {
      // Placeholder for future World 7 systems
    }
  },
  characters: {
    cards: { checked: true, options: [{ name: 'cardSet', checked: true }] },
    anvil: {
      checked: true,
      options: [
        {
          name: 'unspentPoints',
          type: 'input',
          props: { label: 'Points Threshold', value: 1, minValue: 1, helperText: '' },
          checked: true
        },
        { name: 'missingHammers', checked: true },
        {
          name: 'anvilOverdue',
          type: 'input',
          props: { label: 'Minutes', value: 30, minValue: 1, helperText: 'alert X minutes before' },
          checked: true
        }
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
        { name: 'showNonMaxed', checked: true },
        {
          category: 'skills',
          name: 'skills',
          type: 'array',
          props: { value: getCrystalCountdownSkills(), type: 'img' },
          checked: true
        }
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
    equipment: { checked: true, options: [{ name: 'availableUpgradesSlots', checked: true }] },
    classSpecific: {
      checked: true,
      options: [
        { name: 'wrongItems', checked: true, helperText: 'Alert when using class-specific form items while outside form' },
        { name: 'betterWeapon', checked: true, helperText: 'Alert when there\'s a better form class-specific weapon in your inventory' }
      ]
    }
  },
  timers: {
    General: {
      daily: { checked: true, options: [] },
      weekly: { checked: true, options: [] },
      companions: { checked: true, options: [] },
      syphonCharge: { checked: true, options: [] },
      closestFullWorship: { checked: true, options: [] },
      dungeonHappyHour: { checked: true, options: [] },
      randomEvents: { checked: true, options: [] },
      sailingTrades: { checked: true, options: [] }
    },
    Etc: {
      library: { checked: true, options: [] },
      minibosses: { checked: true, options: [] }
    },
    'World 1': {
      featherRestart: { checked: true, options: [] },
      megaFeatherRestart: { checked: true, options: [] }
    },
    'World 2': {
      fisherooReset: { checked: true, options: [] },
      greatestCatch: { checked: true, options: [] }
    },
    'World 3': {
      printer: { checked: true, options: [] },
      closestTrap: { checked: true, options: [] },
      closestBuilding: { checked: true, options: [] },
      closestSalt: { checked: true, options: [] },
      equinox: { checked: true, options: [] }
    },
    'World 5': {
      monument: { checked: true, options: [] },
      justice: { checked: true, options: [] },
      wisdom: { checked: true, options: [] }
    }
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
    const migratedConfig = migrateConfig(baseTrackers, state?.trackers);
    setConfig({
      account: migratedConfig.account,
      characters: migratedConfig.characters,
      timers: migratedConfig.timers,
      version: baseTrackers?.version
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
    const migratedConfig = migrateConfig(baseTrackers, data);
    setConfig(migratedConfig);
    dispatch({ type: 'trackers', data: migratedConfig });
  }

  return <>
    <NextSeo
      title="Dashboard | Idleon Toolbox"
      description="Provides key information about your account and alerts you when there are unfinished tasks"
    />
    <Stack direction="row" gap={2} justifyContent={'space-between'}>
      <Stack sx={{ maxWidth: !showNarrowSideBanner && !showWideSideBanner ? '100%' : CONTENT_PERCENT_SIZE }}>
        <Stack mb={2} direction={'row'} alignItems={'center'} gap={3} flexWrap={'wrap'}>
          <ToggleButtonGroup value={filters} onChange={handleFilters}>
            <ToggleButton value="account">Account</ToggleButton>
            <ToggleButton value="characters">Characters</ToggleButton>
            <ToggleButton value="timers">Timers</ToggleButton>
          </ToggleButtonGroup>
          <Button variant={'outlined'} sx={{ textTransform: 'none', height: 32 }}
            startIcon={<IconSettingsFilled size={20} />}
            onClick={() => setOpen(true)}>
            Configure alerts
          </Button>
        </Stack>
        <Stack gap={2}>
          {isDisplayed('account') ? <Account trackers={config?.account} characters={characters}
            account={account} lastUpdated={lastUpdated} /> : null}
          {isDisplayed('characters') ? <Characters trackers={config?.characters} characters={characters}
            account={account} lastUpdated={lastUpdated} /> : null}
          {isDisplayed('timers') ? <Etc characters={characters} account={account} trackers={config?.timers}
            lastUpdated={lastUpdated} /> : null}
        </Stack>
      </Stack>
      <DashboardSettings onFileUpload={handleFileUpload} onChange={handleConfigChange} open={open}
        onClose={() => setOpen(false)} config={config} />
      {showWideSideBanner || showNarrowSideBanner ? <Box
        sx={{
          backgroundColor: isProd ? '' : '#d73333',
          width: showWideSideBanner ? 300 : showNarrowSideBanner ? 160 : 0,
          height: 600,
          position: 'sticky',
          top: 100
        }}>
        {isProd && showWideSideBanner ? <Adsense
          client="ca-pub-1842647313167572"
          slot="2700532291"
        /> : null}
        {isProd && showNarrowSideBanner && !showWideSideBanner ? <Adsense
          client="ca-pub-1842647313167572"
          slot="8040203474"
        /> : null}
      </Box> : null}
    </Stack>
  </>
};

export default Dashboard;
