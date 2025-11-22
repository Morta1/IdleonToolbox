import React, { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack, Card, CardContent, Typography, Divider, Box } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix, commaNotation } from '@utility/helpers';
import { MissingData, CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import { getAllItems } from '@parsers/items';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const ZenithMarket = () => {
  const { state } = useContext(AppContext);
  const { market, clusters } = state?.account?.zenith || {};
  const { characters, account } = state || {};

  // Get clusters from character inventories
  const clusterInventoryData = useMemo(() => {
    if (!characters || !account) return [];
    const allItems = getAllItems(characters, account);
    const clusterItems = allItems.filter(item => item?.rawName === 'Quest110');
    return clusterItems.map(item => ({
      owner: item?.owner,
      amount: item?.amount || 0
    })).filter(item => item.amount > 0);
  }, [characters, account]);

  const totalInventoryClusters = useMemo(() => {
    return clusterInventoryData.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [clusterInventoryData]);

  if (!state?.account?.zenith) return <MissingData name={'zenith'} />;

  return <>
    <NextSeo
      title="Zenith Market | Idleon Toolbox"
      description="Keep track of your zenith market upgrades and bonuses"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue
        title={'Zenith Clusters'}
      >
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <img style={{ objectFit: 'contain', width: 24, height: 24 }} src={`${prefix}etc/Cluster.png`} alt=""/>
          <Typography component={'div'}>{clusters !== undefined ? commaNotation(clusters) : '0'}</Typography>
          {clusterInventoryData.length > 0 && (
            <Tooltip
              title={
                <Stack gap={1}>
                  <Typography variant="subtitle2" fontWeight="bold">Zenith Clusters in Inventories</Typography>
                  <Divider />
                  {clusterInventoryData.map((item, index) => (
                    <TitleAndValue
                      key={`${item.owner}-${index}`}
                      title={item.owner}
                      value={commaNotation(item.amount)}
                    />
                  ))}
                  <Divider />
                  <TitleAndValue
                    title="Total in Inventories"
                    value={commaNotation(totalInventoryClusters)}
                  />
                </Stack>
              }
            >
              <IconInfoCircleFilled size={16} style={{ cursor: 'help', opacity: 0.7 }} />
            </Tooltip>
          )}
        </Stack>
      </CardTitleAndValue>
    </Stack>

    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
      {market?.map((item, index) => {
        const canAfford = clusters >= item.cost;
        const isMaxed = item?.x3 && (item.level || 0) >= item.x3;

        return (
          <Card
            key={item.name || index}
            variant={'outlined'}
            sx={{
              opacity: item.level > 0 ? 1 : 0.6,
            }}
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
                  {!isMaxed && (
                    <>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Cost
                        </Typography>
                        <Typography variant="body2" fontWeight={500} color={canAfford ? 'success.main' : 'text.primary'}>
                          {item.cost !== undefined ? notateNumber(item.cost, 'Big') : 'N/A'}
                        </Typography>
                      </Box>
                      {item.costToMax !== undefined && item.costToMax > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Cost to Max
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {notateNumber(item.costToMax, 'Big')}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  </>;
};

export default ZenithMarket;

