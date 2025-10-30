// TODO: update UIinventoryTabs as they are now 1-6 for active bags

import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import React from 'react';

const ACItems = ({
  items, character
}) => {
  if (!items || items.length === 0) {
    return <Typography>No items found.</Typography>;
  }

  let weapons = [];
  let rings = [];

  for (let i = 0; i < items.length; i++) {
    if (items[i].displayName?.includes('Arcanist_Staff')) {
      weapons.push({ pos: i, bag: Math.floor(i / 16) + 1, place: i % 16 + 1, ...items[i] });
    }
    if (items[i].displayName?.includes('Cultist_Ring')) {
      rings.push({ pos: i, bag: Math.floor(i / 16) + 1, place: i % 16 + 1, ...items[i] });
    }
  }

  const { currentWeapon, ring1, ring2 } = { currentWeapon: character?.equipment[1], ring1: character?.equipment[5], ring2: character?.equipment[7] };
  const bestRingsACC = Math.max(ring1?.UQ1val || 0, ring2?.UQ1val || 0);
  const bestRingsTachyons = Math.max(ring1?.UQ2val || 0, ring2?.UQ2val || 0);

  weapons.sort((a, b) => b.Weapon_Power - a.Weapon_Power);
  const topWeaponsWP = weapons.slice(0, 5);

  rings.sort((a, b) => b.UQ2val - a.UQ2val);
  const topRingsTachyons = rings.slice(0, 5);

  rings.sort((a, b) => b.UQ1val - a.UQ1val);
  const topRingsACC = rings.slice(0, 5);

  return <>
    <Typography variant={'h5'} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <img src="/data/EquipmentWandsArc0.png" alt="" style={{ width: '32px', height: '32px' }} />
      Top 5 Weapons of {weapons.length} in inventory
    </Typography>

    <TableContainer component={Paper} sx={{ mb: 4 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Bag</TableCell>
            <TableCell>Slot</TableCell>
            <TableCell>Weapon Power</TableCell>
            <TableCell>Arcanist Damage</TableCell>
            <TableCell>Extra Tachyons %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topWeaponsWP.map((item, index) => {
            return <TableRow key={"t" + index}>
              <TableCell><img src={`/data/UIinventoryTabs${item.bag}.png`} alt={item.bag} /></TableCell>
              <TableCell>Slot {item.place}</TableCell>
              <TableCell sx={{ color: item.Weapon_Power > currentWeapon?.Weapon_Power ? 'success.main' : 'info.main' }}>{item.Weapon_Power}</TableCell>
              <TableCell sx={{ color: item.UQ1val > currentWeapon?.UQ1val ? 'success.main' : 'info.main' }}>{item.UQ1val}</TableCell>
              <TableCell sx={{ color: item.UQ2val > currentWeapon?.UQ2val ? 'success.main' : 'info.main' }}>{item.UQ2val}</TableCell>

            </TableRow>
          })}
        </TableBody>
      </Table>
    </TableContainer>

    <Typography variant={'h5'} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <img src="/data/EquipmentRingsArc0.png" alt="" style={{ width: '32px', height: '32px' }} />
      Top 5 Rings (Tachyons) of {rings.length} in inventory
    </Typography>

    <TableContainer component={Paper} sx={{ mb: 4 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Bag</TableCell>
            <TableCell>Slot</TableCell>
            <TableCell>ACC %</TableCell>
            <TableCell>Extra Tachyons %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topRingsTachyons.map((item, index) => {
            return <TableRow key={"t" + index}>
              <TableCell><img src={`/data/UIinventoryTabs${item.bag}.png`} alt={item.bag} /></TableCell>
              <TableCell>Slot {item.place}</TableCell>
              <TableCell >{item.UQ1val}</TableCell>
              <TableCell sx={{ color: item.UQ2val > bestRingsTachyons ? 'success.main' : 'info.main' }}>{item.UQ2val}</TableCell>
            </TableRow>
          })}
        </TableBody>
      </Table>
    </TableContainer>

    <Typography variant={'h5'} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <img src="/data/EquipmentRingsArc0.png" alt="" style={{ width: '32px', height: '32px' }} />
      Top 5 Rings (ACC) of {rings.length} in inventory
    </Typography>

    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Bag</TableCell>
            <TableCell>Slot</TableCell>
            <TableCell>ACC %</TableCell>
            <TableCell>Extra Tachyons %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topRingsACC.map((item, index) => {
            return <TableRow key={"a" + index}>
              <TableCell><img src={`/data/UIinventoryTabs${item.bag}.png`} alt={item.bag} /></TableCell>
              <TableCell>Slot {item.place}</TableCell>
              <TableCell sx={{ color: item.UQ1val > bestRingsACC ? 'success.main' : 'info.main' }}>{item.UQ1val}</TableCell>
              <TableCell>{item.UQ2val}</TableCell>
            </TableRow>
          })}
        </TableBody>
      </Table>
    </TableContainer>
  </>;

};

export default ACItems;
