import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import StructuredData, { createHowToData } from '@components/common/StructuredData';
import MinibossHp from '@components/tools/bone-joe-calculator/MinibossHp';
import CharacterMinibosses from '@components/tools/bone-joe-calculator/CharacterMinibosses';
import { useBoneJoeConfig } from '@hooks/useBoneJoeConfig';
import { isSectionFailed, MissingSections } from '@components/common/styles';

// The damage column reads the last three too: without them it says "-" and the page says why
const SECTION_NAMES = { prayers: 'Prayers', hole: 'The Hole', alchemy: 'Alchemy', breeding: 'Breeding', legendTalents: 'Legend Talents' };

const BoneJoeCalculator = () => {
  const { state } = useContext(AppContext);
  const {
    overridePickles,
    overrideHpMulti,
    targetHits,
    setTargetHits,
    maxTargetHits,
    debouncedTargetHits,
    ...config
  } = useBoneJoeConfig(state?.account, state?.characters);

  return <>
    <NextSeo
      title="Bone Joe Calculator | Idleon Toolbox"
      description="Work out miniboss HP for any Bone Joe Pickle count and prayer setup, and how many pickles each of your characters can carry"
    />
    <StructuredData data={createHowToData(
      'How to calculate Bone Joe Pickle miniboss HP in Legends of Idleon',
      'Use the Bone Joe Calculator to see how Bone Joe Pickles and prayer curses scale miniboss HP.',
      [
        'Enter the number of Bone Joe Pickles you carry',
        'Pick which of the three prayers that curse monster HP are equipped',
        'Read the resulting HP for each of the nine minibosses',
        'Check the per character table for how many pickles each character can carry and still kill in your target number of hits'
      ]
    )}/>
    <MissingSections account={state?.account} names={SECTION_NAMES}/>
    <Stack gap={3}>
      <Typography variant={'body2'} color={'text.secondary'}>
        Every Bone Joe Pickle in a character&apos;s inventory multiplies miniboss HP by 1.1, and makes each miniboss
        kill count as one extra Deathnote kill on the page the Revenge of the Pickle equinox upgrade unlocks. Big Brain
        Time, Midas Minded and Jawbreaker stack on top of that, since all three curse monster HP.
      </Typography>
      <MinibossHp {...config} targetHits={targetHits} setTargetHits={setTargetHits} maxTargetHits={maxTargetHits}
                  showTargetHits={Boolean(state?.characters?.length) && !isSectionFailed(state?.account, 'hole')}/>
      <CharacterMinibosses
        characters={state?.characters}
        account={state?.account}
        overridePickles={overridePickles}
        overrideHpMulti={overrideHpMulti}
        debouncedTargetHits={debouncedTargetHits}
      />
    </Stack>
  </>;
};

export default BoneJoeCalculator;
