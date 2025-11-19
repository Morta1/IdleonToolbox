import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack, Card, CardContent, Typography, Box } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix, commaNotation } from '@utility/helpers';
import { MissingData, CardTitleAndValue } from '@components/common/styles';

const ZenithMarket = () => {
  const { state } = useContext(AppContext);
  const { market, clusters } = state?.account?.zenith || {};

  if (!state?.account?.zenith) return <MissingData name={'zenith'} />;

  return <>
    <NextSeo
      title="Zenith Market | Idleon Toolbox"
      description="Keep track of your zenith market upgrades and bonuses"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue
        title={'Zenith Clusters'}
        value={clusters !== undefined ? commaNotation(clusters) : '0'}
        icon={'etc/Cluster.png'}
        imgStyle={{ width: 24, height: 24 }}
      />
    </Stack>

    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
      {market?.map((item, index) => (
        <Card
          key={item.name || index}
          variant={'outlined'}
          sx={{ opacity: item.level > 0 ? 1 : 0.6 }}
        >
          <CardContent>
            <Stack gap={1.5}>
              <Stack direction={'row'} gap={1.5} alignItems={'center'}>
                <Stack flex={1}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {cleanUnderscore(item.name)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Level: {item.level || 0}{item?.x3 ? ` / ${item.x3}` : ''}
                  </Typography>
                </Stack>
              </Stack>

              {item.description && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {cleanUnderscore(item.description)}
                </Typography>
              )}

              <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
                {(!item?.x3 || (item.level || 0) < item.x3) && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Cost
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {item.cost !== undefined ? notateNumber(item.cost, 'Big') : 'N/A'}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  </>;
};

export default ZenithMarket;

