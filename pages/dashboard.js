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
  'talents'].toSimpleObject();
const accountTrackers = ['stampReducer', 'arcadeBalls', 'refinery', 'towers', 'keys', 'vials', 'cooking', 'miniBosses',
  'bargainTag', 'gaming'
].toSimpleObject();
const trackersOptions = {
  account: {
    vials: { subtractGreenStacks: true },
    gaming: { sprouts: true, squirrel: true, shovel: true }
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
      <Characters trackers={trackers?.characters} characters={characters} account={account} lastUpdated={lastUpdated}/>
      <Etc characters={characters} account={account} lastUpdated={lastUpdated}/>
    </Stack>
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
      <BottomNavigation>
        <BottomNavigationAction
          label="Recents"
          value="recents"
          icon={<a href='https://ko-fi.com/S6S7BHLQ4' target='_blank'
                   rel="noreferrer">
            <img height='36'
                 style={{ border: 0, height: 36, width: 143 }}
                 src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3'
                 alt='Buy Me a Coffee at ko-fi.com'/>
          </a>}
        />
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
                           onChange={(event) => onTrackerChange(event, type)}/>}
        label={trackerName.camelToTitleCase()}/>
      <Stack sx={{ ml: 3 }}>
        {trackerOptions && Object.keys(trackerOptions)?.map((option) => {
          return <FormControlLabel
            key={`option-${option}`}
            control={<Checkbox name={option}
                               checked={trackerOptions?.[option]}
                               onChange={(event) => onOptionChange(event, type, trackerName)}/>}
            label={option.camelToTitleCase()}/>
        })}
      </Stack>
    </React.Fragment>
  })
}

export default Dashboard;
