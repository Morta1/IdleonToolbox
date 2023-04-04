import { AppContext } from "components/common/context/AppProvider";
import React, { useContext, useState } from "react";
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Typography } from "@mui/material";
import { cleanUnderscore, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import HtmlTooltip from "components/Tooltip";
import { NextSeo } from "next-seo";
import { filteredLootyItems } from "../../parsers/parseMaps";

const Slab = () => {
  const { state } = useContext(AppContext);
  const [display, setDisplay] = useState('all');

  const shouldDisplayItem = (item) => {
    if (display === 'all') return true;
    else if (display === 'looted' && item?.obtained) return true;
    else if (display === 'missing' && !item?.obtained && !filteredLootyItems?.[item?.rawName]) return true;
    else if (display === 'rotation' && item?.onRotation) return true;
  }

  return <Stack>
    <NextSeo
      title="Idleon Toolbox | Slab"
      description="The Slab consists of a list of items within the game"
    />
    <Typography textAlign={'center'} mt={2} mb={2} variant={'h2'}>Slab</Typography>
    <Typography textAlign={'center'} mt={2} variant={'h5'}>Looted
      Items: {state?.account?.looty?.lootedItems} / {state?.account?.looty?.totalItems}</Typography>
    <Typography textAlign={'center'} mt={2} mb={3} variant={'h5'}>Missing
      Items: {state?.account?.looty?.missingItems}</Typography>
    <Box sx={{ mb: 3 }}>
      <FormControl>
        <FormLabel id="demo-radio-buttons-group-label">Display</FormLabel>
        <RadioGroup
          row
          aria-labelledby="demo-radio-buttons-group-label"
          defaultValue="all"
          name="radio-buttons-group"
          onChange={(e) => setDisplay(e.target.value)}
        >
          <FormControlLabel value="all" control={<Radio/>} label="All items"/>
          <FormControlLabel value="looted" control={<Radio/>} label="Looted items"/>
          <FormControlLabel value="missing" control={<Radio/>} label="Missing items"/>
          <FormControlLabel value="rotation" control={<Radio/>} label="Gemshop rotation"/>
        </RadioGroup>
      </FormControl>
    </Box>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {state?.account?.looty?.slabItems?.map((item, index) => {
        const { name, rawName } = item;
        return shouldDisplayItem(item) ? <HtmlTooltip key={`${rawName}-${index}`} title={cleanUnderscore(name)}>
          <LootyImg width={50} height={50} src={`${prefix}data/${rawName}.png`} alt=""
                    onError={(e) => {
                      e.target.src = `${prefix}data/${rawName}_x1.png`;
                    }}
          />
        </HtmlTooltip> : null
      })}
    </Stack>
  </Stack>
};

const LootyImg = styled.img`
  height: 50px;
  width: 50px;
  object-fit: contain;
`

export default Slab;
