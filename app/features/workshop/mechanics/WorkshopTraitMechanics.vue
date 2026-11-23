<script setup lang="ts">
  import type { ActiveEffect } from '~active-effects/model';

  import type { MechanicsForm, MechanicsKind } from '../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_FORM_CONTEXT, EFFECT_ORIGIN } from '~active-effects/model';

  import { getMechanicsFilledCount, MECHANICS_TEXT } from '../model';
  import MechanicsSection from './MechanicsSection.vue';
  import WorkshopMechanicsEditor from './WorkshopMechanicsEditor.vue';

  /**
   * Механика и эффекты одного умения класса, архетипа или особенности расы —
   * как `FeatureMechanics` нового сайта. Свёрнутым разделом внутри умения: у
   * большинства умений механики нет, а развёрнутая она заслоняла бы описание.
   */
  const { kind } = defineProps<{
    kind: MechanicsKind;
  }>();

  const mechanics = defineModel<MechanicsForm>('mechanics', {
    required: true,
  });

  const activeEffects = defineModel<Array<ActiveEffect>>('activeEffects', {
    required: true,
  });

  /** Заполненные блоки механики и эффекты — число на бейдже раздела. */
  const filledCount = computed(
    () =>
      getMechanicsFilledCount(mechanics.value, kind)
      + activeEffects.value.length,
  );
</script>

<template>
  <MechanicsSection
    :title="MECHANICS_TEXT.traitSection"
    :hint="MECHANICS_TEXT.traitSectionHint"
    :count="filledCount"
  >
    <WorkshopMechanicsEditor
      v-model="mechanics"
      :kind="kind"
      nested
    />

    <ActiveEffects
      v-model="activeEffects"
      :context="EFFECT_FORM_CONTEXT.feature"
      :origin="EFFECT_ORIGIN.feature"
      :title="MECHANICS_TEXT.effectsTitle"
      nested
    />
  </MechanicsSection>
</template>
