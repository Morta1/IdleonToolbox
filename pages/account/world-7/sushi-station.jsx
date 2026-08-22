import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import HtmlTooltip from '@components/Tooltip';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, getTabs, notateNumber, prefix, secondsToCoarseDuration } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import Sushi from '@components/account/Worlds/World7/SushiStation/Sushi';
import Upgrades from '@components/account/Worlds/World7/SushiStation/Upgrades';
import Bonuses from '@components/account/Worlds/World7/SushiStation/Bonuses';
import SushiBonuses from '@components/account/Worlds/World7/SushiStation/SushiBonuses';

const toDuration = (hours) => secondsToCoarseDuration((hours ?? 0) * 3600) ?? 'never';

const buildMultiBreakdown = ({ statName, multi, rawLabel, raw, perHr, extraSources = [], breakpoints }) => ({
  statName,
  totalValue: `${(1 + (multi ?? 0) / 100).toFixed(2)}x`,
  categories: [
    {
      name: 'Next breakpoints',
      sources: breakpoints?.map(({ multi: target, required, hours }) => ({
        name: `${target.toFixed(2)}x`,
        value: required,
        formatted: `${notateNumber(required, 'Big')} · ${toDuration(hours)}`
      })) ?? []
    },
    {
      name: 'Generation',
      sources: [
        { name: rawLabel, value: raw ?? 0, formatted: notateNumber(Math.floor(raw ?? 0), 'Big') },
        {
          name: 'Per hour',
          value: perHr ?? 0,
          formatted: perHr > 0 ? notateNumber(perHr, 'Big') : 'Not generating'
        },
        ...extraSources
      ]
    }
  ]
});

const MultiCard = ({ title, icon, imgStyle, data }) => <CardTitleAndValue title={title}>
  <Stack direction={'row'} alignItems={'center'} gap={1}>
    {icon ? <img style={{ objectFit: 'contain', ...imgStyle }} src={`${prefix}${icon}`} alt={''}/> : null}
    <Typography component={'div'}>{data.totalValue}</Typography>
    <Breakdown data={data} skipNotation>
      <IconInfoCircleFilled size={18} style={{ cursor: 'pointer', display: 'block' }}/>
    </Breakdown>
  </Stack>
</CardTitleAndValue>;

