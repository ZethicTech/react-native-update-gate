import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import type { UpdateGateTheme } from '../types';

export const lightTheme: UpdateGateTheme = {
  background: 'rgba(15, 23, 42, 0.45)',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  border: '#E2E8F0',
  shadow: '#0F172A',
  radius: 24,
};

export const darkTheme: UpdateGateTheme = {
  background: 'rgba(0, 0, 0, 0.55)',
  surface: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  primary: '#3B82F6',
  onPrimary: '#FFFFFF',
  border: '#334155',
  shadow: '#000000',
  radius: 24,
};

const ThemeContext = createContext<Partial<UpdateGateTheme> | UpdateGateTheme | null>(null);

export const UpdateGateThemeProvider = ThemeContext.Provider;

export const createTheme = (
  overrides: Partial<UpdateGateTheme> = {},
): UpdateGateTheme => ({ ...lightTheme, ...overrides });

// Merge order: platform default → context → override prop → accent shorthand.
export const useTheme = (
  override?: Partial<UpdateGateTheme>,
  accent?: string,
): UpdateGateTheme => {
  const fromContext = useContext(ThemeContext);
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? darkTheme : lightTheme;

  const merged: UpdateGateTheme = {
    ...base,
    ...(fromContext ?? {}),
    ...(override ?? {}),
  };
  if (accent) merged.primary = accent;
  return merged;
};

// Appends an alpha byte to a hex colour. Returns non-hex inputs unchanged.
export const withAlpha = (color: string, alpha: number): string => {
  if (!color.startsWith('#')) return color;
  const clamped = Math.max(0, Math.min(1, alpha));
  const alphaByte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  if (color.length === 4) {
    const r = color[1]!;
    const g = color[2]!;
    const b = color[3]!;
    return `#${r}${r}${g}${g}${b}${b}${alphaByte}`;
  }
  if (color.length === 7) return `${color}${alphaByte}`;
  if (color.length === 9) return `${color.slice(0, 7)}${alphaByte}`;
  return color;
};
