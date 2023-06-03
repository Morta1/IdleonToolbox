import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../components/common/context/AppProvider";
import {
  Box,
  Checkbox,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import Characters from "../components/dashboard/Characters";
import Account from "../components/dashboard/Account";
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from "@mui/material/IconButton";
import { flatten, prefix } from "../utility/helpers";
import Etc from "../components/dashboard/Etc";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import CloseIcon from '@mui/icons-material/Close';
import { NextSeo } from "next-seo";
import { getRawShopItems } from "../parsers/shops";
import { Adsense } from "@ctrl/react-adsense";

const characterTrackers = ['prayers', 'traps', 'bubbles', 'obols', 'worship', 'postOffice', 'anvil', 'starSigns',
  'talents', 'crystalCountdown', 'tools'].toSimpleObject();
const accountTrackers = ['stampReducer', 'arcadeBalls', 'refinery', 'towers', 'keys', 'vials', 'cooking', 'miniBosses',
  'bargainTag', 'gaming', 'guildTasks', 'rift', 'sailing', 'alchemy', 'shinies', 'printerAtoms', 'sigils', 'shops',
  'flags',
  'randomEvents'
].toSimpleObject();


const trackersOptions = {
  account: {
    vials: { subtractGreenStacks: true },
    gaming: { sprouts: true, squirrel: true, shovel: true },
    guildTasks: { daily: true, weekly: true },
    refinery: { materials: true, rankUp: true },
    sailing: { captains: true },
    alchemy: {
      input: {
        label: 'Liquid Threshold Alert',
        type: 'number',
        value: 90,
        helperText: 'Liquid percent',
        maxValue: 100, minValue: 0
      }
    },
    shinies: { input: { label: 'Level Threshold', type: 'number', value: 5, helperText: 'Shiny level' } },
    shops: { asImages: true, ...getRawShopItems() },
    printerAtoms: { includeOakAndCopper: false },
  },
  characters: {
    anvil: { showAlertBeforeFull: true },
    postOffice: { input: { label: 'threshold', type: 'number', value: 1, helperText: 'Number of boxes' } },
    talents: {
      printerGoBrrr: true,
      refineryThrottle: true,
      craniumCooking: true,
      'itsYourBirthday!': true,
      voidTrialRerun: true,
      arenaSpirit: true,
      tasteTest: true
    },
    crystalCountdown: { showMaxed: true, showNonMaxed: false }
  }
};

const Dashboard = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
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

  const handleTabChange = (e, selected) => {
    setSelectedTab(selected);
  }
  const handleTrackerChange = (event, type, hasInput) => {
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
            ...Object.keys(hasOptions).toSimpleObject(event.target.checked),
            ...(hasInput ? { input: hasOptions?.input } : {})
          }
        }
      })
    }
    setTrackers(tempTrackers);
    dispatch({ type: 'trackers', data: tempTrackers })
  };

  const handleOptionsChange = (event, type, option, isInput) => {
    const tempOptions = {
      ...options,
      [type]: {
        ...options[type],
        [option]: {
          ...(isInput ? {
            input: { ...options[type][option]['input'], value: event.target.value }
          } : { ...options[type][option], [event.target.name]: event.target.checked })
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
      <Characters trackers={trackers?.characters} trackersOptions={options?.characters} characters={characters}
                  account={account} lastUpdated={lastUpdated}/>
      <Etc characters={characters} account={account} lastUpdated={lastUpdated}/>
    </Stack>
    <Stack sx={{ marginTop: 'auto', my: 10 }}>
      <Adsense
        style={{ display: 'inline-block', height: 90 }}
        client="ca-pub-1842647313167572"
        slot="7203005854"
        format={''}
      />
    </Stack>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Dashboard configurations
        <IconButton onClick={() => setOpen(false)}><CloseIcon/></IconButton>
      </DialogTitle>
      <DialogContent>
        <Tabs centered
              sx={{ marginBottom: 3 }}
              variant={'fullWidth'}
              value={selectedTab} onChange={handleTabChange}>
          {['Account', 'Character']?.map((tab, index) => {
            return <Tab label={tab} key={`${tab}-${index}`}/>;
          })}
        </Tabs>
        {selectedTab === 0 ? <FormGroup>
          <TrackerOptions arr={trackers?.account}
                          options={options?.account}
                          type={'account'}
                          onOptionChange={handleOptionsChange}
                          onTrackerChange={handleTrackerChange}/>
        </FormGroup> : null}
        {selectedTab === 1 ? <FormGroup>
          <TrackerOptions arr={trackers?.characters}
                          type={'characters'}
                          options={options?.characters}
                          onOptionChange={handleOptionsChange}
                          onTrackerChange={handleTrackerChange}/>
        </FormGroup> : null}
      </DialogContent>
    </Dialog>
  </>
};

const TrackerOptions = ({ arr, type, onTrackerChange, onOptionChange, options }) => {
  const [showId, setShowId] = useState(null);

  const handleArrowClick = (trackerName) => {
    setShowId(showId === trackerName ? null : trackerName)
  }

  return arr && Object.keys(arr)?.map((trackerName, index) => {
    const trackerOptions = options?.[trackerName];
    const hasInput = trackerOptions?.input;
    const asImages = trackerOptions?.asImages;
    return <Box key={`tracker-${trackerName}`}>
      <Stack direction={'row'} justifyContent={'space-between'}>
        <FormControlLabel
          control={<Checkbox name={trackerName} checked={arr?.[trackerName]}
                             size={'small'}
                             onChange={(event) => onTrackerChange(event, type, hasInput)}/>}
          label={trackerName?.camelToTitleCase()}/>
        {trackerOptions ? <IconButton size={"small"}
                                      onClick={() => handleArrowClick(trackerName)}>
          {showId === trackerName ? <ArrowDropUpIcon/> : <ArrowDropDownIcon/>}
        </IconButton> : null}
      </Stack>
      <Collapse in={showId === trackerName}>
        <Stack sx={{ ml: 3, mr: 3 }} direction={asImages ? 'row' : 'column'} flexWrap={asImages ? 'wrap' : 'no-wrap'}>
          {trackerOptions && Object.keys(trackerOptions)?.map((option) => {
            if (option === 'asImages') return;
            if (option === 'input') {
              const { label, type: inputType, value, helperText = '', maxValue, minValue } = trackerOptions?.[option]
              return <TextField key={`option-${option}`} size={'small'}
                                label={label.capitalize()}
                                type={inputType}
                                sx={{ mt: 1, width: 150 }}
                                name={option}
                                value={value}
                                InputProps={{ inputProps: { max: maxValue, min: minValue, autoComplete: 'off' } }}
                                onChange={(event) => onOptionChange(event, type, trackerName, true)}
                                helperText={helperText}/>
            }
            return <FormControlLabel
              key={`option-${option}`}
              control={<Checkbox name={option}
                                 size={'small'}
                                 checked={trackerOptions?.[option]}
                                 onChange={(event) => onOptionChange(event, type, trackerName)}/>}
              label={asImages ?
                <img width={24} height={24} src={`${prefix}data/${option}.png`} alt=""/> : option.camelToTitleCase()}>

            </FormControlLabel>
          })}
        </Stack>
      </Collapse>
      {index !== Object.keys(arr).length - 1 ? <Divider/> : null}
    </Box>
  })
}

export default Dashboard;
