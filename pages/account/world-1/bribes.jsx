import React, { Fragment, useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getCoinsArray } from 'utility/helpers';
import CoinDisplay from 'components/common/CoinDisplay';
import { NextSeo } from 'next-seo';
import { getBribes, getBribeSets } from '@parsers/world-1/bribes';
import { MissingData, isSectionFailed } from '@components/common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const coins = (amount) => <CoinDisplay dense money={getCoinsArray(amount)}/>;

const Bribes = () => {
  const { state } = useContext(AppContext);
  const bribesFailed = isSectionFailed(state?.account, 'bribes');
  // A failed section lists every bribe at zero (the parser's catalog with no save), with no cost or Purchased
  const bribes = bribesFailed ? getBribes({}) : state?.account?.bribes ?? [];
  // Signed out, every set reads as it does in the game's shop before the first bribe
  const signedIn = Boolean(state?.account?.bribes?.length) && !bribesFailed;
  const sets = getBribeSets(state?.account, bribes);

  const bribeCard = ({ name, desc, price, value, state: bribeState, needs, notForSale }) => {
    const purchased = signedIn && bribeState === 'bought';
    const locked = signedIn && (bribeState === 'locked' || Boolean(needs));
    // The game's text says 5%; the bribe gives its value
    const description = name === 'Insider_Trading' ? desc?.replace('5%', `${value}%`) : desc;
    const facts = [
      ...(needs ? [['Needs', needs]] : []),
      ...(notForSale ? [['Cost', 'Not for sale']] : [['Cost', coins(price)]])
    ];
    return <ItemCard key={name} title={cleanUnderscore(name)}
                     status={purchased ? 'done' : locked ? 'locked' : undefined}
                     statusLabel={purchased ? 'Purchased' : locked ? 'Locked' : undefined}
                     dimmed={locked}
                     footer={purchased || bribesFailed ? null : <ItemCard.Facts rows={facts}/>}>
      <ItemCard.Desc text={description}/>
    </ItemCard>;
  };

  return (
    <>
      <NextSeo
        title="Bribes | Idleon Toolbox"
        description="Track your bribe status, costs, and bonus effects across all Legends of Idleon worlds"
      />
      {bribesFailed ? <MissingData name={'Bribes'} failed atZero/> : null}
      <Stack gap={3}>
        {sets.map(({ bribes: setBribes, unlockedBy, costLeft }, setIndex) => {
          const left = setBribes.filter(({ state: bribeState, notForSale }) => bribeState !== 'bought' && !notForSale).length;
          const meta = [
            unlockedBy ? `Unlocked by ${cleanUnderscore(unlockedBy)}` : 'Open from the start',
            signedIn && left ? `${left} left` : null
          ].filter(Boolean);
          return <Box component={'section'} key={setIndex}>
            <Stack direction={'row'} alignItems={'baseline'} flexWrap={'wrap'} columnGap={1.5} sx={{ mb: 1.5 }}>
              <Typography variant={'sectionTitle'} component={'h2'}>Set {setIndex + 1}</Typography>
              <Typography variant={'body2'} color={'text.secondary'} component={'div'}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                {meta.map((part, index) => <Fragment key={index}>{index ? ' · ' : null}{part}</Fragment>)}
                {signedIn && costLeft > 0 ? <> · For sale now: {coins(costLeft)}</> : null}
              </Typography>
            </Stack>
            <CardGrid size={'s'}>{setBribes.map(bribeCard)}</CardGrid>
          </Box>;
        })}
      </Stack>
    </>
  );
};

export default Bribes;
