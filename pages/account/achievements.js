import { useContext, useEffect, useState } from "react";
import { Box, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import styled from "@emotion/styled";
import HtmlTooltip from "components/Tooltip";
import { AppContext } from "components/common/context/AppProvider";
import { cleanUnderscore, notateNumber, prefix } from "utility/helpers";

const achievementsPerWorld = 70;
const worlds = ['World 1', 'World 2', 'World 3', 'World 4'];

const Achievements = () => {
  const { state } = useContext(AppContext);
  const [localAchievements, setLocalAchievements] = useState(state?.account?.achievements);
  const [world, setWorld] = useState(0);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });

  useEffect(() => {
    setLocalAchievements(getWorldAchievements(world * achievementsPerWorld, world * achievementsPerWorld + achievementsPerWorld));
  }, [state])

  const handleWorldChange = (e, world) => {
    setLocalAchievements(getWorldAchievements(world * achievementsPerWorld, world * achievementsPerWorld + achievementsPerWorld));
    setWorld(world);
  }

  const getWorldAchievements = (start, end) => {
    const achievements = state?.account?.achievements?.slice(start, end);
    achievements?.sort((a, b) => a?.visualIndex - b?.visualIndex);
    return achievements;
  }

  return (
    <Box>
      <Tabs centered
            variant={isSm ? 'fullWidth' : 'standard'}
            value={world} onChange={handleWorldChange}>
        {worlds?.map((world, index) => {
          return <Tab label={world} key={`${world}-${index}`}/>
        })}
      </Tabs>
      <Box display={'flex'} justifyContent={'center'}>
        {localAchievements?.length > 0 ?
          <Stack sx={{ width: { lg: 900 } }} justifyContent={'center'} mt={3} flexWrap={'wrap'} direction={'row'}
                 gap={3}>
            {localAchievements?.map((achievement, index) => {
              const { name, rawName, completed, visualIndex, currentQuantity, quantity } = achievement;
              return visualIndex !== -1 && !name.includes('FILLER') ?
                <Stack sx={{ position: 'relative' }} key={`${name}-${index}`}>
                  <HtmlTooltip title={<AchievementTooltip {...achievement}/>}>
                    <Achievement completed={completed} src={`${prefix}data/${rawName}.png`} alt=""/>
                  </HtmlTooltip>
                  {currentQuantity ? <Quantity>
                    {notateNumber(currentQuantity)} {quantity > 1 ?
                    <span> / {notateNumber(quantity, 'Big')}</span> : null}
                  </Quantity> : null}
                </Stack> : null
            })}
          </Stack> : <Typography mt={2} variant={'h4'}>No achievements yet</Typography>}
      </Box>
    </Box>
  );
};

const Quantity = styled.span`
  position: absolute;
  font-size: 14px;
  z-index: 1;
  bottom: -24px;
  pointer-events: none;
  width: 80px;
  left: -4px;
`

const Achievement = styled.img`
  filter: ${({ completed }) => completed ? 'grayscale(0)' : 'grayscale(.8)'};
  opacity: ${({ completed }) => completed ? '1' : '0.3'};
  margin-left: -4px;
  object-fit: contain;
  width: 60px;
`;

const AchievementTooltip = ({ name, desc, rewards, currentQuantity, quantity }) => {
  return <>
    <Typography variant={'h5'} fontWeight={500}>{cleanUnderscore(name)}</Typography>
    <Typography variant={'body1'}>{cleanUnderscore(desc)}</Typography>
    {currentQuantity ? <Box mt={1} mb={1}>
      <Typography variant={'body1'}>Progress: {currentQuantity} {quantity > 1 ?
        <span> / {quantity}</span> : null}</Typography>
    </Box> : null}
    <Box mt={1}>
      <Typography variant={'body1'} fontWeight={'bold'}>Rewards:</Typography>
      <Typography variant={'body1'}>{cleanUnderscore(rewards.join(', '))}</Typography>
    </Box>
  </>
}

export default Achievements;
