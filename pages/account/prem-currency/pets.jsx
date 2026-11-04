import { NextSeo } from 'next-seo';
import { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { formatNum, getNextCompanionClaim, getTabs } from '@utility/helpers';
import Timer from '@components/common/Timer';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import StatusText from '@components/common/StatusText';
import PetCollection, { PET_CRYSTAL_LOOK } from '@components/account/Pets/PetCollection';
import PetMart from '@components/account/Pets/PetMart';
import { getCompanions } from '@parsers/misc';

const Pets = () => {
  const { state } = useContext(AppContext);
  const companionsFailed = isSectionFailed(state?.account, 'companions');
  // A failed section draws the game's pets at zero (the parser's own empty save): no copy, token or simulation
  const companions = companionsFailed ? getCompanions(undefined, []) : state?.account?.companions;
  const anchor = companions?.freeClaimAnchor;
  const count = (value) => (companionsFailed ? '-' : formatNum(value ?? 0));

  return <>
    <NextSeo
      title="Pets | Idleon Toolbox"
      description="View your pet collection, Pet Mart+ upgrades and bonuses, trade offers, and the daily Pet Mart rotation in Legends of Idleon"
    />
    {companionsFailed ? <MissingData name={'Pets'} failed/> : null}
    <PageSummary>
      <StatTile label={'Pet crystals'} icon={'data/PremiumGem.png'} imgStyle={PET_CRYSTAL_LOOK} value={count(companions?.petCrystals)}/>
      <StatTile label={'Boxes opened'} value={count(companions?.totalBoxesOpened)}/>
      <StatTile label={'Tokens available'} icon={'data/Quest119.png'} value={count(companions?.tokens?.remaining)}/>
      <StatTile label={'Token bonuses active'} icon={'data/Quest119.png'} value={count(companions?.tokens?.used)}/>
      {/* The claim deadline is absolute (getNextCompanionClaim), so the Timer takes no lastUpdated: the save's age is no
          part of it */}
      <StatTile label={'Next free pet'} value={companionsFailed || !Number.isFinite(anchor) ? '-'
        : <Timer type={'countdown'} date={getNextCompanionClaim(state?.account)} component={'span'}
                 placeholder={<StatusText status={'ready'}>Ready to claim</StatusText>}/>}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['prem-currency'].categories, 'pets')}>
      <PetCollection companions={companions?.list} sectionFailed={companionsFailed}/>
      <PetMart petMart={state?.account?.tournament?.petMart} companions={companions?.list}/>
    </Tabber>
  </>
};

export default Pets;
