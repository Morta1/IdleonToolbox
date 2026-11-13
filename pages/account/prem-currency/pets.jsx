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
import PetCollection, { canSimulatePets, PET_CRYSTAL_LOOK } from '@components/account/Pets/PetCollection';
import { PageSettingsRoom } from '@components/common/PageSettings';
import PetMart from '@components/account/Pets/PetMart';
import { getCompanions, getPetMartPack } from '@parsers/misc';

const Pets = () => {
  const { state } = useContext(AppContext);
  const companionsFailed = isSectionFailed(state?.account, 'companions');
  const tournamentFailed = isSectionFailed(state?.account, 'tournament');
  const failedNames = [companionsFailed && 'Pets', tournamentFailed && 'Pet Mart'].filter(Boolean);
  // A failed section draws the game's pets at zero (the parser's own empty save): no copy, token or simulation
  const companions = companionsFailed ? getCompanions(undefined, []) : state?.account?.companions;
  const anchor = companions?.freeClaimAnchor;
  // The pet pack in the Pet Mart's first slot, read from the save's server vars and bundles
  const pack = companionsFailed || isSectionFailed(state?.account, 'bundles') ? null
    : getPetMartPack(state?.account?.bundles, state?.account?.serverVars, companions?.list);
  const count = (value) => (companionsFailed ? '-' : formatNum(value ?? 0));

  return <>
    <NextSeo
      title="Pets | Idleon Toolbox"
      description="View your pet collection, Pet Mart+ upgrades and bonuses, trade offers, and the daily Pet Mart rotation in Legends of Idleon"
    />
    {failedNames.length ? <MissingData name={failedNames.join(' and ')} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Pet crystals'} icon={'data/PremiumGem.png'} imgStyle={PET_CRYSTAL_LOOK} value={count(companions?.petCrystals)}/>
      <StatTile label={'Boxes opened'} value={count(companions?.totalBoxesOpened)}/>
      {/* The game opens no box, free or bought, once the pets held reach the cap */}
      <StatTile label={'Pet storage'} value={companionsFailed ? '-' : `${count(companions?.storedPets)} / ${count(companions?.maxStorage)}`}/>
      <StatTile label={'Tokens available'} icon={'data/Quest119.png'} value={count(companions?.tokens?.remaining)}/>
      <StatTile label={'Token bonuses active'} icon={'data/Quest119.png'} value={count(companions?.tokens?.used)}/>
      {/* The claim deadline is absolute (getNextCompanionClaim), so the Timer takes no lastUpdated: the save's age is no
          part of it */}
      <StatTile label={'Next free pet'} value={companionsFailed || !Number.isFinite(anchor) ? '-'
        : <Timer type={'countdown'} date={getNextCompanionClaim(state?.account)} component={'span'}
                 placeholder={<StatusText status={'ready'}>Ready to claim</StatusText>}/>}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['prem-currency'].categories, 'pets')}>
      <PetCollection companions={companions?.list} sectionFailed={companionsFailed} tournamentFailed={tournamentFailed}/>
      <>
        {canSimulatePets(state, companionsFailed) ? <PageSettingsRoom/> : null}
        <PetMart petMart={state?.account?.tournament?.petMart} companions={companions?.list} pack={pack} lastUpdated={state?.lastUpdated}
                 sectionFailed={tournamentFailed} companionsFailed={companionsFailed} guest={Boolean(state?.emptyAccount)}/>
      </>
    </Tabber>
  </>
};

export default Pets;
