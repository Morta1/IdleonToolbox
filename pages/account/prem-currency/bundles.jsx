import { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, prefix } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { bundles as bundlesData, companions as companionsData, items, itemSources } from '@website-data';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Tabber from '../../../components/common/Tabber';
import useTabIndex from '@hooks/useTabIndex';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import { MissingArt } from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { getBundles, getPetMartPack, getPetMartPackRotation } from '@parsers/misc';
import PetPackCard from '@components/account/Pets/PetPackCard';

// The bundle list holds two different purchases. The bun_/bon_/ban_ bundles are the classic gem
// shop ones, and the game ships a banner for each. The bin_ ones are the Pet Mart packs: a
// companion plus gems and pet crystals, rotating with the pets you already own, and with no banner
// art anywhere in the game's images. They are counted apart so neither total is measured against
// the other's catalog. The Starter Pack offer gets its own tab for the same reason: three portrait
// cards of which an account buys exactly one, so it neither fits the banner grid nor counts as three.
const TABS = ['Bundles', 'Pet Packs', 'Starter Pack'];
const BUNDLES_TOOLBAR = { search: '', hideOwned: false };

// A banner tile is the game's art alone: its name, price and contents are drawn in it, so the tile says nothing beside
// it. Bought is the art at full strength, not bought dimmed, and the note says which in words. Three banners to a desktop
// row keep the art's small words readable; the card each, with its price and state under the art, ran the page half again
// past the old one's height.
const BANNER_GRID_SX = { gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))' };
const OFFER_GRID_SX = { gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' };
const BANNER_ART = { banner: '711 / 130', offer: '320 / 446' };
// The gem shop's three server-picked bundles, in the order of its dots. It opens on the first one that isn't Blank and
// isn't bought, falling back to the last even when bought; its arrows step only through the ones not bought.
const GEM_SHOP_OFFERS = ['GemBundleOffer3', 'GemBundleOffer2', 'GemBundleOffer'];
const ORDINALS = ['1st', '2nd', '3rd'];
// A new account (under 48 hours played, OptLacc[45]) without bun_c sees bun_c first while serverVar OfferBunC is 1
const NEW_ACCOUNT_SECONDS = 172800;

// What the search reads: the pack's name and pet, the game's blurb, and the items inside
const itemName = (rawName) => cleanUnderscore(items?.[rawName]?.displayName ?? rawName);
const searchText = (bundle) => cleanUnderscore([
  bundle.displayName,
  companionsData?.[bundle.companionIndex]?.name,
  bundlesData?.[bundle.name]?.message,
  ...Object.keys(itemSources?.bundles?.[bundle.name] ?? {}).map(itemName)
].filter(Boolean).join(' ')).toLowerCase();

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
  const offerGone = !failed && !offerOwned && offer.length > 0 && offer.every(({ offered }) => offered === false);
  const serverVars = state?.account?.serverVars;

  // The gem shop: the dots run Offer3, Offer2, Offer
  const offerOf = (key) => classic.find(({ name }) => name === serverVars?.[key]);
  const [offer3, offer2, offer1] = GEM_SHOP_OFFERS.map(offerOf);
  const bunC = classic.find(({ name }) => name === 'bun_c');
  const newAccountBunC = Boolean(bunC) && !isOwned(bunC) && Number(serverVars?.OfferBunC) === 1
    && Number(state?.account?.accountOptions?.[45]) < NEW_ACCOUNT_SECONDS;
  const opener = newAccountBunC ? bunC : [offer3, offer2].find((bundle) => bundle && !isOwned(bundle)) ?? offer1;
  const inShop = failed ? [] : [
    newAccountBunC && ![offer3, offer2, offer1].includes(bunC) ? { bundle: bunC, slot: null } : null,
    ...[offer3, offer2, offer1].map((bundle, slot) => (bundle ? { bundle, slot } : null))
  ].filter(Boolean);
  const shopNote = (bundle, slot) => {
    if (slot == null) return 'The gem shop opens on this one while the account is new';
    const where = `${ORDINALS[slot]} in the gem shop`;
    if (bundle === opener) return isOwned(bundle) ? `${where}: owned, but the shop falls back to it with the others bought`
      : `${where}: the shop opens on it`;
    return isOwned(bundle) ? `${where}: owned, so the shop's arrows skip it` : where;
  };

  // The Pet Mart's first slot sells one pack at a time (getPetMartPack)
  const companionList = state?.account?.companions?.list;
  const petOwned = (pack) => (companionList?.[pack.companionIndex]?.copies ?? 0) > 0;
  const rotation = failed ? null : getPetMartPackRotation(bundles, serverVars);
  const onSale = failed ? null : getPetMartPack(bundles, serverVars, companionList);

  const search = failed ? '' : (view?.search ?? '').trim().toLowerCase();
  const matches = (bundle) => !search || searchText(bundle).includes(search);
  const tabBundles = [classic, packs, offer][tab] ?? [];
  const shown = (tab === 2
    ? (hideOwned && offerOwned ? [] : offer)
    : tabBundles.filter((bundle) => !(hideOwned && isOwned(bundle)))).filter(matches);

  const muted = (text) => <Typography variant={'body2'} color={'text.secondary'}>{text}</Typography>;
  const stateWord = (bundle) => {
    if (failed) return null;
    if (isOwned(bundle)) return <StatusText status={'done'}>Owned</StatusText>;
    return muted(bundle.starterOffer && bundle.offered === false ? 'No longer offered' : 'Not owned');
  };
  const priceOf = ({ price }) => (price != null ? formatNum(price, 'price') : null);
  const bannerTile = (bundle, art, shopSlot) => {
    const state = shopSlot !== undefined ? <Typography variant={'body2'}>{shopNote(bundle, shopSlot)}</Typography> : stateWord(bundle);
    // Every Starter Pack card also sets bun_i (Auto Loot)
    const fromStarter = bundle.name === 'bun_i' && isOwned(bundle) && offerOwned ? muted('Comes with the Starter Pack') : null;
    const price = priceOf(bundle);
    return <IconTile key={bundle.name} height={'auto'} status={failed || isOwned(bundle) ? undefined : 'dim'}
                     details={state || price ? <Stack gap={0.5}>
                       {state}
                       {fromStarter}
                       {price ? <Typography variant={'body2'}>{price}</Typography> : null}
                     </Stack> : undefined}
                     icon={<BannerArt src={`data/${bundle.image ?? bundle.name}.png`} aspectRatio={BANNER_ART[art]}
                                      alt={['Bundle', price].filter(Boolean).join(', ')}/>}/>;
  };
  // A pet pack's state: owned, on sale in the Pet Mart's first slot, or why the slot passes it over
  const packCard = (pack) => {
    const owned = isOwned(pack);
    // On sale is a plain line: a state colour on the card read as owned
    const meta = failed || owned || !rotation ? undefined : pack === onSale ? 'On sale now in the Pet Mart'
      : !rotation.includes(pack) ? 'Not in the current rotation'
        : petOwned(pack) ? 'Not offered: you own its pet' : undefined;
    return <PetPackCard key={pack.name} pack={pack} meta={meta} dimmed={!failed && !owned && pack !== onSale}
                        status={owned ? 'done' : undefined} statusLabel={owned ? 'Owned' : undefined}/>;
  };

  return <>
    <NextSeo
      title="Bundles | Idleon Toolbox"
      description="Track your purchased premium bundles and their bonuses in Legends of Idleon"
    />
    {failed ? <MissingData name={'Bundles'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Bundles'} value={ownedOf(classic)}/>
      <StatTile label={'Pet packs'} value={ownedOf(packs)}/>
      <StatTile label={'Starter Pack'} value={failed ? '-' : offerOwned
        ? <StatusText status={'done'}>Owned</StatusText>
        : offerGone ? 'No longer offered' : 'Not owned'}/>
    </PageSummary>
    <Tabber tabs={TABS} keepChildren>
      <Box>
        {tab === 0 && inShop.length ? <Box sx={{ mb: 3 }}>
          <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 1.5 }}>In the gem shop now</Typography>
          <CardGrid size={'icon'} fill sx={BANNER_GRID_SX}>
            {inShop.map(({ bundle, slot }) => bannerTile(bundle, 'banner', slot))}
          </CardGrid>
        </Box> : null}
        {failed ? null : <Toolbar state={view} defaults={BUNDLES_TOOLBAR} onChange={setView} onReset={resetView}
                                  total={tabBundles.length} shown={shown.length}
                                  noun={tab === 1 ? 'packs' : tab === 2 ? 'offers' : 'bundles'}>
          <Toolbar.Search placeholder={tab === 1 ? 'Search packs or pets' : 'Search bundles or items'}/>
          <Toolbar.Filter name={'hideOwned'} label={'Hide owned'}/>
        </Toolbar>}
        {tab === 2 && shown.length ? <Typography variant={'body2'} color={'text.secondary'} sx={{ mb: 2 }}>
          For new accounts only: the game stops offering it once a card is bought or 5,000 bought gems have reached the
          account, and shows it only at early character levels. One per account. Each card also adds +1,000 base carry
          capacity and Auto Loot.
        </Typography> : null}
        {shown.length ? tab === 1
          ? <CardGrid size={'s'}>{shown.map(packCard)}</CardGrid>
          : <CardGrid size={'icon'} fill sx={tab === 0 ? BANNER_GRID_SX : OFFER_GRID_SX}>
            {shown.map((bundle) => bannerTile(bundle, tab === 2 ? 'offer' : 'banner'))}
          </CardGrid> : null}
      </Box>
    </Tabber>
  </>
};

export default Bundles;
