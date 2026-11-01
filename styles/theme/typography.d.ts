// The theme's own type styles (darkTheme.js), known to MUI's types so .tsx files can name them.
import type { CSSProperties } from 'react';
import '@mui/material/styles';
import '@mui/material/Typography';

type ThemeTypeStyles = {
  pageTitle: CSSProperties;
  sectionTitle: CSSProperties;
  cardTitle: CSSProperties;
  groupLabel: CSSProperties;
  value: CSSProperties;
  heroValue: CSSProperties;
};

declare module '@mui/material/styles' {
  interface TypographyVariants extends ThemeTypeStyles {}
  interface TypographyVariantsOptions extends Partial<ThemeTypeStyles> {}
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    pageTitle: true;
    sectionTitle: true;
    cardTitle: true;
    groupLabel: true;
    value: true;
    heroValue: true;
  }
}
