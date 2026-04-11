import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';

const PostyNotes = ({ postyNotes }) => {
  if (!postyNotes?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No posty notes data available.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
      {postyNotes.map((note) => (
        <Card
          key={note.index}
          variant="outlined"
          sx={{ opacity: note.unlocked ? 1 : 0.5, height: '100%' }}
        >
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" gap={1} mb={1}>
              <img
                src={`${prefix}data/ResPosty${note.index}.png`}
                alt=""
                style={{ width: 36, height: 36, imageRendering: 'pixelated' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Typography variant="subtitle1" fontWeight={500}>
                Posty Note #{note.index + 1}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {cleanUnderscore(note.description)}
            </Typography>
            <Typography variant="body2" color={note.unlocked ? 'success.main' : 'text.secondary'} mt={1}>
              Research Lv. {note.unlockLevel}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default PostyNotes;
