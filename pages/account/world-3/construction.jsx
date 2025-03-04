import React from 'react';
import ForwardIcon from '@mui/icons-material/Forward';

import styled from '@emotion/styled';
import ConstructionMain from '../../../components/account/Worlds/World3/construction/ConstructionMain';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import { Typography } from '@mui/material';
import CogStatCalculator from '../../../components/account/Worlds/World3/construction/CogStatCalculator';
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

const ReverseForwardIcon = styled(ForwardIcon)`
  transform: rotate(180deg);
`

export default Construction;
