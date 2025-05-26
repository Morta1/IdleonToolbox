import { AppContext } from 'components/common/context/AppProvider';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, groupByKey, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import HtmlTooltip from 'components/Tooltip';
import { NextSeo } from 'next-seo';
import Image from 'next/image';
import ItemDisplay from '@components/common/ItemDisplay';


const Looty = () => {
  const { state } = useContext(AppContext);
  const [sortByStackSize, setSortByStackSize] = useState(false);
  const [items, setItems] = useState();
  const [orderByGroup, setOrderByGroup] = useState(false);
  const sortedItems = useMemo(() => [...state?.account?.storage]?.sort((a, b) => b?.amount - a?.amount), [state]);
  useEffect(() => {
    let result
    if (orderByGroup) {
      const groupedBy = groupByKey(state?.account?.storage, ({ Type }) => Type);
      if (sortByStackSize) {
        result = Object.entries(groupedBy).reduce((res, [key, val]) => {
          const sorted = [...val].sort((a, b) => b?.amount - a?.amount);
          return { ...res, [key]: sorted }
        }, {})
        setItems(result);
      } else {
        setItems(groupedBy)
      }
    } else {
      setItems(sortByStackSize ? sortedItems : state?.account?.storage);
    }
  }, [state, orderByGroup, sortByStackSize])

  const handleChange = (event) => {
    setSortByStackSize(event.target.checked);
  };

  const renderItems = (items) => {
    if (!items || !Array.isArray(items)) return null;
    return items?.map((item, index) => {
      const { name, rawName, amount } = item;
      return (
        <Card variant={'outlined'} sx={{ width: 75 }} key={`${name}-${index}`}>
          <CardContent>
            <HtmlTooltip title={<ItemDisplay {...item} showAmount/>}>
              <Stack alignItems="center" key={`${rawName}-${index}`} data-index={index}>
                <Image loading="lazy" data-index={index} width={30} height={30} style={{ objectFit: 'contain' }}
                       src={`${prefix}data/${rawName}.png`} alt={rawName}/>
                <Typography
                  color={amount >= 1e7
                    ? 'success.light'
                    : ''}>{notateNumber(amount, 'Big')}</Typography>
              </Stack>
            </HtmlTooltip>
          </CardContent>
        </Card>
      );
    })
  }

  return (
    <Stack>
      <NextSeo
        title="Storage | Idleon Toolbox"
        description="A list of your storage items"
      />
      <Stack>
        <Stack mb={3} direction={'row'} flexWrap={'wrap'}>
          <FormControlLabel
            control={<Checkbox name={'mini'} checked={orderByGroup}
                               size={'small'}
                               onChange={() => setOrderByGroup(!orderByGroup)}/>}
            label={'Group by type'}/>
          <FormControlLabel control={<Checkbox checked={sortByStackSize} onChange={handleChange}/>}
                            label="Sort by stack size"/>
        </Stack>
        {orderByGroup && !Array.isArray(items) ? <Stack gap={2}>
            {Object.entries(items || {}).map(([group, groupedItems], index) => {
              if (groupedItems.length === 0) return null;
              return (
                <Card key={`${group}-${index}`}>
                  <CardContent>
                    <Typography>{(cleanUnderscore(group)).toLowerCase().capitalize()}</Typography>
                    <Stack key={`${group}-${index}`} data-index={index}>
                      <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
                        {renderItems(groupedItems)}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
          : <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
            {renderItems(items)}
          </Stack>}
      </Stack>
    </Stack>
  );
};

const ItemImg = styled.img`
  height: 30px;
  width: 30px;
  object-fit: contain;
`;

export default Looty;
