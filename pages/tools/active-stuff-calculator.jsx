import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum, getCoinsArray } from '@utility/helpers';
import CoinDisplay from '@components/common/CoinDisplay';
import { compareInventories, getExpDiff } from '@parsers/misc/activeCalculator';
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
// show: the picked sections, several at once; empty shows them all. details: each section's Snapshot and Now beside what
// it gained (results first: the page answers "what did I gain, how fast")
const CALCULATOR_TOOLBAR = { show: [], details: false };

// The small sections in two columns where the page is wide, each column stacking its own (CardGrid's flow): a grid's rows
// took their tallest section's height and left holes under the short ones. Drops, with its item grids, follows full width
const SECTIONS_SX = {
  columnCount: 1, columnGap: '24px',
  '@container (min-width: 1100px)': { columnCount: 2 },
  '& > *': { breakInside: 'avoid', mb: 3 }
};

const STEPS = ['Save snapshot here before you play.', 'Play, then cloud save in game.', 'Come back: what you gained, and how fast, shows here.'];
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
  // The picked sections this character's class has; none left shows them all. A pick saved before the list ('coins', or
  // 'all') reads as that one section
  const saved = Array.isArray(toolbar.show) ? toolbar.show : toolbar.show && toolbar.show !== 'all' ? [toolbar.show] : [];
  const show = offered.map(([section]) => section).filter((section) => saved.includes(section));
  const isDisplayed = (section) => offered.some(([name]) => name === section) && (!show.length || show.includes(section));

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
  const sectionProps = { selectedChar, lastUpdated, resultsOnly: !toolbar.details };

  // The headline of each section, for the results row: what the page is for, at a glance
  const hours = elapsedSeconds > 0 ? elapsedSeconds / 3600 : null;
  const perHour = (gained) => (hours && Number.isFinite(gained) ? gained / hours : null);
  const coinsPerHour = perHour((currentCharacter?.money ?? NaN) - (snapshottedChar?.money ?? NaN));
  const mapIndex = snapshottedChar?.mapIndex;
  const killsPerHour = perHour(Math.floor(currentCharacter?.kills?.[mapIndex] || 0) - Math.floor(snapshottedChar?.kills?.[mapIndex] || 0));
  const expDiff = hasSnapshot ? getExpDiff(snapshottedChar, currentCharacter, lastUpdated) : null;
  const levelUpIn = expDiff?.expPerMinute > 0 ? formatDuration((expDiff.expToLevel / expDiff.expPerMinute) * 60) : null;
  const gainedItems = hasSnapshot ? compareInventories(snapshottedChar?.inventory, currentCharacter?.inventory, lastUpdated, snapshotTime, '') : [];
  const topItem = gainedItems.toSorted((a, b) => b.difference - a.difference)[0];

  return <>
    <NextSeo
      title="Active Stuff Calculator | Idleon Toolbox"
      description="Calculate active gameplay item drops, resource gains, and efficiency for your Legends of Idleon characters"
    />
    <MissingSections account={state?.account} names={SECTION_NAMES}/>
    {state?.emptyAccount ? <Notice tone={'signin'} sx={{ mb: 2 }}>Sign in to compare a snapshot with your save.</Notice> : null}
    {currentCharacter ? <>
      <HeaderCharacterPicker characters={characters} value={selectedChar} onChange={setPickedChar}/>
      {/* Results first: what the measured stretch gained, per hour, before any section */}
      {hasSnapshot && hours ? <PageSummary label={'Results'}>
        <StatTile label={'Measured over'} value={formatDuration(elapsedSeconds)}/>
        <StatTile label={'Coins per hour'} value={coinsPerHour === null ? '-' : <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          {coinsPerHour < 0 ? '-' : null}<CoinDisplay dense money={getCoinsArray(Math.abs(coinsPerHour))}/>
        </Box>}/>
        <StatTile label={'Kills per hour'} value={killsPerHour === null ? '-' : formatNum(killsPerHour)}/>
        <StatTile label={'EXP per hour'} value={expDiff?.expPerHour > 0 ? formatNum(expDiff.expPerHour) : '-'}
                  sub={levelUpIn ? `Next level in ${levelUpIn}` : undefined}/>
        <StatTile label={'Items gained'} value={formatNum(gainedItems.length)}
                  sub={topItem ? `Most: ${cleanUnderscore(topItem.displayName)} +${formatNum(topItem.difference)}` : undefined}/>
      </PageSummary> : null}
      {/* The snapshot's controls and times on one line, under the results they feed */}
      <Stack direction={'row'} alignItems={'center'} columnGap={1} rowGap={1} flexWrap={'wrap'} sx={{ mb: 2 }}>
        <Button variant={'contained'} onClick={handleSaveSnapshot} startIcon={<IconDeviceFloppy size={18}/>}>
          {hasSnapshot ? 'New snapshot' : 'Save snapshot'}
        </Button>
        <Button variant={'outlined'} onClick={handleCopySnapshot} startIcon={<IconCopy size={18}/>}
                disabled={!snapshottedAcc || !snapshottedChar}>
          Copy snapshot
        </Button>
        <InfoButton label={'snapshots'}>One snapshot at a time: a new one replaces the last, for any character.</InfoButton>
        {snapshotTime ? <Typography variant={'body2'} color={'text.secondary'} sx={{ ml: 1 }}>
          {`Snapshot ${formatDate(snapshotTime, { showSeconds: false })}${snapshottedChar?.name ? ` (${cleanUnderscore(snapshottedChar.name)})` : ''}`}
          {lastUpdated !== null ? ` · last save ${formatDate(lastUpdated, { showSeconds: false })}` : ''}
        </Typography> : null}
      </Stack>
      <Box>
        <Toolbar state={{ ...toolbar, show }} defaults={CALCULATOR_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                 total={offered.length} shown={show.length || offered.length} noun={'sections'}>
          <Toolbar.Show multiple options={[['all', 'All sections'], ...offered]}/>
          <Toolbar.Filter name={'details'} label={'Details'} display/>
        </Toolbar>
        {!hasSnapshot ? <Notice>
          <Box component={'ol'} sx={{ m: 0, pl: 2.5 }}>{STEPS.map((step) => <li key={step}>{step}</li>)}</Box>
        </Notice> : <>
          {elapsedSeconds !== null && elapsedSeconds <= 0 ? <Notice sx={{ mb: 2 }}>Your last save is older than this snapshot: cloud save in game to see what you gained.</Notice> : null}
          <Box sx={{ containerType: 'inline-size' }}>
            <Box sx={SECTIONS_SX}>
              {isDisplayed('coins') ? <CoinsSection {...sectionProps}/> : null}
              {isDisplayed('pets') ? <PetSection {...sectionProps}/> : null}
              {isDisplayed('kills') ? <KillsSection {...sectionProps}/> : null}
              {isDisplayed('exp') ? <ExpSection {...sectionProps}/> : null}
              {isDisplayed('cards') ? <CardsSection {...sectionProps}/> : null}
              {isDisplayed('cauldrons') ? <CauldronsSection {...sectionProps}/> : null}
              {isDisplayed('obols') && sectionProps.resultsOnly ? <ObolsSection {...sectionProps}/> : null}
              {isDisplayed('orblets') ? <OrbletsSection {...sectionProps}/> : null}
            </Box>
          </Box>
          {/* Item grids take the full width, each with its own gap: a column's last section loses its margin at the
              columns' foot. Obols holds two inventories once Details is on. */}
          {isDisplayed('obols') && !sectionProps.resultsOnly ? <Box sx={{ mt: 3 }}><ObolsSection {...sectionProps}/></Box> : null}
          {isDisplayed('drops') ? <Box sx={{ mt: 3 }}><DropSection {...sectionProps}/></Box> : null}
        </>}
      </Box>
    </> : null}
  </>;
};

export default ActiveStuffCalculator;
