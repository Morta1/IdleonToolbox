import { kFormatter, prefix } from "../../utility/helpers";
import Box from "@mui/material/Box";
import { capitalize, Card, CardContent, Stack, Typography } from "@mui/material";
import Tooltip from "../Tooltip";
import React from "react";
import ProgressBar from "../common/ProgressBar";

const getRankColor = (rank) => {
  const colorMap = {
    1: 'success.light',
    2: 'warning.light',
    3: 'secondary.main'
  }
  return colorMap[rank];
}

const Skills = ({ skills, charName }) => {
  return <Stack>
    <Typography variant={'h5'}>Skills</Typography>
    <Card>
      <CardContent>
        <Box sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateColumns: { xs: 'repeat(4, minmax(45px, 100px))' },
          gridTemplateRows: { xs: 'repeat(3, minmax(45px, 100px))' },
          justifyContent: 'center'
        }}>

          {Object.keys(skills)?.map((skillName, index) => {
            const { level, rank, icon } = skills[skillName];
            if (skillName === 'character') return null;
            return <Box key={index}>
              <Tooltip title={<SkillTooltip {...skills?.[skillName]} skillName={skillName} charName={charName}/>}>
                <img src={`${prefix}data/${icon}.png`} alt=""/>
              </Tooltip>
              <Typography>Lv {level}</Typography>
              <Tooltip title={'Rank across the account'}>
                <Typography
                  sx={{
                    width: 'fit-content',
                    color: getRankColor(rank),
                    fontWeight: (rank === 1 || rank === 2 || rank === 3) ? 'bold' : '400'
                  }}>R: {rank}</Typography>
              </Tooltip>
            </Box>;
          })}
        </Box>
      </CardContent>
    </Card>
  </Stack>
};

const SkillTooltip = ({ exp, expReq, charName, skillName, level }) => {
  const percent = exp / expReq * 100;
  return <>
    <Typography variant={'h5'} fontWeight={'bold'}>{charName}</Typography>
    <Typography variant={'body1'}>{capitalize(skillName)} <Typography
      variant={'body1'}
      component={'span'}>(Lv. {level})</Typography></Typography>
    <ProgressBar percent={percent} bgColor={'#f3dd4c'}/>
    <Typography variant={'body1'}>{kFormatter(exp)} / {kFormatter(expReq)} <Typography
      variant={'body1'}
      component={'span'}>({Math.round(percent)}%)</Typography>
    </Typography>
  </>
}


export default Skills;
