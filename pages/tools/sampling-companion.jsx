import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import { Box } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { samplingSetups } from '../../data/sampling-setups';
import CardGrid from '@components/common/cards/CardGrid';
import DataLoadingWrapper from '@components/common/DataLoadingWrapper';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import { MissingSections } from '@components/common/styles';
import useToolbarState from '@hooks/useToolbarState';
import HeaderCharacterPicker from '@components/tools/HeaderCharacterPicker';
import Equipment from '@components/tools/sampling-companion/Equipment';
import Cards from '@components/tools/sampling-companion/Cards';
import Chips from '@components/tools/sampling-companion/Chips';
import Prayers from '@components/tools/sampling-companion/Prayers';
import Obols from '@components/tools/sampling-companion/Obols';
import StarSigns from '@components/tools/sampling-companion/StarSigns';
import { addEquippedItems, getAllItems, mergeItemsByOwner } from '@parsers/items';

const SECTION_NAMES = { lab: 'Laboratory', prayers: 'Prayers', starSigns: 'Star Signs', cards: 'Cards' };
const SETUP_IDS = Object.keys(samplingSetups);
const SAMPLING_TOOLBAR = { setup: SETUP_IDS[0] };

const SamplingCompanion = () => {
  const { state } = useContext(AppContext);
  const [pickedChar, setPickedChar] = useLocalStorage({ key: 'sampling-companion:character' });
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('sampling-companion', SAMPLING_TOOLBAR);
  const characters = state?.characters;
  const selectedChar = characters?.[pickedChar] ?? characters?.[0] ?? {};
  const selectedSetup = samplingSetups[toolbar.setup] ?? samplingSetups[SETUP_IDS[0]];
  const items = mergeItemsByOwner([...addEquippedItems(characters, true), ...(getAllItems(characters, state?.account) || [])]);

  return (
    <>
      <NextSeo
        title="Sampling Companion | Idleon Toolbox"
        description="Find out what your character needs for optimal sampling setups"
      />
      {!characters ? <DataLoadingWrapper/> : <>
        <MissingSections account={state?.account} names={SECTION_NAMES}/>
        {state?.emptyAccount ? <Notice tone={'signin'} sx={{ mb: 2 }}>Compares a setup with your characters once you sign in.</Notice> : null}
        {characters.length ? <HeaderCharacterPicker characters={characters} value={String(selectedChar?.playerId ?? '')} onChange={setPickedChar}/> : null}
        <Box>
          {/* A setup is a pick, not a filter: its default follows it, so no "Showing" line */}
          <Toolbar state={toolbar} defaults={{ setup: toolbar.setup }} onChange={setToolbar} onReset={resetToolbar}
                   panelLabel={'Setup'} total={SETUP_IDS.length} shown={SETUP_IDS.length} noun={'setups'}>
            <Toolbar.Show name={'setup'} label={'Setup'} options={Object.entries(samplingSetups).map(([id, { name }]) => [id, name])}/>
          </Toolbar>
          <CardGrid size={'l'}>
            <Equipment
              hideEmpty
              weaponByClass={selectedSetup?.weaponByClass}
              equipment={selectedSetup?.equipment}
              tools={selectedSetup?.tools}
              food={selectedSetup?.food}
              character={selectedChar}
              characters={characters}
              account={state?.account}
              allAccountItems={items}
            />
            <Cards cards={selectedSetup?.cards}
                   cardSet={selectedSetup?.cardSet}
                   account={state?.account} character={selectedChar}/>
            <Chips chips={selectedSetup?.chips} character={selectedChar} account={state?.account}/>
            <Prayers prayers={selectedSetup?.prayers} character={selectedChar} account={state?.account}/>
            <Obols obols={selectedSetup?.obols} character={selectedChar} account={state?.account}/>
            <StarSigns starSigns={selectedSetup?.starSigns} character={selectedChar} account={state?.account}/>
          </CardGrid>
        </Box>
      </>}
    </>
  );
};

export default SamplingCompanion;
