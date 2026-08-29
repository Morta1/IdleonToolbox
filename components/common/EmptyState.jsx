import { Stack, Typography } from '@mui/material';

const EmptyState = ({ hideCompleted, label }) => {
  return <Stack sx={{ width: '100%' }} alignItems={'center'} mt={2} gap={1}>
    <Typography variant={'h5'}>{hideCompleted ? `All ${label} completed` : `No ${label} yet`}</Typography>
    {hideCompleted ? <Typography color={'text.secondary'}>
      Uncheck "Hide completed" to see them again
    </Typography> : null}
  </Stack>
}

export default EmptyState;
