import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { Box, Stack } from '@mui/material';
import { formatDuration } from '@utility/helpers';
import { AppContext } from '@components/common/context/AppProvider';
import Notice from '@components/common/Notice';
import { IconCopy, IconDeviceFloppy } from '@tabler/icons-react';
import Button from '@mui/material/Button';
import useFormatDate from '@hooks/useFormatDate';
import useToolbarState from '@hooks/useToolbarState';
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
import OrbletsSection from '@components/tools/active-calculator/OrbletsSection';
import HeaderCharacterPicker from '@components/tools/HeaderCharacterPicker';
import InfoButton from '@components/common/InfoButton';
import Toolbar from '@components/common/Toolbar';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { MissingSections } from '@components/common/styles';
import { CLIPBOARD_ERROR_MESSAGE, copyText } from '@utility/clipboard';
import { notify } from '@components/common/Overlays/notify';
import {
  ACCOUNT_SNAPSHOT_KEY,
  CHARACTER_SNAPSHOT_KEY,
  toAccountSnapshot,
  toCharacterSnapshot
} from '@utility/activeCalculatorSnapshot';

const SECTIONS = [['coins', 'Coins'], ['pets', 'Pets'], ['kills', 'Kills'], ['exp', 'Exp'], ['cards', 'Cards'], ['drops', 'Drops'],
  ['cauldrons', 'Cauldrons'], ['obols', 'Obols'], ['orblets', 'Orblets']];
const CALCULATOR_TOOLBAR = { show: 'all', resultsOnly: false };
const SECTION_NAMES = { breeding: 'Breeding', cards: 'Cards', alchemy: 'Alchemy', obols: 'Obols', royalGuardian: 'Royal Guardian', tesseract: 'Tesseract' };

