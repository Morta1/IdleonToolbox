import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack, Card, CardContent, Typography, Box, TextField, Checkbox, FormControlLabel } from '@mui/material';
import { NextSeo } from 'next-seo';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { MissingData, CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import { useLocalStorage } from '@mantine/hooks';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const LegendTalents = () => {
  const { state } = useContext(AppContext);
  const { talents, pointsSpent, pointsOwned } = state?.account?.legendTalents || {};
const [searchQuery, setSearchQuery] = useState('');
  const [hideMaxed, setHideMaxed] = useLocalStorage({
    key: `${prefix}:legendTalents:hideMaxed`,
    defaultValue: false
  });

  if (!state?.account?.legendTalents) return <MissingData name={'legendTalents'} />;

  const isCompleted = (talent) => talent.level >= talent.maxLevel;

  const filteredTalents = useMemo(() => {
    if (!talents) return [];

    let filtered = talents;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((talent) => {
        const name = cleanUnderscore(talent.name || '').toLowerCase();
        const description = cleanUnderscore(talent.description || '').toLowerCase();
        return name.includes(query) || description.includes(query);
      });
    }

    // Filter out maxed talents if option is enabled
    if (hideMaxed) {
      filtered = filtered.filter((talent) => !isCompleted(talent));
    }

    return filtered;
  }, [talents, searchQuery, hideMaxed]);

  return <>
    <NextSeo
      title="Legend Talents | Idleon Toolbox"
      description="Keep track of your legend talents and their bonuses"
    />

    <Stack sx={{ mb: 3 }} direction="row" alignItems="center" gap={2}>
      <CardTitleAndValue title={'Legend Points'}>
        <Stack direction="row" alignItems={'center'} gap={1}>
          <Typography>
            {pointsSpent || 0} / {pointsOwned?.value || 0}
          </Typography>
          {pointsOwned?.breakdown && pointsOwned.breakdown.length > 0 && (
            <Tooltip title={<Stack>
              {pointsOwned.breakdown.map(({ name, value }, index) => (
                <TitleAndValue
                  key={`${name}-${index}`}
                  title={name}
                  titleStyle={{ width: 150 }}
                  value={value}
                />
              ))}
            </Stack>}>
              <IconInfoCircleFilled size={18} />
            </Tooltip>
          )}
        </Stack>
      </CardTitleAndValue>
      <Stack direction="row" alignItems="center" gap={2}>
        <TextField
          sx={{ width: 250 }}
          size="small"
          placeholder="Search by name or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={hideMaxed}
              onChange={(e) => setHideMaxed(e.target.checked)}
              size="small"
            />
          }
          label="Hide maxed"
        />
      </Stack>
    </Stack>



    {filteredTalents?.length === 0 ? (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {searchQuery.trim()
            ? `No legend talents found matching "${searchQuery}"${hideMaxed ? ' (all remaining talents are maxed)' : ''}`
            : hideMaxed
              ? 'All legend talents are maxed'
              : 'No legend talents available'}
        </Typography>
      </Box>
    ) : (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {filteredTalents?.map((talent) => (
          <Card key={talent.originalIndex} variant={'outlined'} sx={{ opacity: talent.level > 0 ? 1 : 0.6 }}>
            <CardContent>
              <Stack direction={'row'} gap={1.5} alignItems={'center'} mb={1}>
                <img
                  src={`${prefix}data/LegendTalentIcon${talent.index}.png`}
                  alt={cleanUnderscore(talent.name)}
                  style={{ width: 40, height: 40 }}
                />
                <Stack flex={1}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {cleanUnderscore(talent.name)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Level: {talent.level || 0} / {talent.maxLevel}
                  </Typography>
                </Stack>
              </Stack>
              {talent.description && (
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                  {cleanUnderscore(talent.description)}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    )}
  </>;
};

export default LegendTalents;

