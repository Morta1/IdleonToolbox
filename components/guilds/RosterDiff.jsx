import { Box, Chip, Stack, Typography } from '@mui/material';

function Side({ names, label, color }) {
  return (
    <Box flex={1} minWidth={0}>
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ color, textTransform: 'uppercase', letterSpacing: 0.6 }}
      >
        {label} ({names?.length ?? 0})
      </Typography>
      <Box sx={{ mt: 1 }}>
        {names && names.length > 0 ? (
          names.map((name) => (
            <Chip
              key={name}
              label={name}
              size="small"
              variant="outlined"
              sx={{ m: 0.25, borderColor: color, color }}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">None</Typography>
        )}
      </Box>
    </Box>
  );
}

export default function RosterDiff({ joined, left }) {
  const noChanges = (!joined || joined.length === 0) && (!left || left.length === 0);
  if (noChanges) {
    return <Typography variant="body2" color="text.secondary">No roster changes this week</Typography>;
  }
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} gap={3}>
      <Side names={joined} label="Joined" color="#81c784" />
      <Side names={left} label="Left" color="#cf6679" />
    </Stack>
  );
}
