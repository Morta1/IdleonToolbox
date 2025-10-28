// TODO: update UIinventoryTabs as they are now 1-6 for active bags

import {
  Divider, Stack, Typography, Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { cleanUnderscore, numberWithCommas } from '@utility/helpers';
import React from 'react';

const ACItems = ({
  items
}) => {
  if (!items || items.length === 0) {
    return <Typography>No items found.</Typography>;
  }

  let rings = [];
  let weapons = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].displayName?.includes('Cultist_Ring')) {
      rings.push({ pos: i, bag: Math.floor(i / 16) + 1, place: i % 16 + 1, ...items[i] });
    }
    if (items[i].displayName?.includes('Arcanist_Staff')) {
      weapons.push({ pos: i, bag: Math.floor(i / 16) + 1, place: i % 16 + 1, ...items[i] });
    }
  }
  rings.sort((a, b) => b.UQ2val - a.UQ2val);
  const topRingsTachion = rings.slice(0, 5);

  rings.sort((a, b) => b.UQ1val - a.UQ1val);
  const topRingsACC = rings.slice(0, 5);

  weapons.sort((a, b) => b.Weapon_Power - a.Weapon_Power);
  const topWeaponsWP = weapons.slice(0, 5);

  return <>
    <h2><img src="/data/EquipmentWandsArc0.png" alt="" style={{ width: '32px', height: '32px', zIndex: 1 }} /> Top 5 Weapons of {weapons.length} in inventory</h2>

    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Bag</TableCell>
            <TableCell>Slot</TableCell>
            <TableCell>Weapon Power</TableCell>
            <TableCell>ACC %</TableCell>
            <TableCell>Extra Tachions %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topWeaponsWP.map((item, index) => {
            return <TableRow key={"t" + index}>
              <TableCell><img style={{ objectPosition: '0 0px' }} src={`/data/UIinventoryTabs${item.bag}.png`} alt={item.bag} /></TableCell>
              <TableCell>Slot {item.place}</TableCell>
              <TableCell>{item.Weapon_Power}</TableCell>
              <TableCell>{item.UQ1val}</TableCell>
              <TableCell>{item.UQ2val}</TableCell>
            </TableRow>
          })}
        </TableBody>
      </Table>
    </TableContainer><br />
    <h2><img src="/data/EquipmentRingsArc0.png" alt="" style={{ width: '32px', height: '32px', zIndex: 1 }} /> Top 5 Rings (Tachions) of {rings.length} in inventory</h2>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Bag</TableCell>
            <TableCell>Slot</TableCell>
            <TableCell>ACC %</TableCell>
            <TableCell>Extra Tachions %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topRingsTachion.map((item, index) => {
            return <TableRow key={"t" + index}>
              <TableCell><img style={{ objectPosition: '0 0px' }} src={`/data/UIinventoryTabs${item.bag}.png`} alt={item.bag} /></TableCell>
              <TableCell>Slot {item.place}</TableCell>
              <TableCell>{item.UQ1val}</TableCell>
              <TableCell>{item.UQ2val}</TableCell>
            </TableRow>
          })}
        </TableBody>
      </Table>
    </TableContainer><br />
    <h2><img src="/data/EquipmentRingsArc0.png" alt="" style={{ width: '32px', height: '32px', zIndex: 1 }} /> Top 5 Rings (ACC) of {rings.length} in inventory</h2>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Bag</TableCell>
            <TableCell>Slot</TableCell>
            <TableCell>ACC %</TableCell>
            <TableCell>Extra Tachions %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topRingsACC.map((item, index) => {
            return <TableRow key={"a" + index}>
              <TableCell><img style={{ objectPosition: '0 0px' }} src={`/data/UIinventoryTabs${item.bag}.png`} alt={item.bag} /></TableCell>
              <TableCell>Slot {item.place}</TableCell>
              <TableCell>{item.UQ1val}</TableCell>
              <TableCell>{item.UQ2val}</TableCell>
            </TableRow>
          })}
        </TableBody>
      </Table>
    </TableContainer>


  </>;

  // return <Stack sx={{ width: 250 }}>
  //   {items.map((item, index) => {
  //     // console.log(item);
  //     return <Tooltip title={item?.perHour ? <ExtraData {...item} amount={item?.amount} /> : <ItemDisplay {...item} />}
  //       key={item?.rawName + '' + index}
  //     >{item.name}</Tooltip>
  //   })}
  // </Stack>
};

const ExtraData = ({ name, displayName, perHour, perDay, perGoal, amount }) => {
  return <Stack>
    <Typography variant={'body1'}>{cleanUnderscore(name || displayName)}</Typography>
    {perHour ? <Divider sx={{ my: 1 }} /> : null}
    {perHour ? <Typography variant={'body2'}>Total: {notateNumber(amount)}</Typography> : null}
    {perHour ? <Typography variant={'body2'}>{numberWithCommas(perHour.toFixed(2))} / hr</Typography> : null}
    {perDay ? <Typography variant={'body2'}>{numberWithCommas(perDay.toFixed(2))} / day</Typography> : null}
    {perGoal ? <Typography variant={'body2'}>{perGoal > 0
      ? `${numberWithCommas(perGoal.toFixed(2))} hours to goal`
      : 'Goal reached'} </Typography> : null}
  </Stack>
}

export default ACItems;