const SushiStation = () => {
  const { state } = useContext(AppContext);
  const sushiStation = state?.account?.sushiStation;

  const {
    uniqueSushi,
    fuel,
    currency,
    upgrades,
    knowledge,
    rogBonuses,
    slots,
    fireplaces,
    shakerUses,
    knowledgeSummary,
    sushiCooking,
    sparks,
    sparkBonus
  } = sushiStation || {};
  const overtuned = currency?.overtuned;

  return <>
    <NextSeo
      title="Sushi Station | Idleon Toolbox"
      description="Track your Sushi Station upgrades, sushi collection, fuel, and Ring of Gains bonuses in Legends of Idleon World 7"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue
        title={'Unique Sushi'}
        value={uniqueSushi ?? 0}
      />
      <CardTitleAndValue
        title={'Bucks'}
        value={notateNumber(Math.floor(currency?.bucks ?? 0))}
        icon={'etc/Bucks.png'}
      />
      <CardTitleAndValue
        title={'Bucks/hr'}
        value={Math.floor(currency?.currencyPerHR ?? 0) < 1e8
          ? commaNotation(Math.floor(currency?.currencyPerHR ?? 0))
          : notateNumber(Math.floor(currency?.currencyPerHR ?? 0), 'Big')}
        icon={'etc/Bucks.png'}
      />
      <CardTitleAndValue
        title={'Fuel'}
        value={`${notateNumber(fuel?.current ?? 0, 'Big')} / ${notateNumber(fuel?.cap ?? 0, 'Big')}`}
        icon={'etc/Fuel.png'}
      />
      <CardTitleAndValue
        title={'Fuel/hr'}
        icon={'etc/Fuel.png'}
        value={notateNumber(fuel?.generation ?? 0, 'Big')}
      />
      {(sparks > 0 || sparkBonus?.potassiumCount > 0) && <MultiCard
        title={'Spark Multi'}
        imgStyle={{ width: 24, height: 24 }}
        data={buildMultiBreakdown({
          statName: 'Spark Multi',
          multi: sparkBonus?.multi,
          rawLabel: 'Sparks',
          raw: sparks,
          perHr: sparkBonus?.perHr,
          breakpoints: sparkBonus?.nextBreakpoints,
          extraSources: [
            {
              name: 'Potassium fireplaces',
              value: sparkBonus?.potassiumCount ?? 0,
              formatted: `${sparkBonus?.potassiumCount ?? 0} / 15`
            },
            { name: 'Boosts', value: 0, formatted: 'All fireplace bonuses' },
            { name: 'Each 0.01x costs', value: 0, formatted: '~4x the previous sparks' }
          ]
        })}
      />}
      {overtuned?.unlocked && <MultiCard
        title={'Overtuned Multi'}
        data={buildMultiBreakdown({
          statName: 'Overtuned Multi',
          multi: overtuned?.multi,
          rawLabel: 'Overtuned fuel',
          raw: overtuned?.value,
          perHr: overtuned?.perHr,
          breakpoints: overtuned?.nextBreakpoints,
          extraSources: [
            { name: 'Source', value: 0, formatted: 'Fuel generated while at max capacity' },
            { name: 'Boosts', value: 0, formatted: 'All Bucks gained' },
            ...(overtuned?.hoursToFuelCap > 0
              ? [{
                name: 'Fuel reaches cap in',
                value: overtuned.hoursToFuelCap,
                formatted: toDuration(overtuned.hoursToFuelCap)
              }]
              : [])
          ]
        })}
      />}
      {uniqueSushi < rogBonuses?.length && knowledge?.[uniqueSushi] && (() => {
        const tier = uniqueSushi;
        const fuelCost = tier === 5 ? 176 : 10 * Math.pow(1.83, tier) - Math.pow(tier, 2);
        return <CardTitleAndValue
          title={'Next Unlock'}
          icon={`data/Sushi${uniqueSushi}.png`}
          imgStyle={{ width: 24, height: 24 }}
          value={`${knowledge[uniqueSushi].name} (${notateNumber(Math.ceil(fuelCost), 'Big')} fuel)`}
          tooltipTitle={`Cook a Tier ${tier} sushi to discover ${knowledge[uniqueSushi].name}`}
        />;
      })()}
      {sushiCooking?.nextUnperfectedIdx >= 0 && <CardTitleAndValue
        title={'Perfecto Chance'}
        value={<Stack direction="row" gap={0.5} alignItems="center">
          {`${parseFloat((sushiCooking?.perfectOdds * 100)?.toFixed(2))}%`}
          <HtmlTooltip title={`Base chance to Perfecto ${knowledge?.[sushiCooking.nextUnperfectedIdx]?.name || 'next sushi'}`}>
            <InfoIcon sx={{ fontSize: 16 }}/>
          </HtmlTooltip>
        </Stack>}
      />}
      <CardTitleAndValue
        title={'Salt Shaker'}
        value={shakerUses?.[0] || '0'}
        tooltipTitle={'Chance to tier-up all sushi'}
      />
      <CardTitleAndValue
        title={'Pepper Shaker'}
        value={shakerUses?.[1] || '0'}
        tooltipTitle={'Chance to Perfecto sushi (2x knowledge bonus)'}
      />
      <CardTitleAndValue
        title={'Saffron Shaker'}
        value={shakerUses?.[2] || '0'}
        tooltipTitle={'Generate 1 hour\'s worth of Bucks instantly'}
      />
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'sushiStation')}>
      <Sushi slots={slots} knowledge={knowledge} fireplaces={fireplaces}/>
      <Upgrades upgrades={upgrades} characters={state?.characters}/>
      <Bonuses rogBonuses={rogBonuses} uniqueSushi={uniqueSushi} knowledge={knowledge}/>
      <SushiBonuses knowledgeSummary={knowledgeSummary}/>
    </Tabber>
  </>;
};

export default SushiStation;
