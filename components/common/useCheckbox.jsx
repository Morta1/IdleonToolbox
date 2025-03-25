import { Checkbox, FormControlLabel } from '@mui/material';
import React, { useState } from 'react';

const useCheckbox = (label, initial = false) => {
  const [checked, setChecked] = useState(initial);

  const Element = () =>  <FormControlLabel
    sx={{ width: 'fit-content' }}
    control={<Checkbox checked={checked} onChange={() => setChecked(prev => !prev)}/>}
    label={label}
  />;

  return [Element, checked];
};

export default useCheckbox;
