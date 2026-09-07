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
// the other's catalog.
const TABS = ['Bundles', 'Pet Mart'];

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
  const tabBundles = bundles.filter(({ evolving }) => Boolean(evolving) === isPetMart);
  const visibleBundles = tabBundles.filter(({ owned }) => !(showMissingOnly && owned));

  const ownedCount = tabBundles.filter(({ owned }) => owned).length;
  const totalCount = tabBundles.length;

  return <>
    <NextSeo
      title="Bundles | Idleon Toolbox"
      description="Track your purchased premium bundles and their bonuses in Legends of Idleon"
    />
    <Stack direction={'row'} flexWrap={'wrap'} gap={3} mb={4} alignItems="center">
      <CardTitleAndValue
        title={isPetMart ? 'Owned Packs' : 'Owned Bundles'}
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
        {visibleBundles.length > 0 ? (
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
            <Typography variant="body1" color="text.secondary">
              {isPetMart ? 'You\'ve purchased all Pet Mart packs' : 'You\'ve purchased all bundles'}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Tabber>
  </>
};

export default Bundles;
