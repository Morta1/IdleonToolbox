import { AppContext } from "components/common/context/AppProvider";
import React, { useContext, useState } from "react";
import { Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { cleanUnderscore, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import HtmlTooltip from "components/Tooltip";

const Looty = () => {
  const { state } = useContext(AppContext);
  const [show, setShow] = useState();
  return <Stack>
    <Typography textAlign={'center'} mt={2} mb={2} variant={'h2'}>Looty Shooty</Typography>
    <Typography textAlign={'center'} mt={2} variant={'h5'}>Looted
      Items: {state?.account?.looty?.lootedItems}</Typography>
    <Typography textAlign={'center'} mt={2} mb={3} variant={'h5'}>Missing
      Items: {state?.account?.looty?.missingItems.filter(({ obtainable }) => obtainable)?.length}</Typography>
    <FormControlLabel
      sx={{ my: 3 }}
      control={<Checkbox checked={show} onChange={() => setShow(!show)}/>}
      name={'show'}
      label="Show unobtainables"/>
    <Stack direction={'row'} gap={1} justifyContent={'center'} flexWrap={'wrap'}>
      {state?.account?.looty.missingItems?.map(({ name, rawName, obtainable }, index) => {
        return obtainable || show ? <HtmlTooltip key={`${rawName}-${index}`} title={cleanUnderscore(name)}>
          <LootyImg width={50} height={50} src={`${prefix}data/${rawName}.png`} alt=""/>
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

export default Looty;
