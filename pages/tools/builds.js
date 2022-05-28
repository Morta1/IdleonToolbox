import { useEffect, useState } from 'react';
import { Card, CardContent, FormControl, Grid, InputLabel, Select, Stack, Typography } from "@mui/material";
import { cleanUnderscore, growth, prefix } from "utility/helpers";
import Tooltip from "components/Tooltip";
import { classes } from "data/website-data";
import MenuItem from "@mui/material/MenuItem";
import allBuilds from 'data/builds.json';
import styled from "@emotion/styled";
import { useRouter } from "next/router";

const allClasses = Object.keys(allBuilds);

const DEFAULT_TITLE = 'Let me know if you want to add a build in here!'

const Builds = () => {
  const router = useRouter();
  const [className, setClassName] = useState(allClasses[1]);
  const [buildLists, setBuildLists] = useState(allBuilds[className]);
  const [buildIndex, setBuildIndex] = useState(0);

  useEffect(() => {
    if (router.query) {
      let { c, b } = router.query || {};
      c = c?.capitalizeAll();
      if (allClasses.includes(c)) {
        setClassName(c);
        setBuildLists(allBuilds[c]);
        if (!isNaN(b) || (Number(b) < allBuilds[c].length)) {
          setBuildIndex(b);
        } else {
          setBuildIndex(0);
        }
      }
    }
  }, []);

  const handleClassChange = (event) => {
    setClassName(event.target.value);
    setBuildLists(allBuilds[event.target.value]);
    setBuildIndex(0);
    router.replace({ query: { ...router.query, c: event.target.value.toLowerCase(), b: '0' } })
  };

  const handleBuildChange = (event) => {
    const buildIndex = event.target.value;
    setBuildIndex(buildIndex);
    router.replace({ query: { ...router.query, b: buildIndex + '' } })
  };

  return <>
    <Typography mt={2} variant={"h2"}>Builds</Typography>
    <Stack direction={'row'} my={3} gap={2} flexWrap={'wrap'}>
      <FormControl sx={{ width: 270 }}>
        <InputLabel id="class-select-label">Class</InputLabel>
        <Select
          labelId="class-select-label"
          id="class-select"
          value={className}
          label="Class"
          onChange={handleClassChange}
        >
          {Object.keys(allBuilds).map((name, index) => {
            return <MenuItem key={`${name}-${index}`} value={name}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <ClassIcon src={`${prefix}data/ClassIcons${classes.indexOf(name)}.png`} alt=""/>
                <Typography>{cleanUnderscore(name)}</Typography>
              </Stack>
            </MenuItem>;
          })}
        </Select>
      </FormControl>
      <FormControl sx={{ width: 350 }}>
        <InputLabel id="build-select-label">Build</InputLabel>
        <Select
          placeholder={'Choose a build'}
          labelId="build-select-label"
          id="build-select"
          value={buildIndex}
          label="Build"
          onChange={handleBuildChange}
        >
          {buildLists.map((build, index) => {
            const { title } = build;
            return <MenuItem key={`${title}-${index}`} value={index}>{title}</MenuItem>;
          })}
        </Select>
        <Typography mb={2} variant={"caption"}>New builds additions are always welcome!</Typography>
      </FormControl>
    </Stack>


    {buildLists.length > 0 ? <div>
      <Typography mb={3} variant={'h4'}>{buildLists[buildIndex]?.title}</Typography>
      <Grid container spacing={2}>
        {buildLists[buildIndex]?.tabs?.map((tab, index) => {
          return <Grid item key={`${tab.title}-${index}`}>
            <Tab {...tab}/>
          </Grid>
        })}
      </Grid>
    </div> : <Typography variant={'h5'}>There are not builds for this class</Typography>}
  </>
};

const ClassIcon = styled.img`
  height: 25px;
  width: 25px;
  object-fit: contain;
`

const Tab = ({ note, talents: talentList = [] }) => {
  return <>
    <Stack gap={1} direction={'row'} flexWrap={'wrap'} sx={{ width: 320, minHeight: 255.95 }}>
      {talentList.map((skill) => {
        const { name, skillIndex, level } = skill;
        return <Stack alignItems={'center'} key={skillIndex}>
          <Tooltip
            title={<TalentTooltip name={name} level={level} skill={skill}/>}>
            <img style={{ opacity: level === 0 ? .3 : 1 }} src={`${prefix}data/UISkillIcon${skillIndex}.png`} alt=""/>
          </Tooltip>
          <Typography variant={'body1'}>{level || <span>&nbsp;</span>}</Typography>
        </Stack>
      })}
    </Stack>
    <Card sx={{ width: 320, my: 2 }}>
      <CardContent>
        <Typography>{note}</Typography>
      </CardContent>
    </Card>
  </>
};

const TalentTooltip = ({ name, skill, level }) => {
  const { description, funcX, x1, x2, funcY, y1, y2 } = skill;
  const realLevel = isNaN(parseInt(level)) ? 100 : parseInt(level);
  const mainStat = realLevel > 0 ? growth(funcX, realLevel, x1, x2) : 0;
  const secondaryStat = realLevel > 0 ? growth(funcY, realLevel, y1, y2) : 0;
  return <>
    <Typography variant={'h5'}>{cleanUnderscore(name)}</Typography>
    <Typography
      variant={'body1'}>{cleanUnderscore(cleanUnderscore(description).replace('{', mainStat).replace('}', secondaryStat))}</Typography>
  </>
}

export default Builds;
