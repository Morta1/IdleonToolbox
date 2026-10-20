import { Checkbox, FormControlLabel } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';

// storageKey keeps a saved value when the visible label is reworded
const useCheckbox = (label, initial = false, storageKey = label) => {
  const [isLoading, setIsLoading] = useState(true);
  const [checked, setChecked] = useLocalStorage({ key: `checkbox-${storageKey}`, defaultValue: initial });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const Element = () => isLoading ? null : <FormControlLabel
    sx={{ width: 'fit-content' }}
    control={<Checkbox checked={checked} size="small" onChange={() => setChecked(prev => !prev)}/>}
    label={label}
  />;

  return [Element, checked, setChecked];
};

export default useCheckbox;
