import React, { useContext } from 'react';
import { AppContext } from "../../../components/common/context/AppProvider";
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "../../../utility/helpers";

const ATOM_MAX_LEVEL = 20;
const MAX_ATOMS = 10;

const AtomCollider = ({}) => {
  const { state } = useContext(AppContext);
  const { atoms, particles } = state?.account?.atoms || {};

  return <>
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Atoms</Typography>
    <Card sx={{ my: 2, width: 'fit-content' }}>
      <CardContent>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <img src={`${prefix}etc/Particle.png`}
               alt=""  style={{ objectFit: 'contain' }}/>
          <Typography>{particles}</Typography>
        </Stack>
      </CardContent>
    </Card>
    <Stack direction={'row'} gap={2}  flexWrap={'wrap'}>
      {atoms?.map(({ name, desc, level, rawName, baseBonus, cost }, index) => {
        if (index >= MAX_ATOMS) return;
        return <Card key={rawName}>
          <CardContent sx={{ width: 250 }}>
            <Stack>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <img src={`${prefix}data/${rawName}.png`}
                     alt="" width={64} height={64} style={{ objectFit: 'contain' }}/>
                <Stack>
                  <Typography>{cleanUnderscore(name)}</Typography>
                  <Typography>Lv. {level} / {ATOM_MAX_LEVEL}</Typography>
                  <Typography>Cost: {notateNumber(cost, 'Big')}</Typography>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }}/>
              <Typography variant={'body1'}>{cleanUnderscore(desc).replace('{', `${baseBonus * level}`)}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default AtomCollider;
