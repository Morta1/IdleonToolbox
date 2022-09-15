import React, { useContext } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { Badge, Card, CardContent, Stack, Typography } from "@mui/material";
import { fillArrayToLength, prefix } from "utility/helpers";
import Timer from "components/common/Timer";
import styled from "@emotion/styled";
import ProgressBar from "components/common/ProgressBar";

const Anvil = () => {
  const { state } = useContext(AppContext);
  const { anvil } = state?.account;

  return <>
    <Typography variant={'h2'} mb={3}>Anvil</Typography>
    <Stack gap={3}>
      {anvil?.map((anvil, index) => {
        const classIndex = state?.characters?.[index]?.classIndex;
        const playerName = state?.characters?.[index]?.name;
        const smithingLevel = state?.characters?.[index].skillsInfo?.smithing?.level;
        const { availablePoints, pointsFromCoins, pointsFromMats } = state?.characters?.[index]?.anvil?.stats;
        const color = availablePoints === 0 ? "" : availablePoints > 0 ? "error.light" : "secondary";
        const afkTime = state?.characters?.[index]?.afkTime;
        const hammerBubble = state?.characters?.[index]?.equippedBubbles?.find(({ bubbleName }) => bubbleName === 'HAMMER_HAMMER');
        const maxProducts = hammerBubble ? 3 : 2;
        const production = anvil?.production?.filter(({ hammers }) => hammers > 0);
        const numOfHammers = production.reduce((res, { hammers }) => res + hammers, 0);
        const realProduction = numOfHammers === maxProducts ? production : fillArrayToLength(numOfHammers, production);
        return <Card key={`printer-row-${index}`} sx={{ width: { xs: '100%', lg: 700 } }}>
          <CardContent>
            <Stack sx={{ flexDirection: { xs: 'column', md: 'row' } }} alignItems={'center'} gap={2}>
              <Stack sx={{ width: 175, textAlign: 'center', flexDirection: { xs: 'column', md: 'row' } }}
                     alignItems={'center'} gap={2}>
                <Stack alignItems={'center'} justifyContent={'center'}>
                  <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                </Stack>
                <Stack>
                  <Typography className={'character-name'}>{playerName}</Typography>
                  <Typography variant={'caption'}>Smithing lv. {smithingLevel}</Typography>
                  <Typography variant={'caption'} color={color}>Points {pointsFromCoins + pointsFromMats - availablePoints} / {pointsFromCoins + pointsFromMats}</Typography>
                </Stack>
              </Stack>
              <Stack sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }} direction={'row'} alignItems={'center'}
                     flexWrap={'wrap'} gap={3}>
                {realProduction?.map((slot, slotIndex) => {
                  const { rawName, hammers, currentAmount, currentProgress, time } = slot;
                  const timePassed = (new Date().getTime() - afkTime) / 1000;
                  const futureProduction = Math.min(Math.round(currentAmount + ((currentProgress + (timePassed * anvil?.stats?.anvilSpeed / 3600)) / time) * (hammers ?? 0)), anvil?.stats?.anvilCapacity);
                  const percentOfCap = Math.round(futureProduction / anvil?.stats?.anvilCapacity * 100);
                  const timeTillCap = ((anvil?.stats?.anvilCapacity - futureProduction) / (anvil?.stats?.anvilSpeed / 3600 / time * (hammers ?? 0)));
                  return <Card elevation={5}
                               sx={{ boxShadow: hammers > 0 ? 'inherit' : '0px 0px 5px #ff0707' }}
                               key={`${rawName}-${slotIndex}`}>
                    <CardContent>
                      {hammers > 0 ? <Stack sx={{ width: 90, height: 65 }}
                                            justifyContent={'flex-start'}
                                            alignItems={'center'}>
                        <Badge color="secondary" variant={'standard'} badgeContent={hammers > 1 ? hammers : 0}>
                          <ItemIcon src={`${prefix}data/${rawName}.png`} alt=""/>
                        </Badge>
                        <ProgressBar percent={percentOfCap} label={false}/>
                        <Timer date={new Date().getTime() + (timeTillCap * 1000)}
                               type={'countdown'}
                               placeholder={<Typography color={'error.light'}>Full</Typography>}
                               lastUpdated={state?.lastUpdated}/>
                      </Stack> : <Stack sx={{ width: 90, height: 65 }} alignItems={'center'}
                                        justifyContent={'center'}>
                        <Typography variant={'caption'}>EMPTY</Typography>
                      </Stack>}
                    </CardContent>
                  </Card>
                })}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const ItemIcon = styled.img`
  width: 42px;
  height: 42px;
`

export default Anvil;
