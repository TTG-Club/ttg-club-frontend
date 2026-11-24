export { default as ActiveEffects } from './ActiveEffects.vue';
// Форма одного эффекта нужна и листу персонажа: игрок заводит там свои эффекты
// той же формой, какой мастерская правит эффекты записи каталога. Названным
// экспортом, а не реэкспортом барреля `ui`: наружу отдаётся один компонент, а
// не вся внутренняя папка.
export { default as ActiveEffectItem } from './ui/ActiveEffectItem.vue';
