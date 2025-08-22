import React, { useEffect, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Grid, Stack, Typography } from '@mui/material';
import Tooltip from 'components/Tooltip';
import allBuilds from 'data/builds.json';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import BuildTab from '@components/tools/builds/BuildTab';
import ClassSelector from '@components/tools/builds/ClassSelector';
import BuildSelector from '@components/tools/builds/BuildSelector';

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
      }, null, 2));
    } catch (err) {
      console.error(err);
    }
  }

  const getSpecificList = (index) => {
    return build?.list?.find((_, ind) => ind === index);
  }

  return <>
    <NextSeo
      title="Builds | Idleon Toolbox"
      description="Legends of Idleon builds for all classes"
    />
    <Typography mt={2} variant={'h2'}>Builds</Typography>
    <Stack direction={'row'} my={3} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <ClassSelector handleChange={handleClassChange} value={build?.className}/>
      <BuildSelector value={build} handleChange={handleBuildChange}/>
    </Stack>
    <Stack>
      {build?.list?.length > 0 ? <div>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <Typography
            variant={'h4'} mb={2}>{createMode ? 'Custom Build' : getSpecificList(build?.index)?.title}</Typography>
          {createMode ? <Tooltip title={'Share custom build'}>
            <IconButton onClick={handleShare}>
              <FileCopyIcon/>
            </IconButton>
          </Tooltip> : null}
        </Stack>
        {createMode ?
          <Typography component={'div'} variant={'caption'} sx={{ mb: 3 }}>* If you want to share your custom
            build, click on copy icon above and paste in send it in the discord Builds channel</Typography> : null}
        <Grid container spacing={2}>
          {getSpecificList(build?.index)?.tabs?.map((tab, index) => {
            return <Grid item key={`${build?.index}-${build?.className}-${index}`}>
              <BuildTab {...tab} createMode={createMode} onCustomBuildChange={handleCustomBuildChange}
                        tabIndex={index}/>
            </Grid>
          })}
        </Grid>
      </div> : <Typography variant={'h5'}>There are no builds for this class</Typography>}
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


export default Builds;
