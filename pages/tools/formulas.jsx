import { Box, Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { cashMultiText, formatGame } from '@utility/gameNotation';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import DataLoadingWrapper from '@components/common/DataLoadingWrapper';
import { getCashMulti, getClassExpMulti, getDropRate, getRespawnRate } from '@parsers/character';
import Highlighter from '@components/common/Highlighter';
import { getCropEvolution } from '@parsers/world-6/farming';
import { getPrinterMulti } from '@parsers/world-3/printer';
import { getBitsMulti } from '@parsers/world-5/gaming';
import { getGoldenFoodMulti } from '@parsers/misc';
import { NextSeo } from 'next-seo';
import {
  getDoubleGoldenFoodDrop,
  getDoubleGoldenFoodDropSize,
  getDoubleStatueDrop,
  getDoubleStatueDropSize
} from '@parsers/misc';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import Panel from '@components/common/cards/Panel';
import { MissingSections } from '@components/common/styles';
import HeaderCharacterPicker from '@components/tools/HeaderCharacterPicker';
import useToolbarState from '@hooks/useToolbarState';

const FORMULAS_TOOLBAR = { search: '' };

// A formula's own parser can read a section its name doesn't say: a throw reads "-", as a failed section does.
const attempt = (read) => {
  try {
    return read();
  } catch {
    return null;
  }
};

const EXPRESSION_SX = { borderRadius: '12px', p: 1.5, borderLeft: '4px solid var(--mui-palette-primary-main)', bgcolor: 'background.default', overflowX: 'auto' };

// The game rolls a double drop once, so anything past 100% is wasted
const doubleDropChance = (value) => `${formatNum(value, 'pct')}${value > 100 ? ' (capped at 100%)' : ''}`;
// A drop size counts whole statues or foods: 6x, as main reads it
const dropSize = (value) => `${formatNum(value, 'whole')}x`;

// A drawer's line in its trigger's words and unit: the parser's breakdown keeps its own for the pages that read it.
const withLine = (breakdown, name, patch) => (breakdown
  ? { ...breakdown, tree: breakdown.tree?.map((node) => (node.name === name ? { ...node, ...patch } : node)) } : breakdown);

const Formulas = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const characters = state?.characters;
  const [pickedChar, setPickedChar] = useLocalStorage({ key: 'formulas:character' });
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('formulas', FORMULAS_TOOLBAR);
  const selectedChar = characters?.[pickedChar] ?? characters?.[0] ?? null;
  // These composites read nearly every section, over its empty fallback when it failed: under any failed section their
  // numbers aren't the player's, so they read "-" and the note names what failed. A guest has no character.
  const composite = (read) => (account?.failedSections?.length ? null : attempt(read));
  const perCharacter = (read) => (selectedChar ? composite(read) : null);

  const respawnRate = perCharacter(() => getRespawnRate(selectedChar, account));
  const cashMulti = perCharacter(() => getCashMulti(selectedChar, account, characters));
  const expMulti = perCharacter(() => getClassExpMulti(selectedChar, account, characters));
  const dropRate = perCharacter(() => getDropRate(selectedChar, account, characters));
  const cropEvo = perCharacter(() => getCropEvolution(account, selectedChar, account?.farming?.plot?.[0], false, characters));
  const printerMulti = composite(() => getPrinterMulti(account, characters));
  const bitMulti = composite(() => (account?.gaming ? getBitsMulti(account, characters) : null));
  const goldenFoodMulti = perCharacter(() => getGoldenFoodMulti(selectedChar, account, characters));
  const doubleStatueDropChance = perCharacter(() => getDoubleStatueDrop(account, selectedChar, characters));
  const doubleGoldenFoodDropChance = perCharacter(() => getDoubleGoldenFoodDrop(account, selectedChar, characters));
  const doubleStatueDropSize = composite(() => getDoubleStatueDropSize(account));
  const doubleGoldenFoodDropSize = composite(() => getDoubleGoldenFoodDropSize(account));
  const crystal = perCharacter(() => selectedChar?.crystalSpawnChance);
  const monument = composite(() => account?.hole?.caverns?.bravery?.afkPercent);
  const equinox = composite(() => account?.equinox);

  const formulas = [
    {
      id: 'crystalChance',
      name: 'Crystal chance',
      formula: crystal?.expression,
      value: crystal?.value,
      renderValue: (value) => `${formatNum(value, 'odds')} (${formatNum(value * 100, 'pct')})`,
      description: 'How often a crystal mob is spawned'
    },
    {
      id: 'respawnRate',
      name: 'Respawn rate',
      formula: respawnRate?.expression,
      value: respawnRate?.respawnRate,
      breakdown: respawnRate?.breakdown,
      renderValue: (value) => formatNum(value, 'pct'),
      // A fixed respawn's one line: the parser's "Respawn time 180" under a trigger reading "180%"
      drawer: (breakdown, text) => withLine(breakdown, 'Respawn time', { name: 'Respawn rate', formatted: text }),
      description: 'How often a mob is spawned'
    },
    {
      id: 'cashMulti',
      name: 'Cash multiplier',
      formula: cashMulti?.expression,
      value: cashMulti?.cashMulti,
      breakdown: cashMulti?.breakdown,
      renderValue: (value) => `${cashMultiText(value)}x`,
      description: 'Coin bonuses from all sources'
    },
    {
      id: 'expMulti',
      name: 'Exp multiplier',
      formula: expMulti?.expression,
      value: expMulti?.value,
      breakdown: expMulti?.breakdown,
      renderValue: (value) => formatNum(value, 'mult'),
      description: 'Exp bonuses from all sources'
    },
    {
      id: 'dropRate',
      name: 'Drop rate',
      formula: dropRate?.expression,
      value: dropRate?.dropRate,
      breakdown: dropRate?.breakdown,
      renderValue: (value) => `${formatGame(value, 'TotalStats.Drop_Rarity')}x`,
      description: 'Drop rate bonuses from all sources'
    },
    {
      id: 'monumentAfkBonus',
      name: 'Monument AFK bonus',
      formula: monument?.expression,
      value: monument?.value,
      renderValue: (value) => formatNum(value, 'pct', { precise: true }),
      description: 'Monument AFK bonuses from all sources'
    },
    {
      id: 'equinox',
      name: 'Equinox',
      formula: equinox?.expression,
      value: equinox?.chargeRate,
      renderValue: (value) => formatNum(value, 'rate'),
      description: 'Equinox bonuses from all sources'
    },
    {
      id: 'cropEvo',
      name: 'Crop evolution',
      formula: cropEvo?.expression,
      value: cropEvo?.value,
      breakdown: cropEvo?.breakdown,
      renderValue: (value) => formatNum(value, 'pct'),
      description: 'Crop evolution chance'
    },
    {
      id: 'printerMulti',
      name: 'Printer multiplier',
      formula: printerMulti?.expression,
      value: printerMulti?.value,
      breakdown: printerMulti?.breakdown,
      renderValue: (value) => formatNum(value, 'pct', { precise: true }),
      description: 'Printer multi bonuses from all sources'
    },
    {
      id: 'bitMulti',
      name: 'Bit multiplier',
      formula: bitMulti?.expression,
      value: bitMulti?.value,
      breakdown: bitMulti?.breakdown,
      renderValue: (value) => formatNum(value, 'pct'),
      description: 'Bit multi bonuses from all sources'
    },
    {
      id: 'goldenFoodMulti',
      name: 'Golden food multiplier',
      formula: goldenFoodMulti?.expression,
      value: goldenFoodMulti?.value,
      breakdown: goldenFoodMulti?.breakdown,
      renderValue: (value) => formatNum(value, 'mult'),
      description: 'Golden food multi bonuses from all sources'
    },
    {
      id: 'doubleStatueDropChance',
      name: 'Double statue drop chance',
      formula: doubleStatueDropChance?.expression,
      value: doubleStatueDropChance?.value,
      breakdown: doubleStatueDropChance?.breakdown,
      renderValue: doubleDropChance,
      description: 'Chance for monsters to drop twice as many statues'
    },
    {
      id: 'doubleStatueDropSize',
      name: 'Double statue drop size',
      formula: doubleStatueDropSize?.expression,
      value: doubleStatueDropSize?.value,
      breakdown: doubleStatueDropSize?.breakdown,
      renderValue: dropSize,
      drawer: (breakdown, text) => withLine(breakdown, '2x Drop Size', { formatted: text }),
      description: 'How many statues a double statue drop gives'
    },
    {
      id: 'doubleGoldenFoodDropChance',
      name: 'Double golden food drop chance',
      formula: doubleGoldenFoodDropChance?.expression,
      value: doubleGoldenFoodDropChance?.value,
      breakdown: doubleGoldenFoodDropChance?.breakdown,
      renderValue: doubleDropChance,
      description: 'Chance for monsters to drop twice as many golden foods'
    },
    {
      id: 'doubleGoldenFoodDropSize',
      name: 'Double golden food drop size',
      formula: doubleGoldenFoodDropSize?.expression,
      value: doubleGoldenFoodDropSize?.value,
      breakdown: doubleGoldenFoodDropSize?.breakdown,
      renderValue: dropSize,
      drawer: (breakdown, text) => withLine(breakdown, '2x Drop Size', { formatted: text }),
      description: 'How many golden foods a double golden food drop gives'
    }
  ];

  const search = toolbar.search.trim().toLowerCase();
  const shownFormulas = formulas.filter(({ name, description }) => !search
    || name.toLowerCase().includes(search) || description.toLowerCase().includes(search));

  return <>
    <NextSeo
      title="Formulas | Idleon Toolbox"
      description="Browse formulas and calculations for various Legends of Idleon game mechanics including damage, drop rates, and more"
    />
    {!characters ? <DataLoadingWrapper/> : <>
      <MissingSections account={account}/>
      {state?.emptyAccount ? <Notice tone={'signin'} sx={{ mb: 2 }}>Character formulas use your characters once you sign in.</Notice> : null}
      {characters.length ? <HeaderCharacterPicker characters={characters} value={String(selectedChar?.playerId ?? '')} onChange={setPickedChar}/> : null}
      <Box>
        <Toolbar state={toolbar} defaults={FORMULAS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                 total={formulas.length} shown={shownFormulas.length} noun={'formulas'}>
          <Toolbar.Search placeholder={'Search formulas'}/>
        </Toolbar>
        <Stack gap={1}>
          {shownFormulas.map(({ id, name, description, formula, value: rawValue, breakdown, renderValue, drawer }) => {
            // A numeric string is a number; anything else a failed section left reads "-", with nothing to open
            const value = typeof rawValue === 'string' ? Number(rawValue) : rawValue;
            const known = Number.isFinite(value);
            const text = known ? renderValue(value) : '-';
            // The drawer is headed with the value's own text, so the two read alike
            const shownBreakdown = drawer ? drawer(breakdown, text) : breakdown;
            const shown = known && breakdown ? <Breakdown data={{ ...shownBreakdown, totalValue: text }} skipNotation title={name} asValue>{text}</Breakdown> : text;
            return <Panel key={id} collapsible defaultOpen={false} title={name} meta={description}
                          aside={<Typography variant={'value'} component={'div'} sx={{ textAlign: 'right' }}>{shown}</Typography>}>
              <Stack gap={1} sx={{ p: 2 }}>
                {/* A formula the parser doesn't write out has no heading to sit under */}
                {formula ? <>
                  <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'}>Formula</Typography>
                  <Box sx={EXPRESSION_SX}><Highlighter>{formula}</Highlighter></Box>
                </> : null}
                <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'} sx={formula ? { mt: 1 } : undefined}>Result</Typography>
                <Typography variant={'value'} component={'div'}>{shown}</Typography>
              </Stack>
            </Panel>;
          })}
        </Stack>
      </Box>
    </>}
  </>;
};

export default Formulas;
