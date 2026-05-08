import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { z } from 'zod';

export type UrlParamsResult<T> =
  | { ok: true; data: T; raw: Record<string, string> }
  | {
      ok: false;
      error: z.ZodError;
      raw: Record<string, string>;
    };

/**
 * Parse the current URL's query string against a Zod schema. The widget's
 * state is entirely derived from the URL — the returned setter writes back
 * to the URL so a copy/paste of the address bar fully reproduces the view.
 *
 * Unknown query keys are preserved on update so external tracking params
 * (utm_*, etc.) survive widget interactions.
 */
export function useUrlParams<S extends z.ZodTypeAny>(
  schema: S,
): {
  result: UrlParamsResult<z.infer<S>>;
  setParams: (next: Partial<z.input<S>>) => void;
  replaceParams: (next: z.input<S>) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const raw = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of searchParams.entries()) out[k] = v;
    return out;
  }, [searchParams]);

  const result = useMemo<UrlParamsResult<z.infer<S>>>(() => {
    const parsed = schema.safeParse(raw);
    if (parsed.success) return { ok: true, data: parsed.data, raw };
    return { ok: false, error: parsed.error, raw };
  }, [schema, raw]);

  const setParams = useCallback(
    (next: Partial<z.input<S>>) => {
      setSearchParams(
        (prev) => {
          const merged = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(next)) {
            if (v === undefined || v === null) merged.delete(k);
            else merged.set(k, String(v));
          }
          return merged;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const replaceParams = useCallback(
    (next: z.input<S>) => {
      const merged = new URLSearchParams();
      for (const [k, v] of Object.entries(next as Record<string, unknown>)) {
        if (v === undefined || v === null) continue;
        merged.set(k, String(v));
      }
      setSearchParams(merged, { replace: true });
    },
    [setSearchParams],
  );

  return { result, setParams, replaceParams };
}
