import React, { useMemo, useState } from "react";
import { Container, Dialog, DialogContent, DialogTitle, Stack, Typography, useMediaQuery } from "@mui/material";
import Instructions from "components/common/Instructions";
import PastebinInstructions from "components/common/PastebinInstructions";
import { useRouter } from "next/router";
import { getRandomNumbersArray, prefix } from '../utility/helpers'
import useInterval from "../components/hooks/useInterval";
import { animate, AnimatePresence, motion, MotionConfig, useMotionValue } from "framer-motion"
import Button from "@mui/material/Button";
import styled from "@emotion/styled";
import { patchNotes } from "../data/patch-notes";
import PatchNotes from "./patch-notes";
import { NextLinkComposed } from "../components/common/NextLinkComposed";
import Link from "@mui/material/Link";
import { useFlubber } from "../components/hooks/useFlubber";
import Box from "@mui/material/Box";

const Home = () => {
  const indexes = useMemo(() => getRandomNumbersArray(6, 6), []);
  const breakpoint = useMediaQuery('(max-width: 1230px)', { noSsr: true });
  const breakpointLg = useMediaQuery('(min-width: 1921px)', { noSsr: true });
  const [bgIndex, setBgIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [openPastebin, setOpenPastebin] = useState(false);
  const [pathIndex, setPathIndex] = useState(1);
  const progress = useMotionValue(pathIndex);
  const path = useFlubber(progress, ['m15 5-1.41 1.41L18.17 11H2v2h16.17l-4.59 4.59L15 19l7-7-7-7z',
    'M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z']);

  const handleAnimation = (enter) => {
    setPathIndex(enter ? 1 : 0)
    animate(progress, pathIndex, {
      duration: .2,
      ease: 'easeInOut'
    })
  }

  useInterval(() => {
    const index = bgIndex + 1 === indexes?.length ? 0 : bgIndex + 1;
    setBgIndex(index)
  }, 5000);

  return (
    <Container>
      <Stack mt={breakpointLg ? 5 : breakpoint ? 1 : 1} direction={'row'} flexWrap={'wrap'}
             sx={{ textAlign: breakpoint ? 'center' : 'inherit' }}
             gap={breakpoint ? 6 : 2}>
        <Stack sx={{ width: breakpoint ? '100%' : '50%' }}>
          <Typography style={{ fontWeight: 400 }} variant={"h1"}>
            Idleon Toolbox
          </Typography>
          <Typography mt={2} variant={"h6"} style={{ fontWeight: 400, color: '#e3e3e3' }}>Power up your Legends of
            Idleon
            adventure with Idleon Toolbox's essential tools and resources for optimizing gameplay, character builds,
            crafting, and more.</Typography>
          <Stack direction={'row'} mt={3} gap={3} flexWrap={'wrap'} justifyContent={breakpoint ? 'center' : 'inherit'}>
            <DiscordButton href={'https://discord.gg/8Devcj7FzV'} target={'_blank'} variant={'contained'}>
              Join the discord
            </DiscordButton>
            <a style={{ display: "flex", alignItems: "center" }} href="https://ko-fi.com/S6S7BHLQ4" target="_blank"
               rel="noreferrer">
              <img height="36" width="150" style={{ border: 0, height: 36, width: "100%", objectFit: "contain" }}
                   src="https://cdn.ko-fi.com/cdn/kofi1.png?v=3" alt="Buy Me a Coffee at ko-fi.com"/>
            </a>
          </Stack>
          {/*<Typography component={'div'} variant={'body1'} my={3}>*/}
          {/*  * Please consider disabling your ad-blocker to show your support for the platform, ensuring free access to*/}
          {/*  valuable content for all users <FavoriteIcon color={'error'}*/}
          {/*                                               sx={{ fontSize: 12 }}/>*/}
          {/*</Typography>*/}
        </Stack>
        <Stack sx={{ width: breakpoint ? '100%' : 'inherit' }} justifyContent={breakpoint ? 'flex-start' : 'center'}>
          <Box sx={{ width: breakpoint ? '100%' : 550, height: 310, position: 'relative' }}>
            <MotionConfig transition={{ duration: .8 }}>
              <AnimatePresence>
                {indexes.map((_, index) => {
                  return bgIndex === index ? <motion.img
                    key={'image' + index}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      maxWidth: 550,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      borderRadius: 10,
                      boxShadow: '0 10px 15px -3px #000000'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={`${prefix}etc/bg_${indexes.at(bgIndex)}.png`}
                    alt=""/> : null
                })}
              </AnimatePresence>
            </MotionConfig>
          </Box>
        </Stack>
      </Stack>
      {/*  <Adsense*/}
      {/*    style={{ display: 'inline-block', height: 90, maxHeight: 90 }}*/}
      {/*    client="ca-pub-1842647313167572"*/}
      {/*    slot="7203005854"*/}
      {/*    format={''}*/}
      {/*  />*/}
      {/*</div>*/}
      <motion.div style={{ marginTop: breakpoint ? 0 : 80 }} transition={{ duration: .8 }}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}>
        <Typography variant={'h4'} mt={2}>IT Patch Notes</Typography>
        <Link to={{ pathname: '/patch-notes', }}
              onMouseEnter={() => handleAnimation(true)}
              onMouseLeave={() => handleAnimation()}
              sx={{ my: 2, display: 'inline-flex', alignItems: 'center', gap: 1 }}
              underline={'none'}
              component={NextLinkComposed}
              noWrap variant="body1">
          More patch notes <svg
          width={24} height={24} fill={'#90caf9'}>
          <g>
            <motion.path d={path}/>
          </g>
        </svg>
        </Link>
        <PatchNotes patchNotes={patchNotes.slice(0, 3)}/>
      </motion.div>
      <Dialog open={openPastebin} onClose={() => setOpenPastebin(false)}>
        <DialogTitle>Pastebin</DialogTitle>
        <DialogContent>
          <PastebinInstructions/>
        </DialogContent>
      </Dialog>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Instructions</DialogTitle>
        <DialogContent>
          <Instructions/>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

const DiscordButton = styled(Button)`
  width: fit-content;
  background-color: #5865f2;
  color: #ffffff;

  &:hover {
    background-color: hsl(235 51.4% 52.4%);
  }
`

export default Home;
