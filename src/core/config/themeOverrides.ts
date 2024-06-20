import type { GlobalThemeOverrides } from 'naive-ui';

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    borderRadius: '8px',
  },
  Checkbox: {
    borderRadius: '4px',
  },
  Skeleton: {
    color: 'var(--hover)',
    colorEnd: 'var(--bg-main)',
  },
};
