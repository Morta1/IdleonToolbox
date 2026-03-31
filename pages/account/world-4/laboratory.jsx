import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import Mainframe from 'components/account/Worlds/World4/Mainframe';
import Console from 'components/account/Worlds/World4/Console';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import LabRotation from '../../../components/account/Worlds/World4/LabRotation';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';

const Laboratory = () => {
  const { state } = useContext(AppContext);
  const { lab } = state?.account || {};

  return (
    <>
      <NextSeo
        title="Laboratory | Idleon Toolbox"
        description="Keep track of your lab upgrades, lab connected players, chips and more"
      />
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 4'].categories, 'laboratory')}>
        <Mainframe {...lab} characters={state?.characters} divinity={state?.account?.divinity}/>
        <Console {...lab} characters={state?.characters}/>
        <LabRotation/>
      </Tabber>
    </>
  );
};

export default Laboratory;
