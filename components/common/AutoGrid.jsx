import { Box } from '@mui/material';

const AutoGrid = ({ children }) => {
  return <Box sx={{
    display: 'grid',
    '--auto-grid-min-size': '18rem',
    gridTemplateColumns: 'repeat(auto-fill, minmax(var(--auto-grid-min-size), 1fr))',
    alignSelf: 'flex-start',
    gap: '1rem'
  }}>
    {children}
  </Box>;
};

export default AutoGrid;
