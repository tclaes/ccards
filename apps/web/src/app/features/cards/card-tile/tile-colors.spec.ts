import { tileColors } from './tile-colors';

describe('tileColors', () => {
  it('uses the colour as background with dark text on a light colour', () => {
    expect(tileColors('#ffeb3b')).toEqual({
      background: '#ffeb3b',
      text: 'var(--color-tile-text-dark)',
    });
  });

  it('uses light text on a dark colour', () => {
    expect(tileColors('#e30613').text).toBe('var(--color-tile-text-light)');
    expect(tileColors('#000').text).toBe('var(--color-tile-text-light)');
  });

  it('understands the short hex form', () => {
    expect(tileColors('#fff')).toEqual({
      background: '#fff',
      text: 'var(--color-tile-text-dark)',
    });
  });

  it.each([null, undefined, '', 'not-a-colour', 'red', '#12345'])(
    'falls back to the default tile for %j',
    (color) => {
      expect(tileColors(color)).toEqual({
        background: 'var(--color-tile-default)',
        text: 'var(--color-tile-text-light)',
      });
    },
  );
});
