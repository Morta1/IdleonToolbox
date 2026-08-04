import React from 'react';
import ConstructionMain from '../../../components/account/Worlds/World3/Construction/ConstructionMain';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import CogStatCalculator from '../../../components/account/Worlds/World3/Construction/CogStatCalculator';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';

const Construction = () => {

  return <>
    <NextSeo
      title="Construction | Idleon Toolbox"
      description="Keep track of your construction board, cogs information and more"
    />
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'construction')}>
      <ConstructionMain/>
      <CogStatCalculator/>
    </Tabber>
  </>
}

export default Construction;
