import React, { useState } from 'react';
import { Card, CardContent, Chip, Divider, FormControl, InputLabel, Select, Stack, TextField, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import useCheckbox from '@components/common/useCheckbox';

// Same stray glyphs Grimoire/Compass/Tesseract strip from their own upgrade text, plus the three
// that show up in Royal Guardian's own catalogs (statue names, orblet market, armory upgrades).
const stripGlyphs = (str) => (str ?? '').replace(/[船般航舞製千膛]/g, '');
const cleanText = (str) => cleanUnderscore(stripGlyphs(str));

// The armory renders every upgrade at its OWN shelf currency icon (RGres{costResourceIndex}.png) -
// this is the game's own render, not a per-upgrade icon; there is no such asset.
const Armory = ({ upgrades, resourceStorage }) => {
  const [sortBy, setSortBy] = useState('slot');
  const [searchText, setSearchText] = useState('');
  const [CheckboxEl, hideMaxedUpgrades] = useCheckbox('Hide maxed upgrades');
  const [LockedCheckboxEl, hideLockedUpgrades] = useCheckbox('Hide locked upgrades');

  // Only the 69 shelf slots are ever shown - the 14 catalog ids with no slot aren't purchasable
  // and have no shelf position to render in (see task C2 brief).
  const shelved = (upgrades ?? []).filter((upgrade) => upgrade.slot >= 0);

  const filtered = shelved.filter((upgrade) => {
    if (!searchText) return true;
    const needle = searchText.toLowerCase().trim();
    return upgrade.name?.toLowerCase().includes(needle) || upgrade.description?.toLowerCase().includes(needle);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'cost') return (a.cost || 0) - (b.cost || 0);
    if (sortBy === 'level') return (b.level || 0) - (a.level || 0);
    return a.slot - b.slot; // shelf order, matching the in-game armory layout
  });

  return (
    <Stack direction="column" gap={4}>
      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="slot">Shelf order</MenuItem>
            <MenuItem value="cost">Cost</MenuItem>
            <MenuItem value="level">Level</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Search by name or description"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 250 }}
        />
        <CheckboxEl/>
        <LockedCheckboxEl/>
      </Stack>

      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="stretch">
        {sorted.map((upgrade) => {
          const { index, name, description, level, maxLevel, cost, unlocked, maxed, costResourceIndex, costResourceRawName } = upgrade;
          if (hideMaxedUpgrades && maxed) return null;
          if (hideLockedUpgrades && !unlocked) return null;
          const capped = maxLevel < 999;
          const stored = resourceStorage?.[costResourceIndex] ?? 0;

          return (
            <Card key={index}>
              <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                width: 340,
                minHeight: 230,
                height: '100%',
                opacity: unlocked ? 1 : 0.5
              }}>
                <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
                  <img style={{ width: 32, height: 32 }} src={`${prefix}data/${costResourceRawName}.png`} alt=""/>
                  <Typography>
                    {cleanText(name)} ({level}{capped ? ` / ${maxLevel}` : ''})
                  </Typography>
                  {maxed ? <Chip size="small" color="success" label="Maxed"/> : null}
                  {!unlocked ? <Chip size="small" variant="outlined" label="Locked"/> : null}
                </Stack>
                <Divider sx={{ my: 1 }}/>
                <Typography>{cleanText(description)}</Typography>
                <Divider sx={{ my: 1, mt: 'auto' }}/>
                <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                  <img style={{ width: 24, height: 24 }} src={`${prefix}data/${costResourceRawName}.png`} alt=""/>
                  <Typography>Cost: {notateNumber(stored)} / {notateNumber(cost, 'Big')}</Typography>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default Armory;
