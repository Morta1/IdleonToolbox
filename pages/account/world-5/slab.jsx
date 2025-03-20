import { AppContext } from '@components/common/context/AppProvider';
import React, { forwardRef, useContext, useMemo, useState } from 'react';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import HtmlTooltip from '@components/Tooltip';
import { NextSeo } from 'next-seo';
import Image from 'next/image';
import { CardTitleAndValue } from '@components/common/styles';


const Slab = () => {
  const { state } = useContext(AppContext);
  const [display, setDisplay] = useState('missing');

  const shouldDisplayItem = (item, itemDisplay) => {
    if (itemDisplay === 'all') return true;
    else if (itemDisplay === 'looted' && item?.obtained) return true;
    else if (itemDisplay === 'missing' && !item?.obtained && !item?.unobtainable) return true;
    else if (itemDisplay === 'rotation' && item?.onRotation) return true;
    else if (itemDisplay === 'unobtainable' && item?.unobtainable) return true;
  }

  const slabItems = useMemo(() => state?.account?.looty?.slabItems?.filter((item) => shouldDisplayItem(item, display)), [display]);
  const slabBonuses = useMemo(() => {
    return [
      { name: 'Tot. Dmg', icon: 'Arti2', value: state?.account?.sailing?.artifacts?.[2]?.bonus ?? 0 },
      { name: 'Sail Spd', icon: 'Arti10', value: state?.account?.sailing?.artifacts?.[10]?.bonus ?? 0 },
      { name: 'Divinity', icon: 'Arti18', value: state?.account?.sailing?.artifacts?.[18]?.bonus ?? 0 },
      { name: 'Bits', icon: 'Arti20', value: state?.account?.sailing?.artifacts?.[20]?.bonus ?? 0 },
      { name: 'Jade', icon: 'Slab4', value: state?.account?.sneaking?.jadeEmporium?.[6]?.bonus ?? 0 },
      { name: 'Essence', icon: 'Slab5', value: state?.account?.sneaking?.jadeEmporium?.[8]?.bonus ?? 0 }
    ];
  }, [state]);

  return <Stack>
    <NextSeo
      title="Slab | Idleon Toolbox"
      description="The Slab consists of a list of items within the game"
    />
    <Stack direction={'row'} gap={3} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Looted items'}
                         value={`${state?.account?.looty?.lootedItems} / ${state?.account?.looty?.totalItems}`}/>
      <CardTitleAndValue title={'Missing items'}
                         value={state?.account?.looty?.missingItems}/>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        {slabBonuses.map(({ name, value, icon }, index) => {
          return <CardTitleAndValue key={`bonus-${index}`} title={name} value={`${notateNumber(value)}%`}
                                    icon={`data/${icon}.png`}>
          </CardTitleAndValue>
        })}
      </Stack>
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
          <FormControlLabel value="unobtainable" control={<Radio/>} label="Unobtainable"/>
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
