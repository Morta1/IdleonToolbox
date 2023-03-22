import React from 'react';
import Library from "../account/Worlds/World3/Library";
import { Card, CardContent } from "@mui/material";

const Etc = ({ account, lastUpdated }) => {

  return <>
    <Card>
      <CardContent>
        <Card variant={'outlined'} sx={{ width: 'fit-content' }}>
          <CardContent>
            <Library libraryTimes={account?.libraryTimes} lastUpdated={lastUpdated}/>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  </>
};
export default Etc;
