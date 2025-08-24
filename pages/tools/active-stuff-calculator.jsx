import { NextSeo } from 'next-seo';
import React, { useContext, useEffect, useState } from 'react';
import {
  Checkbox,
  Divider,
  FormControlLabel,
  Select,
  selectClasses,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { prefix } from '@utility/helpers';
import MenuItem from '@mui/material/MenuItem';
import { AppContext } from '@components/common/context/AppProvider';
import { IconDeviceFloppy, IconInfoCircleFilled, IconCopy } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import Button from '@mui/material/Button';
import { format } from 'date-fns';
import { useLocalStorage } from '@mantine/hooks';
import ExpSection from '@components/tools/active-calculator/ExpSection';
import DropSection from '@components/tools/active-calculator/DropSection';
import KillsSection from '@components/tools/active-calculator/KillsSection';
import CardsSection from '@components/tools/active-calculator/CardsSection';
import PetSection from '@components/tools/active-calculator/PetSection';
import { checkCharClass, CLASSES } from '@parsers/talents';
import CoinsSection from '@components/tools/active-calculator/CoinsSection';
import CauldronsSection from '@components/tools/active-calculator/CauldronsSection';
import ObolsSection from '@components/tools/active-calculator/ObolsSection';


const sections = ['coins', 'pets', 'kills', 'exp', 'cards', 'drops', 'cauldrons', 'obols'];

const ActiveStuffCalculator = () => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc, setSnapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const [snapshottedChar, setSnapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [resultsOnly, setResultsOnly] = useLocalStorage({ key: 'activeDropResultsOnly', defaultValue: false });
  const [selectedSections, setSelectedSections] = useLocalStorage({
    key: 'activeDropSections',
    defaultValue: sections
  });
  const [selectedChar, setSelectedChar] = useState('0');
  const isBeastMaster = checkCharClass(state?.characters?.[selectedChar]?.class, CLASSES.Beast_Master) || (state?.characters?.[selectedChar]?.class, CLASSES.Wind_Walker);
  const isShaman = checkCharClass(state?.characters?.[selectedChar]?.class, CLASSES.Shaman);

  useEffect(() => {
    if (snapshottedChar) {
      setSelectedChar(snapshottedChar?.playerId + '');
      let currentSections = selectedSections;
      if (!checkCharClass(state?.characters?.[snapshottedChar?.playerId]?.class, CLASSES.Beast_Master) && !checkCharClass(state?.characters?.[snapshottedChar?.playerId]?.class, CLASSES.Wind_Walker)) {
        currentSections = currentSections.filter((name) => name !== 'pets');
      }
      if (!checkCharClass(state?.characters?.[snapshottedChar?.playerId]?.class, CLASSES.Shaman)) {
        currentSections = currentSections.filter((name) => name !== 'cauldrons');
      }
      setSelectedSections(currentSections);
    }
  }, [snapshottedChar, snapshottedAcc]);

  const isDisplayed = (section) => {
    return selectedSections.includes(section)
  }

  const handleCharChange = (e) => {
    let currentSections = selectedSections;
    if (!checkCharClass(state?.characters?.[e.target?.value?.playerId]?.class, CLASSES.Beast_Master)) {
      currentSections = currentSections.filter((name) => name !== 'pets');
    }
    if (!checkCharClass(state?.characters?.[snapshottedChar?.playerId]?.class, CLASSES.Shaman)) {
      currentSections = currentSections.filter((name) => name !== 'cauldrons');
    }
    setSelectedSections(currentSections);
    setSelectedChar(e.target.value);
  }

  const handleSections = (e, newSections) => {
    setSelectedSections(newSections);
  };

  const handleSaveSnapshot = () => {
    setSnapshottedChar({ ...state?.characters?.[selectedChar], snapshotTime: new Date().getTime() })
    setSnapshottedAcc({ ...state?.account, snapshotTime: new Date().getTime() })
  }

  const handleCopySnapshot = () => {
    if (snapshottedAcc && snapshottedChar) {
      const snapshotData = {
        account: snapshottedAcc,
        character: snapshottedChar
      };
      navigator.clipboard.writeText(JSON.stringify(snapshotData, null, 2));
    }
  };

  const lastUpdated = state?.account?.timeAway?.Player * 1000;

  return <>
    <NextSeo
      title="Active Stuff Calculator | Idleon Toolbox"
      description="Calculate how much items you get when playing actively"
    />
    <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
      <Select
        size={'small'}
        sx={{
          width: 230,
          paddingRight: 2,
          [`& .${selectClasses.select}`]: {
            display: 'flex',
            alignItems: 'center'
          }
        }} value={selectedChar} onChange={handleCharChange}>
        {state?.characters?.map((character, index) => {
          const classIcon = character?.classIndex !== undefined ? `data/ClassIcons${character?.classIndex}.png` : 'afk_targets/Nothing.png'
          return <MenuItem key={character?.name + index} value={character?.playerId}
                           selected={selectedChar === character?.playerId}>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <img src={`${prefix}${classIcon}`} alt="" width={32} height={32}/>
              <Typography>{character?.name}</Typography>
            </Stack>
          </MenuItem>
        })}
      </Select>
      <Divider orientation={'vertical'} flexItem sx={{ ml: 2, display: { xs: 'none', sm: 'block' } }}/>
      <Stack gap={.5} sx={{ ml: 2 }}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Button sx={{ width: 'fit-content' }} variant={'contained'} size={'small'} onClick={handleSaveSnapshot}
                  startIcon={<IconDeviceFloppy/>}>
            Save snapshot
          </Button>
          <Button sx={{ width: 'fit-content' }} variant={'outlined'} size={'small'} onClick={handleCopySnapshot}
                  startIcon={<IconCopy/>} disabled={!snapshottedAcc || !snapshottedChar}>
            Copy snapshot
          </Button>
          <Tooltip
            title={'You can only take a snapshot of one character at a time.'}>
            <IconInfoCircleFilled/>
          </Tooltip>
        </Stack>
        <FormControlLabel
          control={<Checkbox size="small" checked={resultsOnly} onChange={() => setResultsOnly(!resultsOnly)}/>}
          name={'resultsOnly'}
          label="Show results only"/>
      </Stack>
    </Stack>
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 2 }}>
      <ToggleButtonGroup value={selectedSections} onChange={handleSections}>
        {sections.map((section) => {
          if (section === 'pets' && !isBeastMaster) return null;
          if (section === 'cauldrons' && !isShaman) return null;
          return <ToggleButton key={section} value={section}>{section.camelToTitleCase()}</ToggleButton>
        })}
      </ToggleButtonGroup>
      <Stack>
        {state?.account?.timeAway?.Player ? <Typography component={'span'}
                     variant={'body2'}>Last
          update - {format(state?.account?.timeAway?.Player * 1000, 'dd/MM/yyyy HH:mm:ss')}</Typography> : null}
        {snapshottedChar?.snapshotTime
          ? <Typography
            variant={'body2'}>{snapshottedChar?.name} - {format(snapshottedChar?.snapshotTime, 'dd/MM/yyyy HH:mm:ss')}</Typography>
          : null}
      </Stack>
    </Stack>
    {selectedSections.length === 0
      ? <Typography mt={2} variant={'h6'}>Please select at least one section</Typography>
      : (snapshottedChar?.playerId + '') != selectedChar ? <Typography mt={2} variant={'h6'}>No snapshot available for
        this
        character</Typography> : <>
        {isDisplayed('coins') ? <CoinsSection selectedChar={selectedChar} lastUpdated={lastUpdated} resultsOnly={resultsOnly}/> : null}
        {isDisplayed('pets') && isBeastMaster
          ? <PetSection selectedChar={selectedChar} lastUpdated={lastUpdated} resultsOnly={resultsOnly}/>
          : null}
        {isDisplayed('kills')
          ? <KillsSection selectedChar={selectedChar} lastUpdated={lastUpdated} resultsOnly={resultsOnly}/>
          : null}
        {isDisplayed('exp') ? <ExpSection selectedChar={selectedChar} lastUpdated={lastUpdated} resultsOnly={resultsOnly}/> : null}
        {isDisplayed('cards') ? <CardsSection selectedChar={selectedChar} lastUpdated={lastUpdated} resultsOnly={resultsOnly}/> : null}
        {isDisplayed('drops') ? <DropSection selectedChar={selectedChar} lastUpdated={lastUpdated} resultsOnly={resultsOnly}/> : null}
        {isDisplayed('cauldrons') ? <CauldronsSection selectedChar={selectedChar} lastUpdated={lastUpdated} resultsOnly={resultsOnly}/> : null}
        {isDisplayed('obols') ? <ObolsSection selectedChar={selectedChar} lastUpdated={lastUpdated} resultsOnly={resultsOnly}/> : null}
      </>}
  </>;
};

export default ActiveStuffCalculator;
