import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "../../../../../utility/helpers";
import styled from "@emotion/styled";

const Artifacts = ({ artifacts }) => {
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
    {artifacts?.map(({ name, description, ancientFormDescription, rawName, acquired, additionalData }, index) => {
      return <Card key={name} variant={acquired ? 'elevation' : 'outlined'}>
        <CardContent>
          <Stack sx={{ width: 200 }}>
            <Stack direction={'row'} gap={1}>
              <ArtifactImg src={`${prefix}data/${rawName}.png`} alt=""/>
              <Typography>{cleanUnderscore(name)}</Typography>
            </Stack>
            <Divider sx={{ my: 2 }}/>
            <Stack flexWrap={'wrap'}>
              <Typography sx={{ minHeight: 150 }}>{cleanUnderscore(description)}</Typography>
              <Typography>{additionalData}&nbsp;</Typography>
              <Divider flexItem color={'gold'} sx={{ my: 2 }}/>
              <Typography
                sx={{ opacity: acquired === 2 ? 1 : .5, color: acquired === 2 ? 'gold' : 'white' }}>{cleanUnderscore(ancientFormDescription)}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    })}
  </Stack>
};

const ArtifactImg = styled.img`
  object-fit: contain;
`

export default Artifacts;
