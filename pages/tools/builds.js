import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputBase,
  InputLabel,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import { cleanUnderscore, growth, isProd, prefix } from '@utility/helpers';
import Tooltip from 'components/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import { classes } from 'data/website-data';
import MenuItem from '@mui/material/MenuItem';
import allBuilds from 'data/builds.json';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import debounce from 'lodash.debounce';
import Button from '@mui/material/Button';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Adsense } from '@ctrl/react-adsense';
import { CONTENT_PERCENT_SIZE } from '@utility/consts';

const allClasses = Object.keys(allBuilds);

const Builds = () => {
  const router = useRouter();
  const [build, setBuild] = useState({
    index: 0,
    className: allClasses[1],
    list: allBuilds[allClasses[1]]
  });
  const [createMode, setCreateMode] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [customBuild, setCustomBuild] = useState();
  const showWideSideBanner = useMediaQuery('(min-width: 1600px)', { noSsr: true });
  const showNarrowSideBanner = useMediaQuery('(min-width: 850px)', { noSsr: true });

  useEffect(() => {
    if (router.query) {
      let { c, b } = router.query || {};
      c = c?.capitalizeAll();
      if (allClasses.includes(c)) {
        let ind;
        if (!isNaN(b) || (Number(b) < allBuilds[c].length)) {
          ind = b;
        } else {
          ind = 0;
        }
        setBuild({
          index: parseInt(ind),
          className: c,
          list: allBuilds[c]
        })
      }
    }
  }, []);


  const handleClassChange = (event) => {
    setBuild({
      ...build,
      index: 0,
      className: event.target.value,
      list: allBuilds[event.target.value]
    })
    setCustomBuild();
    router.replace({ query: { ...router.query, c: event.target.value.toLowerCase(), b: 0 } })
  };

  const handleBuildChange = (event) => {
    const buildIndex = event.target.value;
    setBuild({ ...build, index: parseInt(buildIndex) })
    router.replace({ query: { ...router.query, b: parseInt(buildIndex) } })
  };

  const handleCustomBuildChange = ({ tabIndex, tabTalents, tabNote }) => {
    let tempTabs = {};
    const allTabs = !customBuild?.tabs ? build?.list?.[0]?.tabs?.toObjectByIndex() : {};
    if (tabTalents) {
      tempTabs = {
        tabs: {
          ...allTabs,
          ...customBuild?.tabs,
          [tabIndex]: {
            ...(customBuild?.tabs?.[tabIndex] || allTabs?.[tabIndex]),
            talents: tabTalents
          }
        }
      }
    }
    if (tabNote) {
      tempTabs = {
        tabs: {
          ...allTabs,
          ...customBuild?.tabs,
          [tabIndex]: {
            ...(customBuild?.tabs?.[tabIndex] || allTabs?.[tabIndex]),
            note: tabNote
          }
        }
      }
    }

    setCustomBuild({ ...customBuild, ...tempTabs });
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({
        ...customBuild,
        class: build?.className,
        tabs: Object.values(customBuild?.tabs)
      }));
    } catch (err) {
      console.error(err);
    }
  }

  const getSpecificList = (index) => {
    return build?.list?.find((_, ind) => ind === index);
  }

  return <>
    <NextSeo
      title="Idleon Toolbox | Builds"
      description="Builds for all classes"
    />
    <Stack direction={'row'} gap={2} justifyContent={'space-between'}>
      <Stack sx={{ maxWidth: !showNarrowSideBanner && !showWideSideBanner ? '100%' : CONTENT_PERCENT_SIZE }}>
        <Typography mt={2} variant={"h2"}>Builds</Typography>
        <Stack direction={'row'} my={3} gap={2} flexWrap={'wrap'} alignItems={'center'}>
          <FormControl sx={{ width: 270 }}>
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              disabled={createMode}
              labelId="class-select-label"
              id="class-select"
              value={build?.className}
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
              disabled={createMode}
              placeholder={'Choose a build'}
              labelId="build-select-label"
              id="build-select"
              value={build?.index}
              label="Build"
              onChange={handleBuildChange}>
              {build?.list?.map((build, index) => {
                const { title } = build;
                return <MenuItem key={`${title}-${index}`}
                                 value={index}>{title || 'Press + to add the first build!'}</MenuItem>;
              })}
            </Select>
          </FormControl>
          <FormControl>
            <IconButton onClick={() => setCreateMode(true)}>
              <AddIcon/>
            </IconButton>
          </FormControl>
          {createMode ? <FormControl>
            <Tooltip title={'Exit create mode'}>
              <IconButton onClick={() => setOpenDialog(true)}>
                <ClearIcon/>
              </IconButton>
            </Tooltip>
          </FormControl> : null}
        </Stack>
        <Stack>
          {build?.list?.length > 0 ? <div>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <Typography
                variant={'h4'}>{createMode ? 'Custom Build' : getSpecificList(build?.index)?.title}</Typography>
              {createMode ? <Tooltip title={'Share custom build'}>
                <IconButton onClick={handleShare}>
                  <FileCopyIcon/>
                </IconButton>
              </Tooltip> : null}
            </Stack>
            {createMode ?
              <Typography component={'div'} variant={'caption'} sx={{ mb: 3 }}>* If you want to share your custom
                build, click on copy icon above and paste in <a
                  style={{ textDecoration: 'underline' }}
                  href="https://github.com/Morta1/IdleonToolbox/discussions/categories/builds">Builds Discussions</a> or
                send it
                in the discord Builds channel</Typography> : null}
            <Grid container spacing={2}>
              {getSpecificList(build?.index)?.tabs?.map((tab, index) => {
                return <Grid item key={`${build?.index}-${build?.className}-${index}`}>
                  <Tab {...tab} createMode={createMode} onCustomBuildChange={handleCustomBuildChange} tabIndex={index}/>
                </Grid>
              })}
            </Grid>
          </div> : <Typography variant={'h5'}>There are no builds for this class</Typography>}
        </Stack>
      </Stack>
      {showWideSideBanner || showNarrowSideBanner ? <Box
        sx={{
          backgroundColor: isProd ? '' : '#d73333',
          width: showWideSideBanner ? 300 : showNarrowSideBanner ? 160 : 0,
          height: 600
        }}>
        {showWideSideBanner ? <Adsense
          client="ca-pub-1842647313167572"
          slot="7052896184"
        /> : null}
        {showNarrowSideBanner && !showWideSideBanner ? <Adsense
          client="ca-pub-1842647313167572"
          slot="5548242827"
        /> : null}
      </Box> : null}
    </Stack>

    <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
      <DialogTitle>Edit mode</DialogTitle>
      <DialogContent>
        Are you sure you want to exit edit mode?
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={() => {
          setCreateMode(false);
          setOpenDialog(false);
        }}>Yes</Button>
        <Button onClick={() => setOpenDialog(false)}>No</Button>
      </DialogActions>
    </Dialog>
  </>
};

