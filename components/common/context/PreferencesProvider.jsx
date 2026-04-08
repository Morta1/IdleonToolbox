import { createContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';

export const PreferencesContext = createContext({});

const PreferencesProvider = ({ children }) => {
  const [dateFormat, setDateFormat] = useLocalStorage({
    key: 'pref-dateFormat',
    defaultValue: 'DMY'
  });
  const [timeFormat, setTimeFormat] = useLocalStorage({
    key: 'pref-timeFormat',
    defaultValue: '24h'
  });

  return (
    <PreferencesContext.Provider value={{ dateFormat, setDateFormat, timeFormat, setTimeFormat }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export default PreferencesProvider;
