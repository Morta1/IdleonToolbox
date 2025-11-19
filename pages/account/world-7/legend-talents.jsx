import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack, Card, CardContent, Typography, Box, TextField } from '@mui/material';
import { NextSeo } from 'next-seo';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { MissingData } from '@components/common/styles';

const LegendTalents = () => {
  const { state } = useContext(AppContext);
  const { talents } = state?.account?.legendTalents || {};
  const [searchQuery, setSearchQuery] = useState('');

  if (!state?.account?.legendTalents) return <MissingData name={'legendTalents'} />;

  const filteredTalents = useMemo(() => {
    if (!talents) return [];
    if (!searchQuery.trim()) return talents;

    const query = searchQuery.toLowerCase();
    return talents.filter((talent) => {
      const name = cleanUnderscore(talent.name || '').toLowerCase();
      const description = cleanUnderscore(talent.description || '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [talents, searchQuery]);

  return <>
    <NextSeo
      title="Legend Talents | Idleon Toolbox"
      description="Keep track of your legend talents and their bonuses"
    />

    <Stack sx={{ mb: 3 }}>
      <TextField
        sx={{ width: 250 }}
        size="small"
        placeholder="Search by name or description"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        variant="outlined"
      />
    </Stack>

    {filteredTalents?.length === 0 && searchQuery.trim() ? (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No legend talents found matching "{searchQuery}"
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
                    Level: {talent.level || 0}
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

