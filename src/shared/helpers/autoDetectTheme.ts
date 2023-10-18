import { ThemePreference } from '@/shared/types/Theme';

type AutoDetectCb = (key: ThemePreference) => void;
type ListenerCb = (event: MediaQueryListEvent) => void;

export const autoDetectTheme = (
  invokeImmediate: AutoDetectCb,
  listener: ListenerCb
) => {
  const darkModeMediaQuery = window.matchMedia(
    `(prefers-color-scheme: ${ThemePreference.dark})`
  );

  invokeImmediate(
    darkModeMediaQuery.matches ? ThemePreference.dark : ThemePreference.light
  );

  darkModeMediaQuery.addEventListener('change', listener);

  return () => {
    darkModeMediaQuery?.removeEventListener('change', listener);
  };
};
