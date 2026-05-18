import { createTheme, darkTheme, lightTheme, withAlpha } from '../src/components/theme';

describe('createTheme', () => {
  it('returns the light theme when no overrides are passed', () => {
    expect(createTheme()).toEqual(lightTheme);
  });

  it('merges partial overrides on top of the light theme', () => {
    const result = createTheme({ primary: '#FF6B6B', radius: 28 });
    expect(result.primary).toBe('#FF6B6B');
    expect(result.radius).toBe(28);
    // Untouched fields keep their light defaults.
    expect(result.surface).toBe(lightTheme.surface);
    expect(result.text).toBe(lightTheme.text);
  });

  it('always returns a complete UpdateGateTheme with all ten properties', () => {
    const result = createTheme({ primary: '#000' });
    const requiredKeys = [
      'background',
      'surface',
      'text',
      'textMuted',
      'primary',
      'onPrimary',
      'border',
      'shadow',
      'radius',
    ];
    requiredKeys.forEach((key) => {
      expect(result).toHaveProperty(key);
    });
  });
});

describe('lightTheme / darkTheme contract', () => {
  it('exposes the same set of keys', () => {
    expect(Object.keys(lightTheme).sort()).toEqual(Object.keys(darkTheme).sort());
  });
});

describe('withAlpha', () => {
  it('appends an alpha byte to a #RRGGBB hex', () => {
    expect(withAlpha('#FF0000', 1)).toBe('#FF0000FF');
    expect(withAlpha('#FF0000', 0)).toBe('#FF000000');
    expect(withAlpha('#FF0000', 0.5)).toBe('#FF000080');
  });

  it('expands a #RGB hex to #RRGGBBAA', () => {
    expect(withAlpha('#F00', 1)).toBe('#FF0000FF');
    expect(withAlpha('#0F0', 0.5)).toBe('#00FF0080');
  });

  it('replaces an existing alpha byte on #RRGGBBAA', () => {
    expect(withAlpha('#FF000000', 1)).toBe('#FF0000FF');
  });

  it('clamps alpha to [0, 1]', () => {
    expect(withAlpha('#FF0000', 2)).toBe('#FF0000FF');
    expect(withAlpha('#FF0000', -1)).toBe('#FF000000');
  });

  it('returns non-hex inputs unchanged', () => {
    expect(withAlpha('rgb(255, 0, 0)', 0.5)).toBe('rgb(255, 0, 0)');
    expect(withAlpha('red', 0.5)).toBe('red');
    expect(withAlpha('rgba(255,0,0,0.3)', 0.5)).toBe('rgba(255,0,0,0.3)');
  });
});
