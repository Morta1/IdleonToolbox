// A goal icon is an image path under public/, or a colour for systems the game draws as a plain colour (palette
// colours); the colour rides in the same string so every place that passes an icon keeps working
const SWATCH = 'swatch:';

export const swatchIcon = (r, g, b) => `${SWATCH}rgb(${r}, ${g}, ${b})`;

export const swatchColor = (icon) => (typeof icon === 'string' && icon.startsWith(SWATCH) ? icon.slice(SWATCH.length) : null);
