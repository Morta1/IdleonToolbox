// Emotion's default stylis prefixer writes -ms-flexbox, -webkit-box and friends beside nearly every flex, transform and
// transition rule, for browsers nobody runs any more. Each exported page inlines its CSS, so across 8,000 wiki pages
// those copies were a few hundred MB of a static export GitHub Pages caps at 1 GB. This keeps only the prefixes a
// current Safari still needs, and leaves everything else as written.

// stylis's element type for a declaration (`user-select:none;`).
const DECLARATION = 'decl';

const STILL_PREFIXED = new Set([
  'user-select',
  'backdrop-filter',
  'text-size-adjust',
  'box-decoration-break',
  'hyphens',
  'background-clip',
  'mask',
  'mask-image',
  'mask-size',
  'mask-position',
  'mask-repeat'
]);

// MUI's ButtonBase writes the old color-adjust in @media print; Chrome and Safari read only print-color-adjust, and
// Safari wants it -webkit- prefixed, so printed buttons and chips keep their backgrounds.
const PRINT_COLOR = 'color-adjust';

// A stylis plugin: sets the declaration's output to the -webkit- copy and then the declaration itself.
export const slimPrefixer = (element) => {
  if (element.type !== DECLARATION || element.return) return;
  if (element.props === PRINT_COLOR) {
    const value = element.value.slice(PRINT_COLOR.length + 1);
    element.return = `-webkit-print-color-adjust:${value}print-color-adjust:${value}${element.value}`;
  } else if (STILL_PREFIXED.has(element.props)) {
    element.return = `-webkit-${element.value}${element.value}`;
  }
};
