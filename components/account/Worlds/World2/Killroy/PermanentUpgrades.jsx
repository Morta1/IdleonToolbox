import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, prefix } from '@utility/helpers';

const Upgrades = ({ killroy }) => {
  return (
    <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} gap={1}>
      {killroy?.permanentUpgrades?.map(({ description, level }, index) => <Card key={`upgrade-${index}`}
                                                                                sx={{ height: 150, width: 350 }}>
        <CardContent>
          <Stack direction={'row'} gap={2}>
            <img style={{ objectFit: 'contain' }} src={`${prefix}etc/Skull_Shop_Item_${index}.png`} alt="skull-shop-icon"/>
            <Stack>
              {level > 0 ? <Typography>Upgrades: {level}</Typography> : <>&nbsp;</>}
              <Divider sx={{ my: 1 }}/>
              <Typography>{cleanUnderscore(description.replace('{', 1 + level / 100))}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>)}
    </Stack>
  );
};

export default Upgrades;

