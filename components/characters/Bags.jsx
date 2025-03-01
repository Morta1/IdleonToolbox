import Tooltip from '../Tooltip';
import { notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import ItemDisplay from '../common/ItemDisplay';
import { Card, CardContent, Divider, Stack, Typography, useMediaQuery } from '@mui/material';

const Bags = ({ bags, capBags }) => {
  const isXs = useMediaQuery('(max-width: 370px)', { noSsr: true });

  return (
    <Card variant={'outlined'} sx={{height:'fit-content'}}>
      <CardContent>
        <Stack sx={{ width: 200 }} alignItems={'center'}>
          <Stack direction={'row'} flexWrap={'wrap'}>
            {bags?.map((bag, index) => {
              if (bag?.displayName === 'Inventory_Bag_I') return;
              return <Tooltip key={bag?.displayName + index} title={<ItemDisplay {...bag}/>}>
                <Bag exists={bag?.acquired}
                     src={`${prefix}data/${bag?.rawName}.png`} alt=""/>
              </Tooltip>;
            })}
          </Stack>
          <Divider sx={{ my: 2 }} flexItem/>
          <Stack direction={'row'} flexWrap={'wrap'} gap={isXs ? 1 : 0} justifyContent={'center'}>
            {capBags?.map((item, index) => {
              const { displayName, rawName, capacityPerSlot } = item;
              return <Tooltip title={<ItemDisplay {...item}/>} key={displayName + index}>
                <Stack alignItems={'center'}>
                  <Bag exists={true}
                       src={`${prefix}data/${rawName}.png`}
                       alt=""/>
                  <Typography variant={'caption'}>{notateNumber(capacityPerSlot)}</Typography>
                </Stack>
              </Tooltip>
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const Bag = styled.img`
  filter: ${({ exists }) => exists ? 'grayscale(0)' : 'grayscale(1)'};
  opacity: ${({ exists }) => exists ? '1' : '0.3'};
  justify-self: center;
  width: 48px;
  height: 48px;

  @media (max-width: 370px) {
    width: 36px;
    height: 36px;
  }
`;

export default Bags;
