import type { TileColors } from './tile-colors.model';

const DEFAULT_TILE: TileColors = {
  background: 'var(--color-tile-default)',
  text: 'var(--color-tile-text-light)',
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Background and readable text colour for a card's tile. Only `#rgb` and
 * `#rrggbb` are understood (the contract leaves `color` free-form); anything
 * else gets the default tile.
 */
export function tileColors(color: string | null | undefined): TileColors {
  if (!color || !HEX_COLOR.test(color)) return DEFAULT_TILE;
  const [r, g, b] = channels(color);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return {
    background: color,
    text:
      brightness >= 128
        ? 'var(--color-tile-text-dark)'
        : 'var(--color-tile-text-light)',
  };
}

function channels(hex: string): [number, number, number] {
  const digits = hex.slice(1);
  const full = digits.length === 3 ? digits.replace(/./g, '$&$&') : digits;
  const value = parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
