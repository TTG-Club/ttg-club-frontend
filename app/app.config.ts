// Цветные залитые кнопки, вкладки, плашки фильтров, галочки и метки:
// в тёмной теме Nuxt UI красит их текст в тёмный, а нужен белый
const SOLID_COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
] as const;

export default defineAppConfig({
  icon: {
    mode: 'css',
    cssLayer: 'base',
  },
  ui: {
    button: {
      compoundVariants: SOLID_COLORS.map((color) => ({
        color,
        variant: 'solid' as const,
        class: 'text-on-accent',
      })),
    },
    badge: {
      compoundVariants: SOLID_COLORS.map((color) => ({
        color,
        variant: 'solid' as const,
        class: 'text-on-accent',
      })),
    },
    checkbox: {
      compoundVariants: SOLID_COLORS.map((color) => ({
        color,
        class: { indicator: 'text-on-accent' },
      })),
    },
    chip: {
      compoundVariants: SOLID_COLORS.map((color) => ({
        color,
        class: { base: 'text-on-accent' },
      })),
    },
    tabs: {
      compoundVariants: SOLID_COLORS.map((color) => ({
        color,
        variant: 'pill' as const,
        class: { trigger: 'data-[state=active]:text-on-accent' },
      })),
    },
    icons: {
      arrowLeft: 'tabler:arrow-left',
      arrowRight: 'tabler:arrow-right',
      check: 'tabler:check',
      chevronDoubleLeft: 'tabler:chevrons-left',
      chevronDoubleRight: 'tabler:chevrons-right',
      chevronDown: 'tabler:chevron-down',
      chevronLeft: 'tabler:chevron-left',
      chevronRight: 'tabler:chevron-right',
      chevronUp: 'tabler:chevron-up',
      close: 'tabler:x',
      dark: 'tabler:moon',
      ellipsis: 'tabler:dots',
      external: 'tabler:external-link',
      light: 'tabler:sun',
      loading: 'tabler:loader-2',
      menu: 'tabler:menu-2',
      minus: 'tabler:minus',
      plus: 'tabler:plus',
      search: 'tabler:search',
    },
  },
});
