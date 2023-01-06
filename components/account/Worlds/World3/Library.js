import React from 'react';
import Timer from "../../../common/Timer";
import { Divider, Stack, Typography } from "@mui/material";
import { prefix } from "../../../../utility/helpers";

const Library = ({ libraryTimes, lastUpdated }) => {
  const { bookCount, next, breakpoints } = libraryTimes || {};
  return <>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <img src={`${prefix}data/Libz.png`} alt=""/>
      <h3>Library</h3>
    </Stack>
    <h4>Book count: {bookCount}</h4>
    <Stack direction={'row'} gap={1}>
      <Typography sx={{ width: 100 }}>Next book in: </Typography> <Timer type={'countdown'} lastUpdated={lastUpdated}
                                                                         date={new Date().getTime() + next * 1000}/>
    </Stack>
    {breakpoints?.map(({ breakpoint, time }, index) => {
      return time > 0 ? <React.Fragment key={'book-timer' + index}>
        <Divider sx={{ my: 1 }}/>
        <Stack direction={'row'} gap={1}>
          <Typography sx={{ width: 100 }}>{breakpoint} books in: </Typography> <Timer type={'countdown'} lastUpdated={lastUpdated}
                                                                  date={new Date().getTime() + time * 1000}/>
        </Stack>
      </React.Fragment> : null
    })}
  </>
};

export default Library;
