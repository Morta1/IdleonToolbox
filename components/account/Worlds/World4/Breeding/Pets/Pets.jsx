import React from 'react';
import { calcBreedabilityMulti, calcShinyLvMulti, isKillPetTimeUnlocked } from '@parsers/world-4/breeding';
import Tabber from '../../../../../common/Tabber';
import Other from '@components/account/Worlds/World4/Breeding/Pets/Other';
import All from '@components/account/Worlds/World4/Breeding/Pets/All';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';

const Pets = ({
                pets,
                account,
                characters,
                fencePetsObject,
                sectionFailed
              }) => {

  const shinyMulti = calcShinyLvMulti(account, characters);
  const breedingMulti = calcBreedabilityMulti(account, characters);
  const killPetTimeUnlocked = isKillPetTimeUnlocked(characters);
  const allPets = pets?.flat() ?? [];

  return <>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 4'].categories, 'breeding', 'Mobs')} level={2} label={'Mobs'}>
      <Other fencePets={fencePetsObject} pets={allPets} multi={shinyMulti} killPetTimeUnlocked={killPetTimeUnlocked} isShiny
             sectionFailed={sectionFailed}/>
      <Other fencePets={fencePetsObject} pets={allPets} multi={breedingMulti} killPetTimeUnlocked={killPetTimeUnlocked}
             sectionFailed={sectionFailed}/>
      <All pets={pets} />
    </Tabber>
  </>
};


export default Pets;