const ActiveStuffCalculator = () => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const [snapshottedAcc, setSnapshottedAcc] = useLocalStorage({ key: ACCOUNT_SNAPSHOT_KEY, defaultValue: null });
  const [snapshottedChar, setSnapshottedChar] = useLocalStorage({ key: CHARACTER_SNAPSHOT_KEY, defaultValue: null });
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('active-stuff-calculator', CALCULATOR_TOOLBAR);
  // The pick is remembered; before one, the page follows the snapshot's character
  const [pickedChar, setPickedChar] = useLocalStorage({ key: 'active-stuff-calculator:character' });
  const characters = state?.characters;
  const selectedChar = String(characters?.[pickedChar] ? pickedChar : snapshottedChar?.playerId ?? characters?.[0]?.playerId ?? 0);
  const currentCharacter = characters?.[selectedChar];
  const selectedCharacterClass = currentCharacter?.class;
  const isBeastMaster = checkCharClass(selectedCharacterClass, CLASSES.Beast_Master)
    || checkCharClass(selectedCharacterClass, CLASSES.Wind_Walker);
  const isShaman = checkCharClass(selectedCharacterClass, CLASSES.Shaman);
  const isRoyalGuardian = checkCharClass(selectedCharacterClass, CLASSES.Royal_Guardian);
  const offered = SECTIONS.filter(([section]) => (section === 'pets' ? isBeastMaster
    : section === 'cauldrons' ? isShaman
      : section === 'orblets' ? isRoyalGuardian : true));
  // A section this character's class lacks falls back to all of them
  const show = offered.some(([section]) => section === toolbar.show) ? toolbar.show : 'all';
  const isDisplayed = (section) => offered.some(([name]) => name === section) && (show === 'all' || show === section);

  const handleSaveSnapshot = () => {
    const snapshotTime = new Date().getTime();
    setSnapshottedChar(toCharacterSnapshot({ ...currentCharacter, snapshotTime }))
    setSnapshottedAcc(toAccountSnapshot({ ...state?.account, snapshotTime }))
  }

  const handleCopySnapshot = async () => {
    if (!snapshottedAcc || !snapshottedChar) return;
    const snapshotData = {
      account: snapshottedAcc,
      character: snapshottedChar
    };
    const copied = await copyText(JSON.stringify(snapshotData, null, 2));
    notify(copied ? 'Copied snapshot to clipboard' : CLIPBOARD_ERROR_MESSAGE);
  };

  const lastUpdatedSeconds = state?.account?.timeAway?.Player;
  const lastUpdated = Number.isFinite(lastUpdatedSeconds) ? lastUpdatedSeconds * 1000 : null;
  const snapshotTime = snapshottedChar?.snapshotTime;
  const elapsedSeconds = snapshotTime && lastUpdated !== null ? (lastUpdated - snapshotTime) / 1000 : null;
  const hasSnapshot = (snapshottedChar?.playerId + '') === selectedChar;
  const sectionProps = { selectedChar, lastUpdated, resultsOnly: toolbar.resultsOnly };

  return <>
    <NextSeo
      title="Active Stuff Calculator | Idleon Toolbox"
      description="Calculate active gameplay item drops, resource gains, and efficiency for your Legends of Idleon characters"
    />
    <MissingSections account={state?.account} names={SECTION_NAMES}/>
    {state?.emptyAccount ? <Notice tone={'signin'} sx={{ mb: 2 }}>Sign in to compare a snapshot with your save.</Notice> : null}
    {currentCharacter ? <>
      <HeaderCharacterPicker characters={characters} value={selectedChar} onChange={setPickedChar}/>
      <PageSummary label={'Snapshot times'}>
        <StatTile label={'Snapshot taken'} value={snapshotTime ? formatDate(snapshotTime) : '-'} sub={snapshottedChar?.name}/>
        <StatTile label={'Last save'} value={lastUpdated !== null ? formatDate(lastUpdated) : '-'}/>
        <StatTile label={'Measured over'} value={elapsedSeconds > 0 ? formatDuration(elapsedSeconds) : '-'}/>
      </PageSummary>
      <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
        <Button variant={'contained'} onClick={handleSaveSnapshot} startIcon={<IconDeviceFloppy size={18}/>}>Save snapshot</Button>
        <Button variant={'outlined'} onClick={handleCopySnapshot} startIcon={<IconCopy size={18}/>}
                disabled={!snapshottedAcc || !snapshottedChar}>
          Copy snapshot
        </Button>
        <InfoButton label={'snapshots'}>One snapshot at a time: a new one replaces the last, for any character.</InfoButton>
      </Stack>
      <Box>
        <Toolbar state={{ ...toolbar, show }} defaults={CALCULATOR_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                 total={offered.length} shown={show === 'all' ? offered.length : 1} noun={'sections'}>
          <Toolbar.Show options={[['all', 'All sections'], ...offered]}/>
          <Toolbar.Filter name={'resultsOnly'} label={'Results only'}/>
        </Toolbar>
        {!hasSnapshot ? <Notice>This character has no snapshot yet: Save snapshot takes one.</Notice> : <Stack gap={3}>
          {elapsedSeconds !== null && elapsedSeconds <= 0 ? <Notice>Your last save is older than this snapshot: cloud save in game to see what you gained.</Notice> : null}
          {isDisplayed('coins') ? <CoinsSection {...sectionProps}/> : null}
          {isDisplayed('pets') ? <PetSection {...sectionProps}/> : null}
          {isDisplayed('kills') ? <KillsSection {...sectionProps}/> : null}
          {isDisplayed('exp') ? <ExpSection {...sectionProps}/> : null}
          {isDisplayed('cards') ? <CardsSection {...sectionProps}/> : null}
          {isDisplayed('drops') ? <DropSection {...sectionProps}/> : null}
          {isDisplayed('cauldrons') ? <CauldronsSection {...sectionProps}/> : null}
          {isDisplayed('obols') ? <ObolsSection {...sectionProps}/> : null}
          {isDisplayed('orblets') ? <OrbletsSection {...sectionProps}/> : null}
        </Stack>}
      </Box>
    </> : null}
  </>;
};

export default ActiveStuffCalculator;
