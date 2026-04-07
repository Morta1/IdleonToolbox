import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { commaNotation, prefix } from '@utility/helpers';

const SushiBonuses = ({ knowledgeSummary }) => {
  if (!knowledgeSummary || knowledgeSummary.length === 0) {
    return <Typography variant="body2" color="text.secondary">No knowledge data available</Typography>;
  }

  return (
    <Stack direction={'row'} gap={1.5} flexWrap={'wrap'} alignItems={'stretch'}>
      {knowledgeSummary.map(({ label, category, sources }) => (
        <Card key={category} variant="outlined" sx={{ width: 280 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="body2" fontWeight={600}>{label}</Typography>
            {sources?.length > 0 && (
              <>
                <Divider sx={{ my: 1 }}/>
                <Stack gap={0.5}>
                  {sources.map(({ index, name, bonus, level, perfecto }) => (
                    <Stack key={index} direction="row" gap={1} alignItems="center">
                      <img
                        src={`${prefix}data/Sushi${index}.png`}
                        alt={name}
                        style={{ width: 24, height: 24, objectFit: 'contain' }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                        {name} (Lv.{level}{perfecto ? '*' : ''})
                      </Typography>
                      <Typography variant="caption">
                        +{commaNotation(bonus)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default SushiBonuses;
