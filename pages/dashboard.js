import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../components/common/context/AppProvider';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import Characters from '../components/dashboard/Characters';
import Account from '../components/dashboard/Account';
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from '@mui/material/IconButton';
import { isProd } from '../utility/helpers';
import Etc from '../components/dashboard/Etc';
import { NextSeo } from 'next-seo';
import { getRawShopItems } from '../parsers/shops';
import { Adsense } from '@ctrl/react-adsense';
import DashboardSettings from '../components/common/DashboardSettings';

const baseTrackers = {
  account: {
    tasks: {
      checked: true,
      options: [{
        name: 'tasks',
        type: 'array',
        category: 'Worlds',
        props: { value: [1, 2, 3, 4, 5].toSimpleObject() },
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
      checked: true, options: [
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
        { name: 'subtractGreenStacks', checked: true },
      ]
    },
    cooking: { checked: true, options: [{ name: 'spices', checked: true }] },
    gaming: {
      checked: true, options: [
        { name: 'sprouts', checked: true },
        { name: 'squirrel', type: 'input', props: { label: 'Hours threshold', value: 1, minValue: 1 }, checked: true },
        { name: 'shovel', type: 'input', props: { label: 'Hours threshold', value: 1, minValue: 1 }, checked: true },
      ]
    },
    guild: { checked: true, options: [{ name: 'daily', checked: true }, { name: 'weekly', checked: true }] },
    sailing: { checked: true, options: [{ name: 'captains', checked: true }] },
    breeding: {
      checked: true,
      options: [{ name: 'shinies', type: 'input', props: { label: 'Level threshold', value: 5 }, checked: true }]
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
        { name: 'foodLust', checked: true },
      ]
    },
    etc: {
      checked: true,
      options: [
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
        { name: 'killRoy', checked: true }
      ]
    }
  },
  characters: {
    anvil: {
      checked: true,
      options: [
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
      }]
    }
  }
}

const Dashboard = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(baseTrackers);
  const showWideSideBanner = useMediaQuery('(min-width: 1600px)', { noSsr: true });
  const showNarrowSideBanner = useMediaQuery('(min-width: 850px)', { noSsr: true });

  useEffect(() => {
    const accountHasDiff = state?.trackers?.account
      ? Object.keys(baseTrackers?.account).length !== Object.keys(state?.trackers?.account).length
      : true;
    const charactersHasDiff = state?.trackers?.characters
      ? Object.keys(baseTrackers?.characters).length !== Object.keys(state?.trackers?.characters).length
      : true;
    setConfig({
      account: accountHasDiff ? baseTrackers?.account : state?.trackers?.account,
      characters: charactersHasDiff ? baseTrackers?.characters : state?.trackers?.characters
    })
  }, []);

  const handleConfigChange = (updatedConfig) => {
    setConfig(updatedConfig);
    dispatch({ type: 'trackers', data: updatedConfig })
  }
  return <>
    <NextSeo
      title="Idleon Toolbox | Dashboard"
      description="Provides key information about your account and alerts you when there are unfinished tasks"
    />
    <Stack direction="row" gap={2} justifyContent={'space-between'}>
      <Stack sx={{ maxWidth: !showNarrowSideBanner && !showWideSideBanner ? '100%' : '78%' }}>
        <Stack direction={'row'} alignItems={'center'} gap={3}>
          <Typography variant={'h2'}>Dashboard</Typography>
          <IconButton title={'Configure alerts'} onClick={() => setOpen(true)}>
            <SettingsIcon/>
          </IconButton>
        </Stack>
        {/*<Typography component={'div'} variant={'caption'} mb={3} sx={{ fontSize: 15 }}>*/}
        {/*  * Please consider disabling your ad-blocker to show your support for the platform, ensuring free access to*/}
        {/*  valuable content for all users <FavoriteIcon color={'error'}*/}
        {/*                                               sx={{ fontSize: 12 }}/>*/}
        {/*</Typography>*/}
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
          height: 600
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
