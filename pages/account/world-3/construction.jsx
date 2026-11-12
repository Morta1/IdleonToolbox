import React, { useContext } from 'react';
import ConstructionMain from '../../../components/account/Worlds/World3/Construction/ConstructionMain';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import CogStatCalculator from '../../../components/account/Worlds/World3/Construction/CogStatCalculator';
import CogMakers from '@components/account/Worlds/World3/Construction/CogMakers';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isSectionFailed } from '@components/common/styles';

const Construction = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'construction');
  return <>
    <NextSeo
      title="Construction | Idleon Toolbox"
      description="Keep track of your construction board, cogs information and more"
    />
    {failed ? <MissingData name={'Construction'} failed/> : null}
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'construction')}>
      <ConstructionMain sectionFailed={failed}/>
      <CogMakers/>
      <CogStatCalculator/>
    </Tabber>
  </>
}

export default Construction;
