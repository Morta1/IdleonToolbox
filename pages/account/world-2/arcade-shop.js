import { Card, CardContent, Stack, Typography } from "@mui/material";
import React, { useContext } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { cleanUnderscore, kFormatter, notateNumber, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import { getStampBonus } from "parsers/stamps";

const ArcadeShop = () => {
  const { state } = useContext(AppContext);
  const { balls, goldBalls, shop } = state?.account?.arcade;

  const getCost = (level) => {
    const multiplier = (state?.account?.lab?.labBonuses?.find((bonus) => bonus.name === 'Certified_Stamp_Book')?.active) ? 2 : 1;
    const arcadeStamp = getStampBonus(state?.account?.stamps, 'misc', 'StampC5', 0, multiplier);
    const arcadeStampMath = Math.max(0.6, 1 - arcadeStamp / 100);
    return Math.round(arcadeStampMath * (5 + (3 * level + Math.pow(level, 1.3))));
  }

  const getCostToMax = (level) => {
    let total = 0;
    for (let i = level; i < 100; i++) {
      total += getCost(i);
    }
    return total
  }

  return (
    <Stack>
      <Typography variant={'h2'} mb={3}>Arcade Shop</Typography>
      <Stack direction={'row'} gap={2}>
        {[balls, goldBalls]?.map((ballsQuantity, index) => {
          return <Card key={index}>
            <CardContent>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <BallIcon gold={index === 1} src={`${prefix}data/PachiBall${index}.png`} alt=""/>
                {ballsQuantity}
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
      <Stack mt={2} direction={'row'} flexWrap={'wrap'} gap={2}>
        {shop?.map((upgrade, index) => {
          const { level, effect, active, iconName, bonus } = upgrade;
          const eff = cleanUnderscore(effect.replace('{', notateNumber(bonus, 'Small')));
          const cost = getCost(level);
          const costToMax = getCostToMax(level);
          return <Card sx={{
            width: { xs: 150, md: 350 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'column', md: 'row' }
          }} key={`${iconName}-${index}`}>
            <UpgradeIcon style={{
              margin: 16,
              justifySelf: 'center',
              alignSelf: 'center',
              filter: active ? 'unset' : 'grayscale(1)'
            }} src={`${prefix}data/${iconName}.png`}/>
            <CardContent>
              <div style={{ fontWeight: 'bold' }}>Effect: {eff}</div>
              {level !== 100 ? <div>Lv: {level} / 100</div> :
                <div className={'done'}>MAXED</div>}
              <div>Cost: {kFormatter(cost, 2)}</div>
              <div>Cost to max: {kFormatter(costToMax, 2)}</div>
            </CardContent>
          </Card>
        })}
      </Stack>
    </Stack>
  );
};

const UpgradeIcon = styled.img`
  width: 62px;
  height: 62px;
`

const BallIcon = styled.img`
  width: 24px;
  height: 24px;
  ${({ gold }) => gold ? `filter: hue-rotate(70deg) brightness(2);` : ''}
`

export default ArcadeShop;
