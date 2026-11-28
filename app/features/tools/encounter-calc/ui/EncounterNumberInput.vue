<script setup lang="ts">
  /**
   * Числовое поле строки калькулятора. Наружу отдаёт только числа: пока поле
   * стёрто, `UInputNumber` сообщает `null`, и строка хранит прежнее значение.
   */
  const { min, max } = defineProps<{
    min: number;
    max: number;
  }>();

  const model = defineModel<number>({ required: true });

  /**
   * Принимает новое значение поля, пропуская пустое.
   * @param next Значение из поля; `null` — поле стёрто.
   */
  function handleUpdate(next: number | null | undefined): void {
    if (typeof next === 'number') {
      model.value = next;
    }
  }
</script>

<template>
  <UInputNumber
    :model-value="model"
    :min
    :max
    @update:model-value="handleUpdate"
  />
</template>
