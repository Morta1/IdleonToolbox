import { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, prefix, titleCaseName } from '@utility/helpers';
import { monsterSprite } from '@utility/spriteImages';
import { NextSeo } from 'next-seo';
import { companions as companionsData } from '@website-data';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Tabber from '../../../components/common/Tabber';
import useTabIndex from '@hooks/useTabIndex';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid, { LABELED_TILE_MIN } from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon, { MissingArt } from '@components/common/GameIcon';
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

// A banner tile is the game's art alone: its name, price and contents are drawn in it, so the tile says nothing beside
// it. Bought is the art at full strength, not bought dimmed, and the note says which in words. Three banners to a desktop
// row keep the art's small words readable; the card each, with its price and state under the art, ran the page half again
// past the old one's height.
const BANNER_GRID_SX = { gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))' };
const OFFER_GRID_SX = { gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' };
const BANNER_ART = { banner: '711 / 130', offer: '320 / 446' };

// A banner at the tile's width. Art the game data lacks (bon_q) draws GameIcon's dashed ? box in the banner's shape, never
// the browser's broken image. An image that failed before hydration fired its error before React was listening.
const BannerArt = ({ src, alt, aspectRatio }) => {
  const [failed, setFailed] = useState(false);
  const shape = { width: '100%', aspectRatio, display: 'flex' };
  if (failed) return <MissingArt role={'img'} aria-label={alt} style={{ ...shape, fontSize: 24 }}>?</MissingArt>;
  return <Box component={'img'} src={`${prefix}${src}`} alt={alt} onError={() => setFailed(true)}
              ref={(img) => { if (img?.complete && img.naturalWidth === 0) setFailed(true); }}
              sx={{ ...shape, height: 'auto', display: 'block' }}/>;
};

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

  const stateWord = (bundle) => (failed ? null : isOwned(bundle)
    ? <StatusText status={'done'}>Owned</StatusText>
    : <Typography variant={'body2'} color={'text.secondary'}>Not owned</Typography>);
  const priceOf = ({ price }) => (price != null ? formatNum(price, 'price') : null);
  const bannerTile = (bundle, art) => {
    const state = stateWord(bundle);
    const price = priceOf(bundle);
    return <IconTile key={bundle.name} height={'auto'} status={failed || isOwned(bundle) ? undefined : 'dim'}
                     details={state || price ? <Stack gap={0.5}>
                       {state}
                       {price ? <Typography variant={'body2'}>{price}</Typography> : null}
                     </Stack> : undefined}
                     icon={<BannerArt src={`data/${bundle.image ?? bundle.name}.png`} aspectRatio={BANNER_ART[art]}
                                      alt={['Bundle', price].filter(Boolean).join(', ')}/>}/>;
  };
  // A Pet Mart pack has no art: its pet's sprite, its name and price, its pet and currencies in the note
  const packTile = (bundle) => {
    const companion = companionsData?.[bundle.companionIndex];
    const name = titleCaseName(cleanUnderscore(bundle.displayName));
    return <IconTile key={bundle.name} icon={companion?.name ? monsterSprite(companion.name) : undefined} alt={name} label={name}
                     value={priceOf(bundle) ?? '-'} status={!failed && !isOwned(bundle) ? 'missing' : undefined}
                     details={<Stack gap={1}>
                       <Stack gap={0.25}>
                         <Typography variant={'body2'} fontWeight={500}>{name}</Typography>
                         {stateWord(bundle)}
                       </Stack>
                       <ItemCard.Facts rows={[
                         companion?.name ? ['Pet', cleanUnderscore(companion.name)] : null,
                         ['Price', priceOf(bundle) ?? '-'],
                         ['Gems', amountWith(<GameIcon src={'data/PremiumGem.png'} size={16} alt={'Gems'}/>, bundle.gems)],
                         ['Pet crystals', amountWith(petCrystalIcon(16), bundle.petCrystals)]
                       ]}/>
                     </Stack>}/>;
  };

  return <>
    <NextSeo
      title="Bundles | Idleon Toolbox"
      description="Track your purchased premium bundles and their bonuses in Legends of Idleon"
    />
    {failed ? <MissingData name={'Bundles'} failed atZero/> : null}
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
        {shown.length ? <CardGrid size={'icon'} fill={tab === 1 ? LABELED_TILE_MIN : true}
                                  sx={tab === 0 ? BANNER_GRID_SX : tab === 2 ? OFFER_GRID_SX : undefined}>
          {shown.map((bundle) => (tab === 1 ? packTile(bundle) : bannerTile(bundle, tab === 2 ? 'offer' : 'banner')))}
        </CardGrid> : null}
      </Box>
    </Tabber>
  </>
};

export default Bundles;
