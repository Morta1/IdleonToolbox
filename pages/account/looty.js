import { AppContext } from "../../components/common/context/AppProvider";
import { useContext } from "react";
import { Stack, Typography } from "@mui/material";
import { cleanUnderscore, prefix } from "../../utility/helpers";
import styled from "@emotion/styled";
import HtmlTooltip from "../../components/Tooltip";

const Looty = () => {
  const { state } = useContext(AppContext);
  return <Stack>
    <Typography textAlign={'center'} mt={2} mb={2} variant={'h2'}>Looty Shooty</Typography>
    <Typography textAlign={'center'} mt={2} variant={'h5'}>Looted
      Items: {state?.account?.looty?.lootedItems}</Typography>
       <Typography textAlign={'center'} mt={2} mb={3} variant={'h5'}>Missing
      Items: {state?.account?.looty?.missingItems?.length}</Typography>
    <Stack direction={'row'} gap={1} justifyContent={'center'} flexWrap={'wrap'}>
      {state?.account?.looty.missingItems?.map(({ name, rawName }, index) => {
        return <HtmlTooltip key={`${rawName}-${index}`} title={cleanUnderscore(name)}>
          <LootyImg width={50} height={50} src={`${prefix}data/${rawName}.png`} alt=""/>
        </HtmlTooltip>
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
