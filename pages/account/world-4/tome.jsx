import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber } from '@utility/helpers';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import useCheckbox from '@components/common/useCheckbox';

const ranks = ['0.1%', '0.5%', '1%', '5%', '10%', '25%', '50%', '60%', '70%', '80%', '90%', '95%']
const getFormattedQuantity = ({ x2, x4 }, quantity) => quantity > 1e9 && x2 === 1
  ? notateNumber(quantity, 'Big')
  : x4 === 1
    ? Math.round(100 * quantity) / 100
    : commaNotation(quantity);

const Tome = () => {
  const { state } = useContext(AppContext);
  const [CheckboxEl, showThresholds] = useCheckbox('Show quantity thresholds');

  return <>
    <NextSeo
      title="Tome | Idleon Toolbox"
      description="Keep track of your tome bonuses and highscores"
    />
    {/*<Typography variant={'caption'}>* Bubble bonus might be inaccurate because it is determined by your active*/}
    {/*  character.</Typography>*/}
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Total Points'} value={commaNotation(state?.account?.tome?.totalPoints)}/>
      <CardTitleAndValue title={'Rank'} value={!state?.account?.tome?.tops ? '' : <Tooltip title={<Stack gap={1}>
        {state?.account?.tome?.tops?.map((score, index) => <Stack direction={'row'} gap={1}
                                                                  key={'rank' + ranks?.[index]}
                                                                  divider={<>-</>}>
          <Typography sx={{ width: 40 }}>{ranks?.[index]}</Typography>
          <Typography>{commaNotation(score)}</Typography>
        </Stack>)}
      </Stack>}>
        <InfoIcon/>
      </Tooltip>} icon={`data/TomeTop${state?.account?.tome?.top}.png`}/>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        {state?.account?.tome?.bonuses?.map(({ name, bonus }, index) => {
          const formatted = notateNumber(bonus, 'Big');
          return <CardTitleAndValue key={name} title={cleanUnderscore(name)} value={`${formatted}%`}
                                    icon={`etc/Tome_${index}.png`}>
          </CardTitleAndValue>
        })}
      </Stack>
    </Stack>
    <CheckboxEl/>

    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {state?.account?.tome?.tome?.map((bonus, rIndex) => {
        const {
          name,
          color,
          tomeLvReq,
          quantity,
          index,
          points,
          requiredQuantities
        } = bonus;
        const formattedQuantity = getFormattedQuantity(bonus, quantity);
        return <Card key={'tome-bonus' + index} sx={{ width: 300 }}>
          <CardContent sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            opacity: state?.account?.accountLevel < tomeLvReq ? .5 : 1
          }}>
            <Stack mb={1} direction={'row'} alignItems={'center'} gap={1} justifyContent={'space-between'}>
              <Typography variant={'body1'}>{cleanUnderscore(name.replace('(Tap_for_more_info)', ''))}</Typography>
              {rIndex === 19
                ? <Tooltip
                  title={'Affected by your currently active character'}><IconInfoCircleFilled size={16}/></Tooltip>
                : null}
            </Stack>
            <Stack mt={'auto'} justifyContent="space-between" direction={'row'}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <Typography>{formattedQuantity}</Typography>
                {showThresholds ? <Tooltip title={<Stack>
                  {Object.entries(requiredQuantities).map(([key, value]) => (
                    <TitleAndValue stackStyle={{ justifyContent: 'space-between' }} key={name + key}
                                   title={key.capitalize()} value={getFormattedQuantity(bonus, value)}/>
                  ))}
                </Stack>}>
                  <IconInfoCircleFilled size={16}/>
                </Tooltip> : null}
              </Stack>
              {/*<Stack direction={'row'} alignItems={'center'} gap={1}>*/}
              {/*  <Tooltip title={<Stack>*/}
              {/*    {Object.entries(requiredQuantities).map(([key, value]) => (*/}
              {/*      <TitleAndValue stackStyle={{ justifyContent: 'space-between' }} key={name + key}*/}
              {/*                     title={key.capitalize()} value={getFormattedQuantity(bonus, value)}/>*/}
              {/*    ))}*/}
              {/*  </Stack>}>*/}
              {/*    <IconInfoCircleFilled size={16}/>*/}
              {/*  </Tooltip>*/}
              <Typography color={color}>{commaNotation(points)} PTS</Typography>
              {/*</Stack>*/}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Tome;
