import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { prefix } from '@utility/helpers';
import { DISCORD_BOT_INSTALL_URL } from '@components/discordLinks';

const COMMANDS = ['/wiki', '/build', '/profile', '/guild'];

export const DiscordSvg = ({ size = 20 }) => (
  <svg viewBox="0 -2 127.14 96.36" width={size} height={size} aria-hidden="true">
    <path
      d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
      fill="white"/>
  </svg>
);

const FakeButton = ({ children }) => (
  <Box component={'span'} sx={{
    backgroundColor: '#4e5058', color: '#f2f3f5', fontSize: 13, fontWeight: 500,
    px: 1.5, py: 0.5, borderRadius: 1
  }}>{children}</Box>
);

// A Discord message as the bot posts it, with a card rendered from made-up data (no real guild).
// Decorative: the buttons are spans, so nothing in it is focusable.
const MessagePreview = () => (
  <Stack direction={'row'} gap={{ xs: 1, sm: 2 }}
         sx={{ backgroundColor: '#313338', borderRadius: 2, p: { xs: 1, sm: 2 }, width: '100%', maxWidth: 580 }}>
    <Box sx={{
      width: 40, height: 40, flexShrink: 0, borderRadius: '50%', backgroundColor: '#242429',
      display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center'
    }}>
      <img src={`${prefix}data/Coins5.png`} width={21} height={21} alt={''}/>
    </Box>
    <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
      <Typography variant={'caption'} sx={{ color: '#b5bac1', display: 'block' }}>
        used <Box component={'span'} sx={{ color: '#c9cdfb' }}>/guild Idle Legends</Box>
      </Typography>
      <Stack direction={'row'} alignItems={'center'} gap={1} mb={1}>
        <Typography sx={{ fontWeight: 600, color: '#f2f3f5' }}>Idleon Toolbox</Typography>
        <Box component={'span'} sx={{
          backgroundColor: '#5865F2', color: '#fff', fontSize: 10, fontWeight: 700,
          px: 0.5, borderRadius: 0.5, lineHeight: '16px'
        }}>APP</Box>
      </Stack>
      <Box sx={{ borderLeft: '4px solid #5DCAA5', backgroundColor: '#2b2d31', borderRadius: 1, p: { xs: 0.5, sm: 1 } }}>
        <img src={`${prefix}etc/discord-bot-guild-card.webp`} width={1120} height={462} loading={'lazy'}
             style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }}
             alt={'Example /guild card: guild rank, level, total GP, GP this week, active members and top contributors'}/>
        <Stack direction={'row'} gap={1} mt={1} flexWrap={'wrap'}>
          <FakeButton>Full history</FakeButton>
          <FakeButton>All contributors</FakeButton>
        </Stack>
        <Typography sx={{ color: '#949ba4', fontSize: 12, mt: 1 }}>idleontoolbox.com</Typography>
      </Box>
    </Box>
  </Stack>
);

const DiscordBotSection = () => (
  <Box component={'section'} sx={{
    mt: 6,
    // Tight padding on phones keeps the frame without shrinking the card preview much.
    p: { xs: 1.5, sm: 4 }, pt: { xs: 3, sm: 4 }, borderRadius: 3,
    border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper'
  }}>
    <Stack direction={{ xs: 'column', md: 'row' }} gap={4} alignItems={'center'}>
      <Stack gap={2} sx={{ flex: 1, alignItems: { xs: 'center', md: 'flex-start' }, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography variant={'h4'}>Idleon Toolbox in Discord</Typography>
        <Typography sx={{ color: '#e3e3e3' }}>
          Look up items, monsters and talents, find the top class builds, and check player and guild rankings
          without leaving Discord.
        </Typography>
        <Stack direction={'row'} gap={{ xs: 0.5, sm: 1 }} flexWrap={'wrap'} justifyContent={{ xs: 'center', md: 'flex-start' }}>
          {COMMANDS.map((command) => <Chip key={command} label={command} size={'small'} variant={'outlined'}
                                           sx={{ fontFamily: 'monospace' }}/>)}
        </Stack>
        <Button variant={'contained'} startIcon={<DiscordSvg/>} href={DISCORD_BOT_INSTALL_URL}
                target={'_blank'} rel={'noopener noreferrer'}
                sx={{ backgroundColor: '#5865F2', color: '#fff', '&:hover': { backgroundColor: '#4752c4' } }}>
          Add bot to Discord
        </Button>
      </Stack>
      <Stack sx={{ flex: 1, alignItems: 'center', width: '100%' }}>
        <MessagePreview/>
      </Stack>
    </Stack>
  </Box>
);

export default DiscordBotSection;
