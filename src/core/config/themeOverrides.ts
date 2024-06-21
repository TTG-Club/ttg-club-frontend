import type { GlobalThemeOverrides } from 'naive-ui';

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    borderRadius: '8px',
    textColorBase: 'var(--text-color)',
  },
  Checkbox: {
    borderRadius: '4px',
    color: 'var(--checkbox-bg)',
    colorDisabled: 'var(--border)',
    colorChecked: 'var(--primary)',
    colorDisabledChecked: 'var(--primary-disabled)',
    textColor: 'var(--text-color)',
    textColorDisabled: 'var(--text-color-disabled)',
    border: 'var(--border)',
    borderChecked: 'var(--border)',
    borderFocus: 'var(--border)',
    borderDisabled: 'var(--border)',
    borderDisabledChecked: 'var(--border)',
    boxShadowFocus: 'var(--checkbox-shadow)',
  },
  Skeleton: {
    color: 'var(--hover)',
    colorEnd: 'var(--bg-main)',
  },
  Button: {
    colorPrimary: 'var(--primary)',
    colorPrimaryHover: 'var(--primary-hover)',
  },
};
