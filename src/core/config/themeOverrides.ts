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
    borderDisabled: 'var(--border)',
    borderDisabledChecked: 'var(--border)',
    // boxShadowFocus: 'var(--checkbox-shadow)', Оставим если вдруг вернем фокус.
  },
  Skeleton: {
    color: 'var(--hover)',
    colorEnd: 'var(--bg-main)',
  },
  Button: {
    color: 'var(--primary)',
    colorHover: 'var(--primary-hover)',
    colorPressed: 'var(--primary-active)',
    colorDisabled: 'var(--primary-disabled)',

    border: '1px solid var(--border)',
    borderHover: 'var(--primary-hover)',
    borderPressed: 'var(--primary-active)',
    borderDisabled: 'var(--primary-disabled)',

    colorPrimary: 'var(--primary)',
    colorHoverPrimary: 'var(--primary-hover)',
    colorPressedPrimary: 'var(--primary-active)',
    colorDisabledPrimary: 'var(--primary-disabled)',
    borderPrimary: 'var(--primary)',
    borderHoverPrimary: 'var(--primary-hover)',
    borderPressedPrimary: 'var(--primary-active)',
    borderDisabledPrimary: 'var(--primary-disabled)',
    textColorPrimary: 'var(--text-btn-color)',
    textColorHoverPrimary: 'var(--text-btn-color)',
    textColorPressedPrimary: 'var(--text-btn-color)',
    textColorDisabledPrimary: 'var(--text-btn-color)',

    colorSecondary: 'var(--secondary)',
    colorSecondaryHover: 'var(--secondary-hover)',
    colorSecondaryPressed: 'var(--secondary)',

    textColor: 'var(--text-btn-color)',
    textColorHover: 'var(--text-btn-color)',
    textColorTertiary: 'var(--text-btn-color)',
    textColorPressed: 'var(--text-btn-color)',
    textColorDisabled: 'var(--text-btn-color)',
  },
};
