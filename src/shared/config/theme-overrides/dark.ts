import type { GlobalThemeOverrides } from 'naive-ui';

export const dark: GlobalThemeOverrides = {
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
    inputColor: 'var(--bg-secondary)',
    inputColorDisabled: 'var(--hover)',
    hoverColor: 'var(--hover)',
    primaryColor: '#3567c9',
    primaryColorHover: 'var(--primary-hover)',
    primaryColorPressed: 'var(--primary-hover)',
    popoverColor: '#1d282f',
    fontFamily: '"Open Sans", sans-serif',
    fontFamilyMono: '"Monaco", monospace sans-serif',
  },
  Skeleton: {
    color: 'var(--hover)',
    colorEnd: 'var(--bg-main)',
  },
  Input: {
    groupLabelColor: 'var(--primary)',
    groupLabelTextColor: 'var(--text-b-color)',
    groupLabelBorder: 'var(--border)',
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
    border: '1px solid var(--border)',
    // borderHover: 'var(--primary-hover)',
    borderPressed: 'var(--primary-active)',
    borderDisabled: 'var(--primary-disabled)',

    iconSizeLarge: '22px',

    colorPrimary: '#3567c9',
    // colorHoverPrimary: 'var(--primary-hover)',
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

    colorQuaternaryHover: 'var(--hover)',

    textColor: 'var(--text-b-color)',
    textColorHover: 'var(--text-b-color)',
    textColorTertiary: 'var(--text-b-color)',
    textColorPressed: 'var(--text-b-color)',
    textColorDisabled: 'var(--text-b-color)',

    paddingTiny: '0 4px',
    paddingSmall: '0 5px',
    paddingMedium: '0 8px',
    paddingLarge: '0 10px',
  },
  Dialog: {
    titleFontSize: 'var(--h4-font-size)',
    fontSize: 'var(--main-font-size)',
    color: 'var(--bg-main)',
  },
  Pagination: {
    itemColorDisabled: 'var(--hover)',
  },
  Tag: {
    textColorCheckable: 'var(--text-color)',
    colorCheckable: 'var(--hover)',
    textColorChecked: 'var(--text-btn-color)',
    colorChecked: 'var(--primary-active)',
    textColorHoverCheckable: 'var(--text-color)',
    colorCheckedHover: 'var(--primary-hover)',
  },
  Select: {
    peers: {
      InternalSelectMenu: {
        optionTextColorActive: 'var(--text-b-color)',
      },
    },
  },
};
