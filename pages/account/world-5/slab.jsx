import { AppContext } from '@components/common/context/AppProvider';
import React, { forwardRef, useContext, useState } from 'react';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, TextField } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import HtmlTooltip from '@components/Tooltip';
import { NextSeo } from 'next-seo';
import Image from 'next/image';
import { CardTitleAndValue } from '@components/common/styles';
import { getSlabBonus } from '@parsers/world-5/sailing';

const Slab = () => {
  const { state } = useContext(AppContext);
  const [display, setDisplay] = useState('missing');
  const [search, setSearch] = useState('');

  const shouldDisplayItem = (item, itemDisplay) => {
    if (itemDisplay === 'all') return true;
    else if (itemDisplay === 'looted' && item?.obtained) return true;
    else if (itemDisplay === 'missing' && !item?.obtained && !item?.unobtainable) return true;
    else if (itemDisplay === 'rotation' && item?.onRotation) return true;
    else if (itemDisplay === 'unobtainable' && item?.unobtainable) return true;
    else if (itemDisplay === 'greenstacked' && item?.greenStacked) return true;
    else if (itemDisplay === 'greenstackable' && item?.greenstackable) return true;
  }

  const searchTerm = search.trim().toLowerCase();
  const slabItems = state?.account?.looty?.slabItems
    ?.filter((item) => shouldDisplayItem(item, display))
    ?.filter((item) => !searchTerm || cleanUnderscore(item?.name)?.toLowerCase().includes(searchTerm));
  const slabBonuses = [
    { name: 'Tot. Dmg', icon: 'Arti2', value: state?.account?.sailing?.artifacts?.[2]?.bonus ?? 0 },
    { name: 'Sail Spd', icon: 'Arti10', value: state?.account?.sailing?.artifacts?.[10]?.bonus ?? 0 },
    { name: 'Divinity', icon: 'Arti18', value: state?.account?.sailing?.artifacts?.[18]?.bonus ?? 0 },
    { name: 'Bits', icon: 'Arti20', value: state?.account?.sailing?.artifacts?.[20]?.bonus ?? 0 },
    { name: 'Jade', icon: 'Slab4', value: state?.account?.sneaking?.jadeEmporium?.[8]?.bonus ?? 0 },
    { name: 'Essence', icon: 'Slab5', value: state?.account?.sneaking?.jadeEmporium?.[6]?.bonus ?? 0 },
    { name: 'Pow', icon: 'CaveShopUpg17', value: getSlabBonus(state?.account, 6) ?? 0 },
    { name: 'Research Exp', icon: 'ClassIcons61', value: getSlabBonus(state?.account, 7) ?? 0 }
  ];

  return <Stack>
    <NextSeo
      title="Slab | Idleon Toolbox"
      description="Track your Slab item collection progress and discover missing items in Legends of Idleon World 5"
    />
    <Stack direction={'row'} gap={3} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Looted items'}
                         value={`${state?.account?.looty?.lootedItems} / ${state?.account?.looty?.totalItems}`}/>
      <CardTitleAndValue title={'Missing items'}
                         value={state?.account?.looty?.missingItems}/>
      <CardTitleAndValue title={'Greenstacks'}
                         value={`${state?.account?.looty?.greenstackableStackedCount} / ${state?.account?.looty?.greenstackableCount}`}/>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        {slabBonuses.map(({ name, value, icon }, index) => {
          return <CardTitleAndValue key={`bonus-${index}`} title={name} value={`${notateNumber(value)}%`}
                                    icon={`data/${icon}.png`}
                                    imgStyle={{ width: 22, height: 22, objectFit: 'contain' }}>
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
          <FormControlLabel value="greenstacked" control={<Radio/>} label="Greenstacks"/>
          <FormControlLabel value="greenstackable" control={<Radio/>} label="Greenstackable"/>
        </RadioGroup>
      </FormControl>
      <TextField
        size={'small'}
        label={'Search'}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mt: 1, display: 'block', maxWidth: 300 }}
      />
    </Box>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {slabItems?.map((item, index) => {
        const { name, rawName, greenStacked } = item;
        return <HtmlTooltip key={`${rawName}-${index}`}
                            title={`${cleanUnderscore(name)}${greenStacked ? ' (Greenstacked)' : ''}`}>
          <Box sx={{ display: 'inline-flex', position: 'relative' }}>
            <Icon src={`${prefix}data/${rawName}.png`}
                  fallback={`${prefix}data/${rawName}_x1.png`}
                  size={50}
                  alt={rawName}/>
            {greenStacked ? <img src={`${prefix}data/GreenSymbol.png`}
                                 alt={'greenstacked'}
                                 style={{ position: 'absolute', top: -5, right: -5 }}
                                 width={50}
                                 height={50}/> : null}
          </Box>
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
