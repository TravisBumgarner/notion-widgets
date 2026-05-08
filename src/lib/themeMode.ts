import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

export const THEME_PARAM = 'theme';

export const themeModeSchema = z
  .enum(['light', 'dark', 'system'])
  .default('system');

export type ThemeMode = z.infer<typeof themeModeSchema>;
export type ResolvedThemeMode = 'light' | 'dark';

const prefersDarkQuery = '(prefers-color-scheme: dark)';

const getSystemMode = (): ResolvedThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia(prefersDarkQuery).matches ? 'dark' : 'light';
};

/**
 * Resolves the active theme mode from the `?theme=` URL param
 * (light | dark | system), falling back to system preference and
 * subscribing to OS-level changes when in 'system' mode.
 */
export function useThemeMode(): {
  mode: ResolvedThemeMode;
  preference: ThemeMode;
  setPreference: (next: ThemeMode) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const preference = themeModeSchema
    .catch('system')
    .parse(searchParams.get(THEME_PARAM) ?? undefined);

  const [systemMode, setSystemMode] = useState<ResolvedThemeMode>(() =>
    getSystemMode(),
  );

  useEffect(() => {
    if (preference !== 'system') return;
    const mql = window.matchMedia(prefersDarkQuery);
    const handler = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [preference]);

  const mode: ResolvedThemeMode =
    preference === 'system' ? systemMode : preference;

  const setPreference = (next: ThemeMode) => {
    setSearchParams(
      (prev) => {
        const merged = new URLSearchParams(prev);
        if (next === 'system') merged.delete(THEME_PARAM);
        else merged.set(THEME_PARAM, next);
        return merged;
      },
      { replace: true },
    );
  };

  return { mode, preference, setPreference };
}
