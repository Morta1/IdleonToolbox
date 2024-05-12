import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import Characters from '../components/dashboard/Characters';
import Account from '../components/dashboard/Account';
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from '@mui/material/IconButton';
import { isProd, removeTrackers } from '@utility/helpers';
import Etc from '../components/dashboard/Etc';
import { NextSeo } from 'next-seo';
import { getRawShopItems } from '@parsers/shops';
import { Adsense } from '@ctrl/react-adsense';
import DashboardSettings from '../components/common/DashboardSettings';
import { CONTENT_PERCENT_SIZE } from '@utility/consts';
import Timer from '@components/common/Timer';
import { CardTitleAndValue } from '@components/common/styles';
import merge from 'lodash.merge';

const baseTrackers = {
  account: {
    tasks: {
      checked: true,
      options: [{
        name: 'tasks',
        type: 'array',
        category: 'Worlds',
        props: { value: [1, 2, 3, 4, 5, 6].toSimpleObject() },
        checked: true
      }]
    },
    atomCollider: {
      checked: true, options: [{
        name: 'stampReducer',
        type: 'input',
        props: { label: 'Threshold', value: 90, maxValue: 90, minValue: 0, endAdornment: '%' },
        checked: true
      }]
    },
    arcade: { checked: true, options: [{ name: 'balls', checked: true }] },
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
        { name: 'subtractGreenStacks', checked: true }
      ]
    },
    cooking: { checked: true, options: [{ name: 'spices', checked: true }] },
    gaming: {
      checked: true, options: [
        { name: 'sprouts', checked: true },
        { name: 'squirrel', type: 'input', props: { label: 'Hours threshold', value: 1, minValue: 1 }, checked: true },
        { name: 'shovel', type: 'input', props: { label: 'Hours threshold', value: 1, minValue: 1 }, checked: true }
      ]
    },
    guild: { checked: true, options: [{ name: 'daily', checked: true }, { name: 'weekly', checked: true }] },
    sailing: { checked: true, options: [{ name: 'captains', checked: true }, { name: 'chests', checked: true }] },
    breeding: {
      checked: true,
      options: [
        { name: 'eggs', checked: true },
        { name: 'shinies', type: 'input', props: { label: 'Level threshold', value: 5 }, checked: true }
      ]
    },
    printer: {
      checked: true,
      options: [
        { name: 'includeOakAndCopper', category: 'atoms', checked: false },
        { name: 'showAlertWhenFull', checked: false }]
    },
    shops: {
      checked: true,
      options: [{
        name: 'shops', type: 'array', props: { value: getRawShopItems(), type: 'img' }, checked: true
      }]
    },
    construction: {
      checked: true, options: [
        { name: 'flags', checked: true },
        { name: 'buildings', checked: true },
        { name: 'materials', category: 'refinery', checked: true },
        { name: 'rankUp', checked: true }
      ]
    },
    postOffice: {
      checked: true, options: [{
        name: 'postOffice',
        type: 'array',
        category: 'shipments streak',
        props: { value: [1, 2, 3, 4, 5, 6].toSimpleObject() },
        checked: true
      }]
    },
    equinox: {
      checked: true, options: [
        { name: 'bar', checked: true },
        { name: 'challenges', checked: true },
        { name: 'foodLust', checked: true }
      ]
    },
    materialTracker: {
      checked: true, options: [
        { name: 'applyThresholdFromAbove', checked: false },
        { name: 'applyThresholdFromBelow', checked: true },
        { name: 'disable"CloseTo"Alert', checked: true }
      ]
    },
    farming: {
      checked: true, options: [
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
        }
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
    },
    islands: {
      checked: true,
      options: [
        {
          name: 'unclaimedDays',
          type: 'input',
          props: { label: 'Threshold', value: 1, minValue: 1 },
          checked: true
        }
      ]
    },
    etc: {
      checked: true,
      options: [
        { name: 'dungeonTraits', checked: true },
        { name: 'randomEvents', checked: true },
        { name: 'gildedStamps', checked: true },
        { name: 'keys', checked: true },
        {
          name: 'miniBosses',
          type: 'input',
          props: { label: 'Bosses threshold', value: 1, minValue: 1 },
          checked: true
        },
        { name: 'weeklyBosses', checked: true },
        { name: 'killRoy', checked: true },
        { name: 'newCharacters', checked: true }
      ]
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
    }
  }
}

const Dashboard = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState();
  const showWideSideBanner = useMediaQuery('(min-width: 1600px)', { noSsr: true });
  const showNarrowSideBanner = useMediaQuery('(min-width: 850px)', { noSsr: true });

  const dailyReset = new Date().getTime() + account?.timeAway?.ShopRestock * 1000;
  const weeklyReset = new Date().getTime() + (account?.timeAway?.ShopRestock + 86400 * account?.accountOptions?.[39]) * 1000;

  useEffect(() => {
    const finalAccountTrackers = removeTrackers('account', merge(baseTrackers?.account, state?.trackers?.account));
    const finalCharactersTrackers = removeTrackers('characters', merge(baseTrackers?.characters, state?.trackers?.characters));
    setConfig({
      account: finalAccountTrackers,
      characters: finalCharactersTrackers
    })
  }, []);
  const handleConfigChange = (updatedConfig) => {
    setConfig(updatedConfig);
    dispatch({ type: 'trackers', data: updatedConfig })
  }
  return <>
    <NextSeo
      title="Dashboard | Idleon Toolbox"
      description="Provides key information about your account and alerts you when there are unfinished tasks"
    />
    <Stack direction="row" gap={2} justifyContent={'space-between'}>
      <Stack sx={{ maxWidth: !showNarrowSideBanner && !showWideSideBanner ? '100%' : CONTENT_PERCENT_SIZE }}>
        <Stack direction={'row'} alignItems={'center'} gap={3}>
          <Typography variant={'h2'}>Dashboard</Typography>
          <IconButton title={'Configure alerts'} onClick={() => setOpen(true)}>
            <SettingsIcon/>
          </IconButton>
        </Stack>
        <Stack mb={1} mt={'4px'} gap={2} direction={'row'} flexWrap={'wrap'}>
          <CardTitleAndValue cardSx={{ my: 0 }} title={'Daily Reset'}>
            <Timer variant={'caption'} type={'countdown'} lastUpdated={lastUpdated}
                   date={dailyReset}/>
          </CardTitleAndValue>
          <CardTitleAndValue cardSx={{ my: 0 }} title={'Weekly Reset'}>
            <Timer variant={'caption'} type={'countdown'} lastUpdated={lastUpdated}
                   date={weeklyReset}/>
          </CardTitleAndValue>
        </Stack>
        <Stack gap={2}>
          <Account trackers={config?.account} characters={characters}
                   account={account} lastUpdated={lastUpdated}/>
          <Characters trackers={config?.characters} characters={characters}
                      account={account} lastUpdated={lastUpdated}/>
          <Etc characters={characters} account={account} lastUpdated={lastUpdated}/>
        </Stack>
      </Stack>
      <DashboardSettings onChange={handleConfigChange} open={open} onClose={() => setOpen(false)} config={config}/>
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
