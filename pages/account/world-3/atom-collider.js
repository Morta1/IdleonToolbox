import React, { useContext } from 'react';
import { AppContext } from "../../../components/common/context/AppProvider";
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "../../../utility/helpers";
import processString from 'react-process-string';

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
               alt="" style={{ objectFit: 'contain' }}/>
          <Typography>{particles}</Typography>
        </Stack>
      </CardContent>
    </Card>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {atoms?.map(({ name, desc, level, rawName, baseBonus, cost, bonus }, index) => {
        if (index >= MAX_ATOMS) return;
        const description = cleanUnderscore(desc)
          .replace(/{/g, `${baseBonus * level}`)
          .replace(/[>}]/, notateNumber(bonus, 'Big'))
          .replace('<', level);
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
              <Typography variant={'body1'} component={'div'}>
                {processString([{
                  regex: /Total bonus.*/,
                  fn: (key, result) => {
                    return <div key={key} style={{ marginTop: 15 }}>{result[0]}</div>
                  }
                }])(description)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default AtomCollider;
