import React, { useMemo } from 'react';
import { calcBreedabilityMulti, calcShinyLvMulti } from '@parsers/breeding';
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

  const shinyMulti = useMemo(() => calcShinyLvMulti(account, characters), [pets]);
  const breedingMulti = useMemo(() => calcBreedabilityMulti(account, characters), [pets]);

  return <>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 4'].categories, 'breeding', 'Pets')} queryKey={'nt'}>
      <Other fencePets={fencePetsObject} pets={pets.flat()} multi={shinyMulti} isShiny/>
      <Other fencePets={fencePetsObject} pets={pets.flat()} multi={breedingMulti}/>
      <All pets={pets} />
    </Tabber>
  </>
};


export default Pets;
