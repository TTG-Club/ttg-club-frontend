import type { GlobalThemeOverrides } from 'naive-ui';

export const light: GlobalThemeOverrides = {
  common: {
    borderColor: 'var(--border)',
    borderRadius: '8px',
    textColorBase: 'var(--text-color)',
    textColor1: 'var(--text-color)',
    textColor2: 'var(--text-color)',
    textColor3: 'var(--text-g-color)',
    iconColor: 'var(--text-g-color)',
    iconColorDisabled: 'var(--text-g-color)',
    iconColorHover: 'var(--text-g-color)',
    placeholderColor: 'var(--text-g-color)',
    placeholderColorDisabled: 'var(--text-g-color)',
    inputColor: 'var(--hover)',
    hoverColor: 'var(--hover)',
    primaryColor: '#5e5446',
    primaryColorHover: 'var(--hover)',
    popoverColor: 'var(--bg-sub-menu)',
  },
  Skeleton: {
    color: 'var(--hover)',
    colorEnd: 'var(--bg-main)',
  },
  Input: {
    groupLabelColor: 'var(--text-color)',
    colorFocus: 'var(--hover)',
    border: '1px solid var(--border)',
    borderHover: '1px solid var(--border)',
    borderDisabled: '1px solid var(--border)',
    borderFocus: '1px solid var(--primary-active)',
    placeholderColor: 'var(--text-g-color)',
  },
  Checkbox: {
    borderRadius: '4px',
    color: 'var(--checkbox-bg)',
    colorDisabled: 'var(--border)',
    colorChecked: 'var(--primary)',
    colorDisabledChecked: 'var(--primary-disabled)',
    textColorDisabled: 'var(--text-color-disabled)',
    border: 'var(--border)',
    borderChecked: 'var(--border)',
    borderDisabled: 'var(--border)',
    borderDisabledChecked: 'var(--border)',
    // boxShadowFocus: 'var(--checkbox-shadow)', Оставим если вдруг вернем фокус.
  },
  Radio: {
    buttonColor: 'var(--hover)',
    buttonColorActive: 'var(--primary-active)',
    buttonTextColorHover: 'var(--text-b-color)',
    buttonTextColorActive: 'var(--text-btn-color)',
    buttonBorderColor: 'var(--border)',
    buttonBorderColorHover: 'var(--primary)',
    buttonBorderColorActive: 'var(--primary-active)',
    buttonBoxShadowHover: 'inset 0 0 0 1px var(--primary)',
    buttonBoxShadowFocus: 'inset 0 0 0 0px #ffffff00',
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

    textColor: 'var(--text-b-color)',
    textColorHover: 'var(--text-b-color)',
    textColorTertiary: 'var(--text-b-color)',
    textColorPressed: 'var(--text-b-color)',
    textColorDisabled: 'var(--text-b-color)',
  },
};
