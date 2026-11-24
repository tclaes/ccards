/** Component CSS must use design tokens (apps/web/src/tokens.css and colors.css), never raw values. */
const tokenProperties = [
  // colors
  '/color$/',
  'background',
  'border',
  'outline',
  'box-shadow',
  'fill',
  'stroke',
  // typography
  'font-size',
  // spacing
  '/^padding/',
  '/^margin/',
  'gap',
  'row-gap',
  'column-gap',
];

export default {
  plugins: ['stylelint-declaration-strict-value', 'stylelint-order'],
  rules: {
    // CSS properties are written in alphabetical order.
    'order/properties-alphabetical-order': true,
    // Colours come from Pico's --pico-* variables, never from literals.
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      [/^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|light-dark)$/i],
    ],
    'scale-unlimited/declaration-strict-value': [
      tokenProperties,
      {
        ignoreValues: [
          'inherit',
          'initial',
          'unset',
          'transparent',
          'currentColor',
          'none',
          'solid',
          'dashed',
          'dotted',
          'auto',
          '0',
        ],
        disableFix: true,
        message:
          'Use a design token (var(--...)) from tokens.css for "${property}", not "${value}".',
      },
    ],
  },
  overrides: [
    {
      // The only place raw values are allowed: where tokens are defined.
      files: ['**/tokens.css', '**/colors.css'],
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
    {
      // The theme is the one file that holds raw colour values (the Pico palette).
      files: ['**/theme.css'],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': null,
        'scale-unlimited/declaration-strict-value': null,
      },
    },
  ],
};
