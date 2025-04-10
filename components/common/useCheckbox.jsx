import { Checkbox, FormControlLabel } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';

const useCheckbox = (label, initial = false) => {
  const [isLoading, setIsLoading] = useState(true);
  const [checked, setChecked] = useLocalStorage({ key: `checkbox-${label}`, defaultValue: initial });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const Element = () => isLoading ? null : <FormControlLabel
    sx={{ width: 'fit-content' }}
    control={<Checkbox checked={checked} onChange={() => setChecked(prev => !prev)}/>}
    label={label}
  />;

  return [Element, checked, setChecked];
};

export default useCheckbox;
