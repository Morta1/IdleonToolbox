import { Box } from '@mui/material';

// A name's last word and what follows it (an i, a glyph) on one line, so a wrapped name never leaves it alone.
const WithLastWord = ({ text, children }) => {
  const at = `${text ?? ''}`.lastIndexOf(' ') + 1;
  return <>{`${text ?? ''}`.slice(0, at)}<Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>{`${text ?? ''}`.slice(at)}{children}</Box></>;
};

export default WithLastWord;
