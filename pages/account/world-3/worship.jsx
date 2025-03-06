import React from 'react';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import Charge from '@components/account/Worlds/World3/worship/Charge';
import Totems from '@components/account/Worlds/World3/worship/Totems';
import MsaTotalizer from '@components/account/Worlds/World3/worship/MsaTotalizer';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';

const Worship = () => {
  return (
    <>
      <NextSeo
        title="Worship | Idleon Toolbox"
        description="Keep track of your worship charge and charge rate for all of your characters"
      />
      <MsaTotalizer/>
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'worship')}>
        <Charge/>
        <Totems/>
      </Tabber>
    </>
  );
};

export default Worship;
