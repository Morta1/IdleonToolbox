import React from 'react';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Chapters from './Chapters';
import LoreBosses from './LoreBosses';

const Lore = ({ chapters, loreBosses, bestCaveLevels }) => {
  return (
    <>
      <Tabber
        queryKey={'nt'}
        clearOnChange={['dnt']}
        tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'spelunking', 'Lore')}>
        <Chapters chapters={chapters} />
        <LoreBosses loreBosses={loreBosses} bestCaveLevels={bestCaveLevels} />
      </Tabber>
    </>
  );
}

export default Lore;
