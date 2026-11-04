import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, getCoinsArray } from 'utility/helpers';
import CoinDisplay from 'components/common/CoinDisplay';
import { NextSeo } from 'next-seo';
import { getBribes } from '@parsers/world-1/bribes';
import { MissingData, isSectionFailed } from '@components/common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const Bribes = () => {
  const { state } = useContext(AppContext);
  const bribesFailed = isSectionFailed(state?.account, 'bribes');
  // A failed section lists every bribe at zero (the parser's catalog with no save), with no cost or Purchased
  const bribes = bribesFailed ? getBribes({}) : state?.account?.bribes ?? [];

  return (
    <>
      <NextSeo
        title="Bribes | Idleon Toolbox"
        description="Track your bribe status, costs, and bonus effects across all Legends of Idleon worlds"
      />
      {bribesFailed ? <MissingData name={'Bribes'} failed/> : null}
      <CardGrid size={'s'}>
        {bribes?.map(({ name, desc, price, done, value }) => {
          const purchased = !bribesFailed && done;
          // The game's text says 5%; the bribe gives its value
          const description = name === 'Insider_Trading' ? desc?.replace('5%', `${value}%`) : desc;
          return <ItemCard key={name} title={cleanUnderscore(name)}
                           status={purchased ? 'active' : undefined} statusLabel={purchased ? 'Purchased' : undefined}
                           footer={purchased || bribesFailed ? null
                             : <ItemCard.Facts rows={[['Cost', <CoinDisplay key={'cost'} dense money={getCoinsArray(price)}/>]]}/>}>
            <ItemCard.Desc text={description}/>
          </ItemCard>;
        })}
      </CardGrid>
    </>
  );
};

export default Bribes;
