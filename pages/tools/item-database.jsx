import React, { useState } from 'react';
import { Stack, TextField } from '@mui/material';
import { itemsArray } from '../../data/website-data';
import Tooltip from '@components/Tooltip';
import ItemDisplay from '@components/common/ItemDisplay';
import { cleanUnderscore, prefix } from '@utility/helpers';
import Image from 'next/image'
import debounce from 'lodash.debounce';
import Autocomplete from '@mui/material/Autocomplete';

const ignore = ['DungWeaponBow1'];
const replaceImage = {
  'Motherlode': 'Motherlode_x1'
}
const ItemDatabase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');

  const handleSearchChange = debounce((e) => setSearchQuery(e.target.value.toLowerCase()), 300);

  const filteredItems = itemsArray.filter(item => {
    const matchesSearch = item?.displayName?.toLowerCase().includes(searchQuery);
    const matchesType = selectedType ? item?.itemType === selectedType : true;
    const matchesSubType = selectedSubType ? item?.Type === selectedSubType : true;
    return matchesSearch && matchesType && matchesSubType && !ignore.includes(item?.rawName);
  });

  const uniqueItemTypes = [...new Set(itemsArray.map(item => item.itemType).filter(Boolean))];
  const uniqueSubTypes = [...new Set(itemsArray.map(item => item.Type).filter(Boolean))];

  return (
    <>
      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="Search"
          variant="outlined"
          onChange={handleSearchChange}
        />
        <Autocomplete
          sx={{ width: 300 }}
          options={uniqueItemTypes}
          getOptionLabel={(option) => option || ''}
          value={selectedType}
          onChange={(event, newValue) => setSelectedType(newValue || '')}
          renderInput={(params) => <TextField {...params} label="Filter by Type" variant="outlined" fullWidth/>}
        />
        <Autocomplete
          sx={{ width: 300 }}
          options={uniqueSubTypes}
          getOptionLabel={(option) => cleanUnderscore(option.toLowerCase().capitalizeAll()) || ''}
          value={selectedSubType}
          onChange={(event, newValue) => setSelectedSubType(newValue || '')}
          renderInput={(params) => <TextField {...params} label="Filter by Sub-Type" variant="outlined" fullWidth/>}
        />
      </Stack>
      <Stack direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
        {filteredItems.map((item, index) => {
          const img = replaceImage?.[item?.rawName] || item?.rawName;
          return (
            <Tooltip key={item?.rawName + index} title={<ItemDisplay {...item} showRawName />}>
              <Image
                src={`${prefix}data/${img}.png`}
                onError={(e) => {
                  e.target.src = `${prefix}data/${item?.rawName}_x1.png`;
                }}
                style={{ objectFit: 'contain' }}
                width={48}
                height={48}
                alt={item?.displayName}
              />
            </Tooltip>
          );
        })}
      </Stack>
    </>
  );
};

export default ItemDatabase;
