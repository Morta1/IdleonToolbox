import React from 'react';
import Timer from "../../../common/Timer";
import { Divider, Stack, Typography } from "@mui/material";
import { prefix } from "../../../../utility/helpers";

const Library = ({ libraryTimes, lastUpdated }) => {
  let { bookCount, next, breakpoints } = libraryTimes || {};
  return <>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <img src={`${prefix}data/Libz.png`} alt=""/>
      <h3>Library</h3>
    </Stack>
    <h4>Book count: {bookCount}</h4>
    <Stack direction={'row'} gap={1} alignItems={'center'}>
      <Typography sx={{ width: 100 }}>Next book in: </Typography> {next > 0 ?
      <Timer type={'countdown'} lastUpdated={lastUpdated}
             date={new Date().getTime() + next * 1000}/> :
      <Typography variant={'caption'}>Wait for game update</Typography>}
    </Stack>
    {breakpoints?.map(({ breakpoint, time }, index) => {
      return time > 0 ? <React.Fragment key={'book-timer' + index}>
        <Divider sx={{ my: 1 }}/>
        <Stack direction={'row'} gap={1}>
          <Typography sx={{ width: 100 }}>{breakpoint} books in: </Typography> {time > 0 ? <Timer type={'countdown'}
                                                                                                  lastUpdated={lastUpdated}
                                                                                                  date={new Date().getTime() + time * 1000}/> :
          <Typography variant={'caption'}>Wait for game update</Typography>}
        </Stack>
      </React.Fragment> : null
    })}
  </>
};

export default Library;
