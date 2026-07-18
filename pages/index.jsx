import React, { useContext, useState } from 'react';
import { IconLayoutDashboard, IconLogin2 } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import Head from 'next/head';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import { useTheme } from '@emotion/react';
import LoginDialog from '@components/common/NavBar/LoginDialog';
import { getRandomNumbersArray, prefix } from '@utility/helpers'
import useInterval from '@hooks/useInterval';
import { animate, AnimatePresence, motion, MotionConfig, useMotionValue } from 'framer-motion'
import Button from '@mui/material/Button';
import styled from '@emotion/styled';
import { patchNotes } from '../data/patch-notes';
import PatchNotes from './patch-notes';
import { NextLinkComposed } from '@components/common/NextLinkComposed';
import Link from '@mui/material/Link';
import { useFlubber } from '@hooks/useFlubber';
import Box from '@mui/material/Box';
import { NextSeo } from 'next-seo';
import Kofi from '@components/common/Kofi';
import StructuredData, { createFAQData } from '@components/common/StructuredData';
import { HomeSidebarAds } from '@components/common/Ads/AdUnit';

// Rendered both as visible page content and as FAQPage structured data, so the two can't drift apart.
const faqs = [
  {
    question: 'What is Idleon Toolbox?',
    answer: 'Idleon Toolbox is a comprehensive set of tools and resources designed to help Legends of Idleon players optimize their gameplay, character builds, crafting strategies, and more.'
  },
  {
    question: 'Is Idleon Toolbox free to use?',
    answer: 'Yes, Idleon Toolbox is completely free to use for all Legends of Idleon players.'
  },
  {
    question: 'How do I use idleon toolbox?',
    answer: 'Click Login and sign in with the same credentials as your Idleon account - email, Google, Apple, or Steam. Your save data is parsed automatically so every tool shows your own information.'
  },
  {
    question: 'Is it safe to log in to Idleon Toolbox?',
    answer: 'Yes. Login uses Firebase Authentication directly from your browser to Google, the same auth Legends of Idleon itself uses. Your password is never sent to or stored by Idleon Toolbox. The site is open source so you can verify this yourself. Sharing a public profile or appearing on leaderboards is opt-in from the Settings page.'
  },
  {
    question: 'Do I need to log in to use Idleon Toolbox?',
    answer: 'No. Card Search, Builds, Item Browser and Item Planner work without logging in, along with the Guilds, Statistics and Leaderboards pages. Logging in adds your dashboard, character pages and the tools that need your save data.'
  }
];

const Home = () => {
  const { state } = useContext(AppContext);
  const theme = useTheme();
  const [indexes] = useState(() => getRandomNumbersArray(6, 6));
  const breakpoint = useMediaQuery('(max-width: 1245px)', { noSsr: true });
  const breakpointLg = useMediaQuery('(min-width: 1921px)', { noSsr: true });
  const [bgIndex, setBgIndex] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pathIndex, setPathIndex] = useState(0);
  const progress = useMotionValue(pathIndex);
  const path = useFlubber(progress, [
    'M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z',
    'm15 5-1.41 1.41L18.17 11H2v2h16.17l-4.59 4.59L15 19l7-7-7-7z']);

  const faqData = createFAQData(faqs);

  const handleAnimation = (enter) => {
    setPathIndex(enter ? 0 : 1)
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
      <Head>
        <link rel="preload" as="image" href={`${prefix}etc/bg_${indexes[0]}.png`}/>
      </Head>
      <NextSeo
        title="Home | Idleon Toolbox"
        description="Power up your Legends of Idleon adventure with Idleon Toolbox's essential tools and resources for optimizing gameplay, character builds, crafting, and more."
      />
      <StructuredData data={faqData}/>
      <HomeSidebarAds/>

      <Stack mt={breakpointLg ? 5 : breakpoint ? 1 : 1} direction={'row'} flexWrap={'wrap'}
             sx={{ textAlign: breakpoint ? 'center' : 'inherit' }}
             gap={breakpoint ? 6 : 2}>
        <Stack sx={{ width: breakpoint ? '100%' : '50%' }}>
          <Typography style={{ fontWeight: 400 }} variant={'h1'}>
            Idleon Toolbox
          </Typography>
          <Typography mt={2} variant={'h6'} style={{ fontWeight: 400, color: '#e3e3e3' }}>Power up your Legends of
            Idleon
            adventure with Idleon Toolbox&#39;s essential tools and resources for optimizing gameplay, character builds,
            crafting, and more.</Typography>
          <Stack direction={'row'} mt={3} gap={3} flexWrap={'wrap'} justifyContent={breakpoint ? 'center' : 'inherit'}>
            {(state?.signedIn || state?.profile || state?.demo || state?.manualImport)
              ? <Button variant={'contained'} size={'medium'} startIcon={<IconLayoutDashboard/>}
                        component={NextLinkComposed} to={{ pathname: '/dashboard' }}>
                Open your dashboard
              </Button>
              : <Button variant={'contained'} size={'medium'} startIcon={<IconLogin2/>}
                        onClick={() => setLoginOpen(true)}>
                Login to get started
              </Button>}
            <DiscordButton startIcon={<DiscordSvg/>} href={'https://discord.gg/8Devcj7FzV'} target={'_blank'}
                           variant={'contained'}>
              Join the discord
            </DiscordButton>
            <Kofi/>
          </Stack>
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
                    fetchPriority="high"
                    src={`${prefix}etc/bg_${indexes.at(bgIndex)}.png`}
                    alt={`Idleon Toolbox gameplay feature screenshot ${bgIndex + 1}`}
                  /> : null
                })}
              </AnimatePresence>
            </MotionConfig>
          </Box>
        </Stack>
      </Stack>
      <motion.div style={{ marginTop: breakpoint ? 0 : 80, marginBottom: 15 }} transition={{ duration: .8 }}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}>
        <Typography variant={'h4'} mt={2}>IT Patch Notes</Typography>
        <Link to={{ pathname: '/patch-notes' }}
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
      <Box sx={{ mt: 6, mb: 2 }} component={'section'}>
        <Typography variant={'h4'} mb={2}>Frequently Asked Questions</Typography>
        {faqs.map(({ question, answer }, index) => {
          return <Accordion key={'faq' + index}
                            disableGutters
                            sx={{
                              '&:before': { display: 'none' },
                              border: `1px solid ${theme.palette.divider}`,
                              '&:not(:last-child)': { borderBottom: 0 }
                            }}>
            <AccordionSummary
              sx={{
                flexDirection: 'row-reverse', gap: 2, fontWeight: 500,
                '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': { transform: 'rotate(90deg)' }
              }}
              expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }}/>}
            >
              {question}
            </AccordionSummary>
            <AccordionDetails sx={{ backgroundColor: 'rgb(22, 22, 22)', p: 3 }}>
              <Typography variant={'body1'}>{answer}</Typography>
            </AccordionDetails>
          </Accordion>
        })}
      </Box>
      <span data-ccpa-link="1"></span>
      <LoginDialog open={loginOpen} setOpen={setLoginOpen} onClose={() => setLoginOpen(false)}/>
    </Container>
  );
};

const DiscordSvg = () => {
  return <svg viewBox="0 -2 127.14 96.36" width="20" height="20" aria-hidden="true">
    <path
      d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
      fill="white"></path>
  </svg>
}

const DiscordButton = styled(Button)`
  width: fit-content;
  background-color: #5865f2;
  color: #ffffff;

  &:hover {
    background-color: hsl(235 51.4% 52.4%);
  }
`

export default Home;
