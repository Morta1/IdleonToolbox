import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import Charge from '@components/account/Worlds/World3/Worship/Charge';
import Totems from '@components/account/Worlds/World3/Worship/Totems';
import MsaTotalizer from '@components/account/Worlds/World3/Worship/MsaTotalizer';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isSectionFailed } from '@components/common/styles';

const Worship = () => {
  const { state } = useContext(AppContext);
  const failed = ['msaTotalizer', 'totems', 'towers'].filter((section) => isSectionFailed(state?.account, section));
  return (
    <>
      <NextSeo
        title="Worship | Idleon Toolbox"
        description="Keep track of your worship charge and charge rate for all of your characters"
      />
      {failed.length ? <MissingData name={'Worship'} failed/> : null}
      <MsaTotalizer/>
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'worship')}>
        <Charge/>
        <Totems totemsFailed={failed.includes('totems')} towersFailed={failed.includes('towers')}/>
      </Tabber>
    </>
  );
};

export default Worship;
