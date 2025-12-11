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
import { cleanUnderscore, prefix } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '../../../components/common/styles';

const Bundles = () => {
  const { state } = useContext(AppContext);
  const [showMissingOnly, setShowMissingOnly] = useState(false);

  const bundles = state?.account?.bundles || [];

  const filteredBundles = bundles.filter((bundle) => {
    if (showMissingOnly && bundle.owned) return false;
    return true;
  });

  const ownedCount = bundles.filter(b => b.owned).length;
  const totalCount = bundles.length;
  const ownedBundlesPrice = bundles.reduce((acc, bundle) => acc + (bundle.owned ? bundle.price : 0), 0);
  const totalPrice = bundles.reduce((acc, bundle) => acc + (bundle.price ?? 0), 0);
  
  return <>
    <NextSeo
      title="Bundles | Idleon Toolbox"
      description="View all purchased bundles"
    />
    <Stack direction={'row'} flexWrap={'wrap'} gap={3} mb={4} alignItems="center">
      <CardTitleAndValue
        title={'Owned Bundles'}
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
    <Grid container spacing={2}>
      {filteredBundles.length > 0 ? (
        filteredBundles.map(({ name, owned }) => {
          return (
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4 }} key={name}>
              <img
                style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: owned ? 1 : 0.5 }}
                src={`${prefix}data/${name}.png`}
                alt={name}
              />
            </Grid>
          );
        })
      ) : (
        <Grid size={12}>
          <Typography variant="body1" color="text.secondary">
            You've purchased all bundles
          </Typography>
        </Grid>
      )}
    </Grid>
  </>
};

export default Bundles;

