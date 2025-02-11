import { Checkbox, FormControlLabel } from '@mui/material';
import React, { useState } from 'react';

const useCheckbox = (label) => {
  const [checked, setChecked] = useState(false);

  const Element = () =>  <FormControlLabel
    sx={{ width: 'fit-content' }}
    control={<Checkbox checked={checked} onChange={() => setChecked(prev => !prev)}/>}
    label={label}
  />;

  return [Element, checked];
};

export default useCheckbox;
