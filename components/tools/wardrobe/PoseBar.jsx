import React from 'react';
import { IconButton, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import { POSES } from '@utility/paperDoll';

const PoseBar = ({ pose, playing, poses = POSES, onPose, onTogglePlay, onDownload }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
    <ToggleButtonGroup size={'small'} exclusive value={pose} onChange={(_, next) => next && onPose(next)}>
      {poses.map(({ id, label }) => <ToggleButton key={id} value={id}>{label}</ToggleButton>)}
    </ToggleButtonGroup>
    <IconButton aria-label={playing ? 'pause' : 'play'} onClick={onTogglePlay}>
      {playing ? <PauseIcon/> : <PlayArrowIcon/>}
    </IconButton>
    <IconButton aria-label={'download png'} onClick={onDownload}><DownloadIcon/></IconButton>
  </Stack>;
};

export default PoseBar;
