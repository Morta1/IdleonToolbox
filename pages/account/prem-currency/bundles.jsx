import React, { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import {
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '../../../components/common/styles';
import Tabber from '../../../components/common/Tabber';
import useTabIndex from '@hooks/useTabIndex';

// The bundle list holds two different purchases. The bun_/bon_/ban_ bundles are the classic gem
// shop ones, and the game ships a banner for each. The bin_ ones are the Pet Mart packs: a
// companion plus gems and pet crystals, rotating with the pets you already own, and with no banner
// art anywhere in the game's images. They are counted apart so neither total is measured against
// the other's catalog. The Starter Pack offer gets its own tab for the same reason: three portrait
// cards of which an account buys exactly one, so it neither fits the banner grid nor counts as three.
const TABS = ['Bundles', 'Pet Mart', 'Starter Pack'];

const EvolvingBundle = ({ bundle, companion }) => <Card sx={{ height: '100%', opacity: bundle.owned ? 1 : 0.5 }}>
  <CardContent>
    <Stack direction={'row'} gap={2} alignItems={'center'}>
      {companion ? <img width={42} height={42} style={{ objectFit: 'contain' }}
                        src={monsterImage(companion.name)} alt={companion.name}/> : null}
      <Stack>
        <Typography>{cleanUnderscore(bundle.displayName)}</Typography>
        <Typography variant={'body2'} color={'text.secondary'}>
          {companion ? cleanUnderscore(companion.name) : ''} · ${bundle.price}
        </Typography>
      </Stack>
    </Stack>
    <Stack direction={'row'} gap={2} mt={1.5} alignItems={'center'}>
      <Stack direction={'row'} gap={0.5} alignItems={'center'}>
        <img src={`${prefix}data/PremiumGem.png`} alt={'gems'} width={20} height={20}/>
        <Typography variant={'body2'}>{numberWithCommas(bundle.gems)}</Typography>
      </Stack>
      <Stack direction={'row'} gap={0.5} alignItems={'center'}>
        <img src={`${prefix}data/PremiumGem.png`} alt={'pet crystals'} width={20} height={20}
             style={{ filter: 'hue-rotate(280deg)' }}/>
        <Typography variant={'body2'}>{numberWithCommas(bundle.petCrystals)}</Typography>
      </Stack>
    </Stack>
  </CardContent>
</Card>;

const Bundles = () => {
  const { state } = useContext(AppContext);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [tab] = useTabIndex(TABS);

  const bundles = state?.account?.bundles || [];
  const companions = state?.account?.companions?.list || [];

  const isPetMart = tab === 1;
  const isStarterOffer = tab === 2;
  const tabOf = ({ evolving, starterOffer }) => (evolving ? 1 : starterOffer ? 2 : 0);
  const tabBundles = bundles.filter((bundle) => tabOf(bundle) === tab);
  // The offer is one purchase: owned once any card is, and then nothing of it is missing.
  const offerOwned = isStarterOffer && tabBundles.some(({ owned }) => owned);
  const visibleBundles = isStarterOffer
    ? (showMissingOnly && offerOwned ? [] : tabBundles)
    : tabBundles.filter(({ owned }) => !(showMissingOnly && owned));

  const ownedCount = isStarterOffer ? (offerOwned ? 1 : 0) : tabBundles.filter(({ owned }) => owned).length;
  const totalCount = isStarterOffer ? 1 : tabBundles.length;
  const countTitle = isPetMart ? 'Owned Packs' : isStarterOffer ? 'Owned Offer' : 'Owned Bundles';
  const allOwnedText = isPetMart
    ? 'You\'ve purchased all Pet Mart packs'
    : isStarterOffer ? 'You\'ve purchased the Starter Pack offer' : 'You\'ve purchased all bundles';

  return <>
    <NextSeo
      title="Bundles | Idleon Toolbox"
      description="Track your purchased premium bundles and their bonuses in Legends of Idleon"
    />
    <Stack direction={'row'} flexWrap={'wrap'} gap={3} mb={4} alignItems="center">
      <CardTitleAndValue
        title={countTitle}
        value={`${ownedCount} / ${totalCount}`}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showMissingOnly}
            onChange={(e) => setShowMissingOnly(e.target.checked)}
          />
        }
        label="Show missing only"
      />
    </Stack>
    <Tabber tabs={TABS} keepChildren>
      <Grid container spacing={2}>
        {isStarterOffer && visibleBundles.length > 0 ? <Grid size={12}>
          <Typography variant={'body2'} color={'text.secondary'} mb={1}>
            One per account. Each card also adds +1,000 base carry capacity.
          </Typography>
          <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
            {visibleBundles.map(({ name, owned, image }) => <img
              key={name}
              style={{ height: 445, maxWidth: '100%', objectFit: 'contain', opacity: owned ? 1 : 0.5 }}
              src={`${prefix}data/${image}.png`}
              alt={name}
            />)}
          </Stack>
        </Grid> : visibleBundles.length > 0 ? (
          visibleBundles.map((bundle) => {
            const { name, owned, evolving } = bundle;
            return (
              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4 }} key={name}>
                {evolving
                  ? <EvolvingBundle bundle={bundle} companion={companions?.[bundle.companionIndex]}/>
                  : <img
                    style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: owned ? 1 : 0.5 }}
                    src={`${prefix}data/${name}.png`}
                    alt={name}
                  />}
              </Grid>
            );
          })
        ) : (
          <Grid size={12}>
            <Typography variant="body1" color="text.secondary">{allOwnedText}</Typography>
          </Grid>
        )}
      </Grid>
    </Tabber>
  </>
};

export default Bundles;
