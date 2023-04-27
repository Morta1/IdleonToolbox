import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../components/common/context/AppProvider";
import {
  BottomNavigation,
  BottomNavigationAction,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Link,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import Characters from "../components/dashboard/Characters";
import Account from "../components/dashboard/Account";
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from "@mui/material/IconButton";
import { flatten } from "../utility/helpers";
import Etc from "../components/dashboard/Etc";
import { NextSeo } from "next-seo";

const characterTrackers = ['prayers', 'traps', 'bubbles', 'obols', 'worship', 'postOffice', 'anvil', 'starSigns',
  'talents', 'crystalCountdown'].toSimpleObject();
const accountTrackers = ['stampReducer', 'arcadeBalls', 'refinery', 'towers', 'keys', 'vials', 'cooking', 'miniBosses',
  'bargainTag', 'gaming', 'guildTasks', 'rift'
].toSimpleObject();
const trackersOptions = {
  account: {
    vials: { subtractGreenStacks: true },
    gaming: { sprouts: true, squirrel: true, shovel: true },
    guildTasks: { daily: true, weekly: true },
    refinery: { materials: true, rankUp: true }
  },
  characters: {
    anvil: { showAlertBeforeFull: true }
  }
};

const Dashboard = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const [open, setOpen] = useState(false);
  const [trackers, setTrackers] = useState();
  const [options, setOptions] = useState();

  useEffect(() => {
    const accountHasDiff = state?.trackers?.account ? Object.keys(accountTrackers).length !== Object.keys(state?.trackers?.account).length : true;
    const charactersHasDiff = state?.trackers?.characters ? Object.keys(characterTrackers).length !== Object.keys(state?.trackers?.characters).length : true;
    setTrackers({
      account: accountHasDiff ? accountTrackers : state?.trackers?.account,
      characters: charactersHasDiff ? characterTrackers : state?.trackers?.characters
    })
    const accountOptionDiff = state?.trackersOptions ? Object.keys(flatten(trackersOptions, {})).length !== Object.keys(flatten(state?.trackersOptions, {})).length : true;
    setOptions({
      ...(accountOptionDiff ? trackersOptions : state?.trackersOptions)
    })
  }, []);

  const handleTrackerChange = (event, type) => {
    const tempTrackers = {
      ...trackers,
      [type]: {
        ...trackers[type],
        [event.target.name]: event.target.checked
      }
    };
    const hasOptions = options?.[type]?.[event.target.name];
    if (hasOptions) {
      setOptions({
        ...options,
        [type]: {
          ...options?.[type],
          [event.target.name]: {
            ...Object.keys(hasOptions).toSimpleObject(event.target.checked)
          }
        }
      })
    }
    setTrackers(tempTrackers);
    dispatch({ type: 'trackers', data: tempTrackers })
  };

  const handleOptionsChange = (event, type, option) => {
    const tempOptions = {
      ...options,
      [type]: {
        ...options[type],
        [option]: {
          ...options[type][option],
          [event.target.name]: event.target.checked
        }
      }
    };
    setOptions(tempOptions);
    if (!trackers?.[type]?.[option]) {
      setTrackers({
        ...trackers,
        [type]: {
          ...trackers[type],
          [option]: true
        }
      })
    }
    dispatch({ type: 'trackersOptions', data: tempOptions })
  };

  return <>
    <NextSeo
      title="Idleon Toolbox | Dashboard"
      description="Provides key information about your account and alerts you when there are unfinished tasks"
    />
    <Stack direction={'row'} alignItems={'center'} gap={3}>
      <Typography variant={'h2'}>Dashboard</Typography>
      <IconButton title={'Configure alerts'} onClick={() => setOpen(true)}>
        <SettingsIcon/>
      </IconButton>
    </Stack>
    <Typography component={'div'} variant={'caption'} mb={3}>* Please let me know if you want to tracks additional
      stuff</Typography>
    <Stack gap={2}>
      <Account trackers={trackers?.account} trackersOptions={options?.account} characters={characters} account={account}
               lastUpdated={lastUpdated}/>
      <Characters trackers={trackers?.characters} trackersOptions={options?.characters} characters={characters} account={account} lastUpdated={lastUpdated}/>
      <Etc characters={characters} account={account} lastUpdated={lastUpdated}/>
    </Stack>
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
      <BottomNavigation>
        <BottomNavigationAction
          label="ko-fi"
          value="ko-fi"
          icon={<a href='https://ko-fi.com/S6S7BHLQ4' target='_blank'
                   rel="noreferrer">
            <img height='36'
                 style={{ border: 0, height: 36, width: 143 }}
                 src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3'
                 alt='Buy Me a Coffee at ko-fi.com'/>
          </a>}
        />
        <BottomNavigationAction label={'discord'}
                                value={'discord'}
                                component={Link}
                                href={"https://discord.gg/8Devcj7FzV"}
                                target={"_blank"}
                                icon={<svg viewBox="0 -2 127.14 96.36" width="20" height="20" aria-hidden="true">
                                  <path
                                    d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                                    fill="white"></path>
                                </svg>}/>
      </BottomNavigation>
    </Paper>
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>What would you like to track ?</DialogTitle>
      <DialogContent>
        <Stack direction={'row'} alignItems={'flex-start'} gap={5} flexWrap={'wrap'}>
          <FormGroup>
            <FormLabel component="legend">Account</FormLabel>
            <TrackerOptions arr={trackers?.account}
                            options={options?.account}
                            type={'account'}
                            onOptionChange={handleOptionsChange}
                            onTrackerChange={handleTrackerChange}/>
          </FormGroup>
          <FormGroup>
            <FormLabel component="legend">Character</FormLabel>
            <TrackerOptions arr={trackers?.characters}
                            type={'characters'}
                            options={options?.characters}
                            onOptionChange={handleOptionsChange}
                            onTrackerChange={handleTrackerChange}/>
          </FormGroup>
        </Stack>
      </DialogContent>
    </Dialog>
  </>
};

const TrackerOptions = ({ arr, type, onTrackerChange, onOptionChange, options }) => {
  return Object.keys(arr)?.map((trackerName) => {
    const trackerOptions = options?.[trackerName];
    return <React.Fragment key={`tracker-${trackerName}`}>
      <FormControlLabel
        control={<Checkbox name={trackerName} checked={arr?.[trackerName]}
                           size={'small'}
                           onChange={(event) => onTrackerChange(event, type)}/>}
        label={trackerName.camelToTitleCase()}/>
      <Stack sx={{ ml: 3 }}>
        {trackerOptions && Object.keys(trackerOptions)?.map((option) => {
          return <FormControlLabel
            key={`option-${option}`}
            control={<Checkbox name={option}
                               size={'small'}
                               checked={trackerOptions?.[option]}
                               onChange={(event) => onOptionChange(event, type, trackerName)}/>}
            label={option.camelToTitleCase()}/>
        })}
      </Stack>
    </React.Fragment>
  })
}

export default Dashboard;
