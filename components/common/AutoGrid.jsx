import { Box } from '@mui/material';

const AutoGrid = ({ children, withBorder }) => {
  return <Box sx={{
    display: 'grid',
    '--auto-grid-min-size': '18rem',
    gridTemplateColumns: 'repeat(auto-fill, minmax(var(--auto-grid-min-size), 1fr))',
    alignSelf: 'flex-start',
    gap: '1rem',
    ...(withBorder && {
      '& > *': {
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        padding: '1rem'
      }
    })
  }}>
    {children}
  </Box>;
};

export default AutoGrid;
