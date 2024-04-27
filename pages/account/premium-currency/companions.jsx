import { NextSeo } from 'next-seo';
import { Accordion, AccordionDetails, AccordionSummary, Card, CardContent, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { cleanUnderscore, prefix } from '../../../utility/helpers';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Companions = () => {
  const { state } = useContext(AppContext);

  return <>
    <NextSeo
      title="Companions | Idleon Toolbox"
      description="Detailed information about companions and their bonuses"
    />
    <Accordion defaultExpanded={false} sx={{ mb: 3, width: 'fit-content' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon/>}>Details</AccordionSummary>
      <AccordionDetails>
        <Stack direction={'row'} gap={3}>
          <Card sx={{ my: 3 }} variant={'outlined'}>
            <CardContent>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>Pet Crystals</Typography>
              <Typography>{state?.account?.companions?.petCrystals ?? 0}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ my: 3 }} variant={'outlined'}>
            <CardContent>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>Total Box Opened</Typography>
              <Typography>{state?.account?.companions?.totalBoxesOpened ?? 0}</Typography>
            </CardContent>
          </Card>
        </Stack>
      </AccordionDetails>
    </Accordion>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {state?.account?.companions?.list?.map(({ name, effect, acquired = '' }) => {
        return <Card key={name}
                     sx={{
                       width: 250,
                       border: acquired ? '1px solid' : '',
                       borderColor: acquired ? 'success.dark' : ''
                     }}>
          <CardContent sx={{ '&:last-child': { padding: 2 }, height: '100%' }}>
            <Stack gap={4} justifyContent={'center'}>
              <img width={50} height={50}
                   style={{ objectFit: 'contain' }}
                   src={`${prefix}afk_targets/${name}.png`} alt={''}/>
              <Typography>{cleanUnderscore(effect?.replace('{', '+'))}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Companions;
