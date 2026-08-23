import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import StructuredData, { createHowToData } from '@components/common/StructuredData';
import MinibossHp from '@components/tools/bone-joe-calculator/MinibossHp';
import CharacterMinibosses from '@components/tools/bone-joe-calculator/CharacterMinibosses';
import { useBoneJoeConfig } from '@hooks/useBoneJoeConfig';

const BoneJoeCalculator = () => {
  const { state } = useContext(AppContext);
  const { overridePickles, overrideHpMulti, ...config } = useBoneJoeConfig();

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
        'Set the levels of the three prayers that curse monster HP',
        'Read the resulting HP for each of the nine minibosses',
        'Check the per character table for how many pickles each character can carry and still one shot'
      ]
    )}/>
    <Stack gap={3}>
      <Typography variant={'body2'} sx={{ maxWidth: 900 }}>
        Every Bone Joe Pickle in a character&apos;s inventory multiplies miniboss HP by 1.1, and makes each miniboss
        kill count as one extra Deathnote kill on the page the Revenge of the Pickle equinox upgrade unlocks. Big Brain
        Time, Midas Minded and Jawbreaker stack on top of that, since all three curse monster HP.
      </Typography>
      <MinibossHp {...config}/>
      <CharacterMinibosses
        characters={state?.characters}
        account={state?.account}
        overridePickles={overridePickles}
        overrideHpMulti={overrideHpMulti}
      />
    </Stack>
  </>;
};

export default BoneJoeCalculator;
