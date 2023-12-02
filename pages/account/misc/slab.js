import { AppContext } from 'components/common/context/AppProvider';
import React, { forwardRef, useContext, useMemo, useState } from 'react';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from 'utility/helpers';
import HtmlTooltip from 'components/Tooltip';
import { NextSeo } from 'next-seo';
import { filteredLootyItems } from '../../../parsers/parseMaps';
import Image from 'next/image';
import { CardTitleAndValue } from '../../../components/common/styles';

const Slab = () => {
  const { state } = useContext(AppContext);
  const [display, setDisplay] = useState('missing');

  const shouldDisplayItem = (item, itemDisplay) => {
    if (itemDisplay === 'all') return true;
    else if (itemDisplay === 'looted' && item?.obtained) return true;
    else if (itemDisplay === 'missing' && !item?.obtained && !filteredLootyItems?.[item?.rawName]) return true;
    else if (itemDisplay === 'rotation' && item?.onRotation) return true;
  }

  const slabItems = useMemo(() => state?.account?.looty?.slabItems?.filter((item) => shouldDisplayItem(item, display)), [display]);

  return <Stack>
    <NextSeo
      title="Idleon Toolbox | Slab"
      description="The Slab consists of a list of items within the game"
    />
    <Typography textAlign={'center'} mt={2} mb={2} variant={'h2'}>Slab</Typography>
    <Stack direction={'row'} gap={3}>
      <CardTitleAndValue title={'Looted items'}
                         value={`${state?.account?.looty?.lootedItems} / ${state?.account?.looty?.totalItems}`}/>
      <CardTitleAndValue title={'Missing items'}
                         value={state?.account?.looty?.missingItems}/>
    </Stack>
    <Box sx={{ mb: 3 }}>
      <FormControl>
        <FormLabel id="demo-radio-buttons-group-label">Display</FormLabel>
        <RadioGroup
          row
          aria-labelledby="demo-radio-buttons-group-label"
          defaultValue="missing"
          name="radio-buttons-group"
          onChange={(e) => setDisplay(e.target.value)}
        >
          <FormControlLabel value="missing" control={<Radio/>} label="Missing items"/>
          <FormControlLabel value="looted" control={<Radio/>} label="Looted items"/>
          <FormControlLabel value="all" control={<Radio/>} label="All items"/>
          <FormControlLabel value="rotation" control={<Radio/>} label="GemShop rotation"/>
        </RadioGroup>
      </FormControl>
    </Box>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {slabItems?.map((item, index) => {
        const { name, rawName } = item;
        return <HtmlTooltip key={`${rawName}-${index}`} title={cleanUnderscore(name)}>
          <Icon src={`${prefix}data/${rawName}.png`}
                fallback={`${prefix}data/${rawName}_x1.png`}
                size={50}
                alt={rawName}/>
        </HtmlTooltip>
      })}
    </Stack>
  </Stack>
};

const Icon = forwardRef((props, ref) => {
  const { src, fallback, alt, size } = props;
  const [error, setError] = useState(false);

  return <Image
    {...props}
    ref={ref}
    src={!error ? src : fallback}
    alt={alt}
    width={size} height={size}
    onError={() => setError(true)}
  />
})


export default React.memo(Slab);
