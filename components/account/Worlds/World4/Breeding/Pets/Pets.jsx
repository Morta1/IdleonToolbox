import React, { useMemo } from 'react';
import { calcBreedabilityMulti, calcShinyLvMulti } from '@parsers/breeding';
import Tabber from '../../../../../common/Tabber';
import Other from '@components/account/Worlds/World4/Breeding/Pets/Other';
import All from '@components/account/Worlds/World4/Breeding/Pets/All';

const Pets = ({
                pets,
                account,
                characters,
                fencePetsObject
              }) => {

  const shinyMulti = useMemo(() => calcShinyLvMulti(account, characters), [pets]);
  const breedingMulti = useMemo(() => calcBreedabilityMulti(account, characters), [pets]);

  return <>
    <Tabber tabs={['All', 'Shinies', 'Breedability']} queryKey={'nt'}>
      <All></All>
      <Other fencePets={fencePetsObject} pets={pets.flat()} multi={shinyMulti} isShiny/>
      <Other fencePets={fencePetsObject} pets={pets.flat()} multi={breedingMulti}/>
    </Tabber>
  </>
};


export default Pets;
