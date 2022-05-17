import { Stack, Typography } from "@mui/material";
import { cleanUnderscore, growth, prefix } from "utility/helpers";
import Tooltip from "../Tooltip";
import styled from "@emotion/styled";
import { StyledBadge } from "../common/styles";

const PostOffice = ({ boxes, totalPointsSpent, totalOrders }) => {
  return <Stack>
    <Typography variant={'h5'}>Post Office (<Typography variant={'h5'}
                                                        color={totalPointsSpent < totalOrders ? 'error.light' : ''}
                                                        component={'span'}>{totalPointsSpent}</Typography>/<Typography
      variant={'h5'} component={'span'}>{totalOrders}</Typography>)</Typography>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} sx={{ maxWidth: 310 }}>
      {boxes?.map((box, index) => {
        return box?.name !== 'Filler' ? <div key={box?.name + ' ' + index}>
          <Tooltip title={<PostOfficeTooltip {...box}/>}>
            <StyledBadge color={'primary'}
                         anchorOrigin={{
                           vertical: 'top',
                           horizontal: 'left',
                         }}
                         overlap={'circular'}
                         badgeContent={box?.level ?
                           <Typography fontSize={14} fontWeight={500} color={'black'}>{box?.level}</Typography> : null}
                         max={401}>
              <BoxIcon src={`${prefix}data/UIboxUpg${index}.png`} alt=""/>
            </StyledBadge>
          </Tooltip>
        </div> : null
      })}
    </Stack>
  </Stack>;
};


const BoxIcon = styled.img`
  width: 70px;
  height: 70px;
  object-fit: contain;
`

const PostOfficeTooltip = ({ name, upgrades, level }) => {
  return <>
    <Typography fontWeight={'bold'} variant={'h6'}>{cleanUnderscore(name)}</Typography>
    {upgrades?.map(({ bonus, func, x1, x2 }, index) => {
      const updatedLevel = index === 0 ? level : index === 1 ? level - 25 : level - 100;
      return <div key={bonus + ' ' + index}>
        {Math.max(0, growth(func, updatedLevel, x1, x2))}{cleanUnderscore(bonus)}
      </div>
    })}
  </>
};

export default PostOffice;
