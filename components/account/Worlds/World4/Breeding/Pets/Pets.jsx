import React from 'react';
import { calcBreedabilityMulti, calcShinyLvMulti, getKillPetTimeCharacters } from '@parsers/world-4/breeding';
import Tabber from '../../../../../common/Tabber';
import Other from '@components/account/Worlds/World4/Breeding/Pets/Other';
import All from '@components/account/Worlds/World4/Breeding/Pets/All';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';

const Pets = ({
                pets,
                account,
                characters,
                fencePetsObject
              }) => {

  const shinyMulti = calcShinyLvMulti(account, characters);
  const breedingMulti = calcBreedabilityMulti(account, characters);
  const killCharacters = getKillPetTimeCharacters(characters);

  return <>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 4'].categories, 'breeding', 'Mobs')} queryKey={'nt'}>
      <Other fencePets={fencePetsObject} pets={pets.flat()} multi={shinyMulti} killCharacters={killCharacters} isShiny/>
      <Other fencePets={fencePetsObject} pets={pets.flat()} multi={breedingMulti} killCharacters={killCharacters}/>
      <All pets={pets} />
    </Tabber>
  </>
};


export default Pets;
