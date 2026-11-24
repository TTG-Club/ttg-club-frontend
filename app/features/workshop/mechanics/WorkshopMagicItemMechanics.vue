<script setup lang="ts">
  import type { MagicItemMechanicsForm } from '../model';

  import {
    MAGIC_ITEM_ACTIVATION_OPTIONS,
    MAGIC_ITEM_RECHARGE_EVENT_OPTIONS,
    MECHANICS_TEXT,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /**
   * Механика магического предмета — как `MagicItemMechanics` нового сайта:
   * когда она работает, пассивные свойства и заряды. Эффекты предмета лежат
   * в этой же механике, но правятся своим блоком рядом.
   */
  const mechanics = defineModel<MagicItemMechanicsForm>({ required: true });

  const activationItems = [...MAGIC_ITEM_ACTIVATION_OPTIONS];
  const rechargeEventItems = [...MAGIC_ITEM_RECHARGE_EVENT_OPTIONS];

  /**
   * Заряды описывает максимум: без него ни формула восстановления, ни событие
   * ничего не значат, поэтому остальные поля ждут его заполнения.
   */
  const hasCharges = computed(
    () => (mechanics.value.resource.maxCharges ?? 0) > 0,
  );
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
    :ui="{ body: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4' }"
  >
    <template #header>
      <div class="flex min-w-0 flex-col">
        <h2 class="truncate text-base text-highlighted">
          {{ MECHANICS_TEXT.title }}
        </h2>

        <span class="text-xs text-muted">{{ MECHANICS_TEXT.subtitle }}</span>
      </div>
    </template>

    <UFormField :label="MECHANICS_TEXT.magicItemActivation">
      <USelectMenu
        v-model="mechanics.activation"
        :items="activationItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      :label="MECHANICS_TEXT.magicItemPassive"
      class="sm:col-span-1 lg:col-span-3"
    >
      <UInput
        v-model="mechanics.passive"
        :placeholder="MECHANICS_TEXT.magicItemPassivePlaceholder"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="MECHANICS_TEXT.maxCharges">
      <UInputNumber
        v-model="mechanics.resource.maxCharges"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="MECHANICS_TEXT.recharge">
      <UInput
        v-model="mechanics.resource.recharge"
        :placeholder="MECHANICS_TEXT.rechargePlaceholder"
        :disabled="!hasCharges"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="MECHANICS_TEXT.rechargeEvent">
      <USelectMenu
        v-model="mechanics.resource.rechargeEvent"
        :items="rechargeEventItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        :disabled="!hasCharges"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField :label="MECHANICS_TEXT.chargeCost">
      <UInputNumber
        v-model="mechanics.resource.cost"
        :min="0"
        :disabled="!hasCharges"
        class="w-full"
      />
    </UFormField>
  </UCard>
</template>
