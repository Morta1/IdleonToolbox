import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { notateNumber } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { getTabs } from '@utility/helpers';
import Upgrades from '@components/account/Worlds/World7/Minehead/Upgrades';
import Opponents from '@components/account/Worlds/World7/Minehead/Opponents';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Minehead = () => {
  const { state } = useContext(AppContext);
  const minehead = state?.account?.minehead;
  const account = state?.account;

  if (!minehead) return <MissingData name={'minehead'} />;

  const {
    opponentsBeat,
    mineCurrency,
    dailyTriesLeft,
    dailyTriesMax,
    maxHP_You,
    baseDMG,
    currencyGain,
    currencyGainBreakdown,
    upgrades,
    opponents
  } = minehead;

  return <>
    <NextSeo
      title="Minehead | Idleon Toolbox"
      description="Track your Minehead upgrade levels, opponent stats, and bonus progression in Legends of Idleon World 7"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue
        title={'Mine Currency'}
        value={notateNumber(mineCurrency ?? 0, 'Big')}
        icon={'data/MineUpgBG.png'}
        imgStyle={{ width: 24, height: 24 }}
      />
      <CardTitleAndValue
        title={'Daily Tries'}
        value={`${dailyTriesLeft ?? 0} / ${dailyTriesMax ?? 3}`}
      />
      <CardTitleAndValue
        title={'Opponents Beat'}
        value={opponentsBeat ?? 0}
      />
      <CardTitleAndValue
        title={'Max Lives'}
        value={maxHP_You ?? 3}
      />
      <CardTitleAndValue
        title={'Base DMG'}
        value={notateNumber(baseDMG ?? 1, 'Big')}
      />
      <CardTitleAndValue
        title={'Currency / hr'}
        value={
          <Stack direction={'row'} gap={.5} alignItems={'center'}>
            {notateNumber(currencyGain ?? 0, 'Big')}
            <Breakdown data={currencyGainBreakdown}>
              <IconInfoCircleFilled size={16} style={{ display: 'block' }} />
            </Breakdown>
          </Stack>
        }
      />
    </Stack>

    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'minehead')}>
      <Upgrades upgrades={upgrades} account={account} />
      <Opponents opponents={opponents} opponentsBeat={opponentsBeat} />
    </Tabber>
  </>;
};

export default Minehead;
