<script setup lang="ts">
  import type { AbilityKey, CustomClassPayload, SkillKey } from '../model';

  import { useCharacterSheet } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    CUSTOM_CLASS_DEFAULT_HIT_DIE,
    CUSTOM_CLASS_TEXT,
    HIT_DIE_LABEL_PREFIX,
    HIT_DIE_SIZES,
    SHEET_ICON,
    SKILL_INFO,
    SKILL_KEYS,
    toAbilityKey,
  } from '../model';

  /** Черновик умения своего класса. */
  interface FeatureDraft {
    id: number;
    name: string;
    description: string;
  }

  /**
   * Свой класс, как в core-app: название и подкласс, кость хитов,
   * спасброски (у первого класса), навыки, заклинательная характеристика и
   * умения. Применяется как каталожный — хиты, владения и умения сразу
   * ложатся в лист.
   */
  const emit = defineEmits<{
    save: [payload: CustomClassPayload];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const NO_ABILITY = 'none';

  const { document } = useCharacterSheet();

  const name = ref('');
  const subclassName = ref('');

  const hitDie = ref<(typeof HIT_DIE_SIZES)[number]>(
    CUSTOM_CLASS_DEFAULT_HIT_DIE,
  );

  const savingThrows = ref<Array<AbilityKey>>([]);
  const skills = ref<Array<SkillKey>>([]);
  const spellcasting = ref<string>(NO_ABILITY);
  const features = ref<Array<FeatureDraft>>([]);

  let nextFeatureId = 0;

  const isFirstClass = computed(() => !document.value.classes.length);

  const hitDieOptions = HIT_DIE_SIZES.map((size) => ({
    label: `${HIT_DIE_LABEL_PREFIX}${size}`,
    value: size,
  }));

  const abilityOptions = ABILITY_KEYS.map((key) => ({
    label: ABILITY_LABELS[key].name,
    value: key,
  }));

  const spellcastingOptions = [
    { label: CUSTOM_CLASS_TEXT.noSpellcasting, value: NO_ABILITY },
    ...abilityOptions,
  ];

  const skillOptions = SKILL_KEYS.map((key) => ({
    label: SKILL_INFO[key].names[0],
    value: key,
  }));

  const canSave = computed(() => Boolean(name.value.trim()));

  function addFeature(): void {
    nextFeatureId += 1;

    features.value = [
      ...features.value,
      { id: nextFeatureId, name: '', description: '' },
    ];
  }

  /**
   * Убирает умение из черновика.
   * @param id - умение черновика
   */
  function removeFeature(id: number): void {
    features.value = features.value.filter((feature) => feature.id !== id);
  }

  function save(): void {
    if (!canSave.value) {
      return;
    }

    emit('save', {
      name: name.value.trim(),
      subclassName: subclassName.value,
      hitDie: hitDie.value,
      savingThrows: savingThrows.value,
      skills: skills.value,
      spellcastingAbility: toAbilityKey(spellcasting.value),
      features: features.value.map((feature) => ({
        name: feature.name,
        description: feature.description,
      })),
    });

    isOpen.value = false;
  }

  function close(): void {
    isOpen.value = false;
  }

  watch(isOpen, (open) => {
    if (open) {
      name.value = '';
      subclassName.value = '';
      hitDie.value = CUSTOM_CLASS_DEFAULT_HIT_DIE;
      savingThrows.value = [];
      skills.value = [];
      spellcasting.value = NO_ABILITY;
      features.value = [];
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="CUSTOM_CLASS_TEXT.title"
    :description="CUSTOM_CLASS_TEXT.hint"
    :ui="{ content: 'sm:max-w-xl', body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField
          :label="CUSTOM_CLASS_TEXT.name"
          required
        >
          <UInput
            v-model="name"
            :placeholder="CUSTOM_CLASS_TEXT.namePlaceholder"
            autofocus
            class="w-full"
          />
        </UFormField>

        <UFormField :label="CUSTOM_CLASS_TEXT.subclass">
          <UInput
            v-model="subclassName"
            :placeholder="CUSTOM_CLASS_TEXT.subclassPlaceholder"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="CUSTOM_CLASS_TEXT.hitDie">
          <USelect
            v-model="hitDie"
            :items="hitDieOptions"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="CUSTOM_CLASS_TEXT.spellcasting">
          <USelect
            v-model="spellcasting"
            :items="spellcastingOptions"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField
        v-if="isFirstClass"
        :label="CUSTOM_CLASS_TEXT.savingThrows"
        :hint="CUSTOM_CLASS_TEXT.savingThrowsHint"
      >
        <USelectMenu
          v-model="savingThrows"
          :items="abilityOptions"
          value-key="value"
          multiple
          class="w-full"
        />
      </UFormField>

      <UFormField :label="CUSTOM_CLASS_TEXT.skills">
        <USelectMenu
          v-model="skills"
          :items="skillOptions"
          value-key="value"
          multiple
          class="w-full"
        />
      </UFormField>

      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-highlighted">
          {{ CUSTOM_CLASS_TEXT.features }}
        </span>

        <div
          v-for="feature in features"
          :key="feature.id"
          class="flex flex-col gap-2 rounded-lg border border-default p-3"
        >
          <div class="flex items-center gap-2">
            <UInput
              v-model="feature.name"
              :placeholder="CUSTOM_CLASS_TEXT.featureName"
              class="grow"
            />

            <UButton
              :icon="SHEET_ICON.remove"
              :aria-label="CUSTOM_CLASS_TEXT.removeFeature"
              color="error"
              variant="ghost"
              @click.left.exact.prevent="removeFeature(feature.id)"
            />
          </div>

          <UTextarea
            v-model="feature.description"
            :placeholder="CUSTOM_CLASS_TEXT.featureDescription"
            autoresize
            :rows="2"
            class="w-full"
          />
        </div>

        <UButton
          :label="CUSTOM_CLASS_TEXT.addFeature"
          :icon="SHEET_ICON.add"
          color="neutral"
          variant="outline"
          size="sm"
          class="self-start"
          @click.left.exact.prevent="addFeature"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="CUSTOM_CLASS_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />

        <UButton
          :label="CUSTOM_CLASS_TEXT.save"
          :disabled="!canSave"
          @click.left.exact.prevent="save"
        />
      </div>
    </template>
  </UModal>
</template>
