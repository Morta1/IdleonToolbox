import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../components/common/context/AppProvider";
import {
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Stack,
  Typography
} from "@mui/material";
import Characters from "../components/dashboard/Characters";
import Account from "../components/dashboard/Account";
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from "@mui/material/IconButton";

const characterTrackers = ['prayers', 'traps', 'bubbles', 'obols', 'worship', 'postOffice', 'anvil', 'starSigns',
  'talents'].toSimpleObject();
const accountTrackers = ['stampReducer', 'arcadeBalls', 'refinery', 'towers', 'keys', 'vials', 'cooking', 'miniBosses'
].toSimpleObject();

const Dashboard = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const [open, setOpen] = useState(false);
  const [trackers, setTrackers] = useState();

  useEffect(() => {
    const accountHasDiff = state?.trackers?.account ? Object.keys(accountTrackers).length !== Object.keys(state?.trackers?.account).length : true;
    const charactersHasDiff = state?.trackers?.characters ? Object.keys(characterTrackers).length !== Object.keys(state?.trackers?.characters).length : true;
    setTrackers({
      account: accountHasDiff ? accountTrackers : state?.trackers?.account,
      characters: charactersHasDiff ? characterTrackers : state?.trackers?.characters
    })
  }, [state])

  const handleTrackerChange = (event, type) => {
    const tempTrackers = {
      ...trackers,
      [type]: {
        ...trackers[type],
        [event.target.name]: event.target.checked
      }
    };
    setTrackers(tempTrackers);
    dispatch({ type: 'trackers', data: tempTrackers })
  };

  return <>
    <Stack direction={'row'} alignItems={'center'} gap={3}>
      <Typography variant={'h2'}>Dashboard</Typography>
      <IconButton title={'Configure alerts'} onClick={() => setOpen(true)}>
        <SettingsIcon/>
      </IconButton>
    </Stack>
    <Typography component={'div'} variant={'caption'} mb={3}>* Please let me know if you want to tracks additional
      stuff</Typography>
    <Stack>
      <Account trackers={trackers?.account} characters={characters} account={account} lastUpdated={lastUpdated}/>
      <Characters trackers={trackers?.characters} characters={characters} account={account} lastUpdated={lastUpdated}/>
    </Stack>
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>What would you like to track ?</DialogTitle>
      <DialogContent>
        <Stack direction={'row'} alignItems={'flex-start'} gap={3}>
          <FormGroup>
            <FormLabel component="legend">Account</FormLabel>
            <TrackerOptions arr={trackers?.account}
                            onChange={(event) => handleTrackerChange(event, 'account')}/>
          </FormGroup>
          <FormGroup>
            <FormLabel component="legend">Character</FormLabel>
            <TrackerOptions arr={trackers?.characters}
                            onChange={(event) => handleTrackerChange(event, 'characters')}/>
          </FormGroup>
        </Stack>
      </DialogContent>
    </Dialog>
  </>
};

const TrackerOptions = ({ arr, onChange }) => {
  return Object.keys(arr).map((trackerName) => {
    return <FormControlLabel
      key={trackerName}
      control={<Checkbox name={trackerName} checked={arr?.[trackerName]}
                         onChange={onChange}/>}
      label={trackerName.camelToTitleCase()}/>
  })
}

export default Dashboard;
