import { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, prefix } from '@utility/helpers';
import { monsterSprite } from '@utility/spriteImages';
import { NextSeo } from 'next-seo';
import { companions as companionsData } from '@website-data';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Tabber from '../../../components/common/Tabber';
import useTabIndex from '@hooks/useTabIndex';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { getBundles } from '@parsers/misc';
import { petCrystalIcon } from '@components/account/Pets/PetCollection';

// The bundle list holds two different purchases. The bun_/bon_/ban_ bundles are the classic gem
// shop ones, and the game ships a banner for each. The bin_ ones are the Pet Mart packs: a
// companion plus gems and pet crystals, rotating with the pets you already own, and with no banner
// art anywhere in the game's images. They are counted apart so neither total is measured against
// the other's catalog. The Starter Pack offer gets its own tab for the same reason: three portrait
// cards of which an account buys exactly one, so it neither fits the banner grid nor counts as three.
const TABS = ['Bundles', 'Pet Mart', 'Starter Pack'];
const BUNDLES_TOOLBAR = { hideOwned: false };

const amountWith = (icon, value) => <Stack direction={'row'} gap={0.5} alignItems={'center'} component={'span'}>
  {icon}{formatNum(value ?? 0)}
</Stack>;

const Bundles = () => {
  const { state } = useContext(AppContext);
  const [tab] = useTabIndex(TABS);
  const failed = isSectionFailed(state?.account, 'bundles');
  const [view, setView, resetView] = useToolbarState('bundles', BUNDLES_TOOLBAR);
  const hideOwned = !failed && view.hideOwned;
  // A failed section draws the game's bundles with no owned state (the parser's own empty save)
  const bundles = failed ? getBundles(undefined) : state?.account?.bundles ?? [];
  const classic = bundles.filter(({ evolving, starterOffer }) => !evolving && !starterOffer);
  const packs = bundles.filter(({ evolving }) => evolving);
  const offer = bundles.filter(({ starterOffer }) => starterOffer);
  const ownedOf = (list) => (failed ? '-' : `${formatNum(list.filter(({ owned }) => owned).length)} / ${formatNum(list.length)}`);
  const isOwned = ({ owned }) => !failed && Boolean(owned);
  // The offer is one purchase: owned once any card is, and then nothing of it is missing.
  const offerOwned = offer.some(isOwned);

  const tabBundles = [classic, packs, offer][tab] ?? [];
  const shown = tab === 2
    ? (hideOwned && offerOwned ? [] : offer)
    : tabBundles.filter((bundle) => !(hideOwned && isOwned(bundle)));

  const ownedWord = (owned) => (failed ? null : <StatusText status={owned ? 'done' : 'needs'}>{owned ? 'Owned' : 'Not owned'}</StatusText>);
  // The game's banner: the bundle's name, price and contents live only in this art
  const bannerCard = ({ name, owned, price, image }) => <ItemCard key={name} dimmed={!failed && !owned}
                                                                  footer={<Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} gap={1}>
                                                                    <Typography variant={'body2'}>{price != null ? formatNum(price, 'price') : ''}</Typography>
                                                                    {ownedWord(owned)}
                                                                  </Stack>}>
    <Box component={'img'} src={`${prefix}data/${image ?? name}.png`} alt={''}
         sx={{ width: '100%', height: 'auto', display: 'block' }}/>
  </ItemCard>;
  const packCard = (bundle) => {
    const companion = companionsData?.[bundle.companionIndex];
    return <ItemCard key={bundle.name} icon={companion?.name ? monsterSprite(companion.name) : undefined}
                     title={cleanUnderscore(bundle.displayName)} meta={companion?.name ? cleanUnderscore(companion.name) : undefined}
                     status={isOwned(bundle) ? 'done' : undefined} statusLabel={'Owned'}>
      <ItemCard.Facts rows={[
        ['Price', bundle.price != null ? formatNum(bundle.price, 'price') : '-'],
        ['Gems', amountWith(<GameIcon src={'data/PremiumGem.png'} size={16} alt={'Gems'}/>, bundle.gems)],
        ['Pet crystals', amountWith(petCrystalIcon(16), bundle.petCrystals)]
      ]}/>
    </ItemCard>;
  };

  return <>
    <NextSeo
      title="Bundles | Idleon Toolbox"
      description="Track your purchased premium bundles and their bonuses in Legends of Idleon"
    />
    {failed ? <MissingData name={'Bundles'} failed/> : null}
    <PageSummary>
      <StatTile label={'Bundles'} value={ownedOf(classic)}/>
      <StatTile label={'Pet Mart packs'} value={ownedOf(packs)}/>
      <StatTile label={'Starter Pack'} value={failed ? '-' : offerOwned
        ? <StatusText status={'done'}>Owned</StatusText>
        : 'Not owned'}/>
    </PageSummary>
    <Tabber tabs={TABS} keepChildren>
      <Box>
        {failed ? null : <Toolbar state={view} defaults={BUNDLES_TOOLBAR} onChange={setView} onReset={resetView}
                                  total={tabBundles.length} shown={shown.length}
                                  noun={tab === 1 ? 'packs' : tab === 2 ? 'offers' : 'bundles'}>
          <Toolbar.Filter name={'hideOwned'} label={'Hide owned'}/>
        </Toolbar>}
        {tab === 2 && shown.length ? <Typography variant={'body2'} color={'text.secondary'} sx={{ mb: 2 }}>
          One per account. Each card also adds +1,000 base carry capacity.
        </Typography> : null}
        {shown.length ? <CardGrid size={tab === 0 ? 'l' : 'm'}>
          {shown.map((bundle) => (tab === 1 ? packCard(bundle) : bannerCard(bundle)))}
        </CardGrid> : null}
      </Box>
    </Tabber>
  </>
};

export default Bundles;
