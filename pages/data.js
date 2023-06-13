import { Container, Stack, TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import InfoIcon from "@mui/icons-material/Info";
import styled from "@emotion/styled";
import { useRouter } from "next/router";
import MenuItem from "@mui/material/MenuItem";

const Data = () => {
  const router = useRouter();
  const [key, setKey] = useState('all');
  const handleCopyITRaw = async () => {
    try {
      await navigator.clipboard.writeText(localStorage.getItem("rawJson"));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyRaw = async () => {
    try {
      const data = JSON.parse(localStorage.getItem("rawJson"));
      await navigator.clipboard.writeText(JSON.stringify(data?.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStorageClear = () => {
    if (key === 'all') {
      localStorage.clear();
    } else {
      localStorage.removeItem(key)
    }
    router.reload();
  }

  return <Container>
    <Stack alignItems="center" flexWrap={"wrap"} justifyContent="center"
           gap={1}>
      <Typography variant={'body1'} component={'span'}>Use this when asked for data</Typography>
      <ButtonStyle sx={{ textTransform: 'none' }} variant={"outlined"} startIcon={<FileCopyIcon/>}
                   onClick={handleCopyITRaw}>
        IdleonToolbox JSON
      </ButtonStyle>
      <ButtonStyle sx={{ textTransform: 'none', fontSize: 12, mt: 3 }} variant={"outlined"} startIcon={<FileCopyIcon/>}
                   size='small'
                   onClick={handleCopyRaw}>
        Raw Game JSON
      </ButtonStyle>
    </Stack>
    <Typography variant={'h4'} mt={8} textAlign={'center'}>Local Storage</Typography>
    <Typography component={'div'} variant={'caption'} mb={2} textAlign={'center'} color={'warning.light'}>Use this if
      you're having any issues
      loading the website</Typography>
    <Stack direction={'row'} gap={2} flexWrap={"wrap"} justifyContent="center">
      <TextField sx={{ width: 250 }} label={'Local storage key'} select value={key}
                 onChange={(e) => setKey(e.target.value)}>
        <MenuItem value={'all'}>All</MenuItem>
        <MenuItem value={'trackers'}>Dashboard config</MenuItem>
        <MenuItem value={'planner'}>Item Planner</MenuItem>
      </TextField>
      <ButtonStyle color={'warning'} variant={"outlined"} onClick={handleStorageClear} startIcon={<InfoIcon/>}>
        Clear
      </ButtonStyle>
    </Stack>
  </Container>
};

const ButtonStyle = styled(Button)`
  text-transform: none;
`

export default Data;
