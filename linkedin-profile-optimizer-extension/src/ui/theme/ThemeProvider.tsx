import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "rezoomed.theme.v1";
/**
 * Mirrored to localStorage so the popup's inline boot script can read
 * the theme synchronously before React mounts. Without this we'd flash
 * white-on-dark for one frame.
 */
export const THEME_LOCALSTORAGE_KEY = "rezoomed.theme.v1.cache";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Reads the cached theme synchronously from localStorage. Used by both
 * the ThemeProvider's initial state and by the inline boot scripts in
 * popup index.html / content entrypoint to avoid flash-of-light-on-dark.
 */
export function readCachedTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_LOCALSTORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    /* ignore */
  }
  return "light";
}

function writeCachedTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_LOCALSTORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

interface ProviderProps {
  /** DOM element that should receive the data-theme attribute. Defaults to document.documentElement. */
  applyTo?: HTMLElement | null;
  initialTheme?: Theme;
  children: ReactNode;
}

export function ThemeProvider({ applyTo, initialTheme, children }: ProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => initialTheme ?? readCachedTheme(),
  );

  // Apply data-theme to the target element. Re-runs whenever theme changes
  // so the OS-level color-scheme + token cascade stays in sync.
  useEffect(() => {
    const target = applyTo ?? document.documentElement;
    target.setAttribute("data-theme", theme);
    writeCachedTheme(theme);
  }, [theme, applyTo]);

  // Hydrate from chrome.storage on mount. Fires once; if storage is
  // unavailable (preview surfaces) we just keep the cached/default value.
  useEffect(() => {
    let cancelled = false;
    try {
      chrome?.storage?.local?.get?.([THEME_STORAGE_KEY], (result) => {
        if (cancelled) return;
        const stored = result?.[THEME_STORAGE_KEY];
        if (stored === "dark" || stored === "light") {
          setThemeState(stored);
        }
      });
    } catch {
      /* ignore */
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync across surfaces — popup ↔ sidebar pick up changes from the other.
  useEffect(() => {
    function handler(
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) {
      if (areaName !== "local") return;
      const change = changes[THEME_STORAGE_KEY];
      if (!change) return;
      const next = change.newValue;
      if (next === "dark" || next === "light") {
        setThemeState(next);
      }
    }
    try {
      chrome?.storage?.onChanged?.addListener?.(handler);
    } catch {
      return undefined;
    }
    return () => {
      try {
        chrome?.storage?.onChanged?.removeListener?.(handler);
      } catch {
        /* ignore */
      }
    };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      chrome?.storage?.local?.set?.({ [THEME_STORAGE_KEY]: next });
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Allow components to be rendered outside a provider — fall back to
    // a no-op handler. Useful for previews / tests.
    return {
      theme: "light",
      setTheme: () => undefined,
      toggle: () => undefined,
    };
  }
  return ctx;
}