const ClassIcon = styled.img`
  height: 25px;
  width: 25px;
  object-fit: contain;
`

const Tab = ({ note, talents: talentList = [], createMode, onCustomBuildChange, tabIndex }) => {
  const [localTalents, setLocalTalents] = useState([]);

  useEffect(() => {
    setLocalTalents(!createMode ? talentList : talentList?.map((talent) => ({
      ...talent,
      level: 0
    })))
  }, [createMode]);

  const handleChange = debounce(({ target }, index) => {
    const val = target?.value;
    let tempTalents, tempNote;
    if (target?.name === 'level') {
      tempTalents = localTalents?.map((talent, ind) => ind === index ? {
        ...talent,
        level: val ? val : 0
      } : talent);
      setLocalTalents(tempTalents);
    }
    if (target?.name === 'note') {
      tempNote = val
    }
    typeof onCustomBuildChange === 'function' && onCustomBuildChange({
      tabIndex,
      tabTalents: tempTalents,
      tabNote: tempNote
    });
  }, 200);

  return <>
    <Stack gap={1} direction={'row'} flexWrap={'wrap'} sx={{ width: 320, minHeight: 255.95 }}>
      {localTalents.map((skill, index) => {
        const { name, skillIndex, level } = skill;
        return <Stack alignItems={'center'} key={skillIndex} sx={{ width: 56, height: 56 }}>
          <Tooltip
            title={<TalentTooltip name={name} level={level} skill={skill}/>}>
            <img style={{ opacity: createMode ? 1 : level === 0 ? .3 : 1 }}
                 src={`${prefix}data/UISkillIcon${skillIndex}.png`} alt=""/>
          </Tooltip>
          {createMode ? <CustomInput name={'level'} onChange={(e) => handleChange(e, index)}/> :
            <Typography variant={'body1'}>{level || <span>&nbsp;</span>}</Typography>}
        </Stack>
      })}
    </Stack>
    <Card sx={{ width: 320, my: 2 }}>
      <CardContent>
        {createMode ? <CustomMultiline name={'note'} minRows={2} multiline placeholder={`Tab ${tabIndex} note`}
                                       onChange={(e) => handleChange(e)}/> :
          <Typography>{note}</Typography>}
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

const CustomInput = styled(InputBase)`
  & .MuiInputBase-input {
    border: 1px solid #7e7e7e;
    border-radius: 5px;
    padding: 3px;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      /* display: none; <- Crashes Chrome on hover */
      -webkit-appearance: none;
      margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
    }

    &[type=number] {
      -moz-appearance: textfield; /* Firefox */
    }
  }
`;

const CustomMultiline = styled(TextField)`
  & {
    width: 100%;
  }
`;

export default Builds;
