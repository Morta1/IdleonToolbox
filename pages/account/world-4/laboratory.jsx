import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import Mainframe from 'components/account/Worlds/World4/Mainframe';
import Console from 'components/account/Worlds/World4/Console';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import LabRotation from '../../../components/account/Worlds/World4/LabRotation';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import { MissingData, isSectionFailed } from '@components/common/styles';

const Laboratory = () => {
  const { state } = useContext(AppContext);
  const lab = state?.account?.lab ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'lab');

  return (
    <>
      <NextSeo
        title="Laboratory | Idleon Toolbox"
        description="Keep track of your lab upgrades, lab connected players, chips and more"
      />
      {sectionFailed ? <MissingData name={'the Laboratory'} failed/> : null}
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 4'].categories, 'laboratory')}>
        <Mainframe {...lab} characters={state?.characters} account={state?.account} sectionFailed={sectionFailed}/>
        <Console {...lab} characters={state?.characters}/>
        <LabRotation sectionFailed={sectionFailed}/>
      </Tabber>
    </>
  );
};

export default Laboratory;
