import React from 'react';
import Library from "../account/Worlds/World3/Library";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { notateNumber, prefix } from "../../utility/helpers";
import { getGiantMobChance } from "../../parsers/misc";
import Tooltip from "../Tooltip";

const Etc = ({ characters, account, lastUpdated }) => {
  const giantMob = getGiantMobChance(characters?.[0], account);
  return <>
    <Card>
      <CardContent>
        <Stack direction={'row'} flexWrap={'wrap'}>
          <Card variant={'outlined'} sx={{ width: 'fit-content' }}>
            <CardContent>
              <Library libraryTimes={account?.libraryTimes} lastUpdated={lastUpdated}/>
            </CardContent>
          </Card>
          <Card variant={'outlined'} sx={{ width: 'fit-content', height: 'fit-content' }}>
            <CardContent>
              <Stack direction={'row'} alignItems={'center'} gap={2}>
                <Tooltip title={<Stack>
                  <Typography sx={{ fontWeight: 'bold' }}>Giant Mob Chance</Typography>
                  <Typography>+{giantMob?.crescentShrineBonus}% from Crescent shrine</Typography>
                  <Typography>+{giantMob?.giantMobVial}% from Shaved Ice vial</Typography>
                  {giantMob?.glitterbugPrayer > 0 ?
                    <Typography>-{giantMob?.glitterbugPrayer}% from Glitterbug prayer</Typography> : null}
                </Stack>}>
                  <IconImg src={`${prefix}data/Prayer5.png`}/>
                </Tooltip>
                <Typography>1
                  in {notateNumber(Math.floor(1 / giantMob?.chance))}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </CardContent>
    </Card>
  </>
};


const IconImg = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`;


export default Etc;
