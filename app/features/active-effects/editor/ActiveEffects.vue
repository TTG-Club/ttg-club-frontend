<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectActivationMode,
    EffectFormContext,
    EffectOrigin,
  } from '../model';

  import {
    ACTIVE_EFFECT_ICONS,
    ACTIVE_EFFECT_LABELS,
    createEmptyActiveEffect,
    DEFAULT_EFFECT_ICON,
    describeEffectScenario,
    EFFECT_ORIGIN,
    listInertEffectFields,
    resolveEffectFormLayout,
  } from '../model';
  import { useExpandedRows } from './composables';
  import ActiveEffectItem from './ui/ActiveEffectItem.vue';
  import EffectNestedSection from './ui/EffectNestedSection.vue';

  // Источник задаёт редактор-хозяин: он же и знает, чем эффект выдан.
  const {
    context,
    zoneAvailable = undefined,
    applierSaveDc = undefined,
    origin = EFFECT_ORIGIN.spell,
    newEffectActivation = undefined,
    title = ACTIVE_EFFECT_LABELS.title,
    nested = false,
  } = defineProps<{
    /**
     * Место эффектов: заклинание, черта, предмет, оружие, действие или черта
     * существа. От него зависят доставка нового эффекта, шаги формы и то, какие
     * настройки здесь работают.
     */
    context: EffectFormContext;

    /**
     * Есть ли у заклинания область — где появиться зоне на месте шаблона.
     * Передаёт только редактор заклинания; не задано — зона не прячется.
     */
    zoneAvailable?: boolean;

    /**
     * Сл источника для «Авто» у полей Сл: у действия существа — Сл самого
     * действия из формы.
     */
    applierSaveDc?: number;

    origin?: EffectOrigin;

    /**
     * Как действует новый эффект: `use` — ложится применением источника.
     * Передаёт редактор-хозяин, который знает, применяют ли запись: у зелья и
     * жезла «вручную» эффект не работает, пока предмет не применили.
     */
    newEffectActivation?: EffectActivationMode;

    /**
     * Заголовок блока. Своим его называет редактор, у которого эффекты лежат
     * не на своей вкладке, а внутри записи: у умения класса это «Эффекты
     * умения» — рядом с дарами и ресурсами того же умения.
     */
    title?: string;

    /**
     * Эффекты лежат внутри записи, а не на своей вкладке формы. Тогда блок
     * рисуется разделом на дорожке — как соседние блоки механики: карточка
     * среди них была бы седьмой вложенной рамкой подряд.
     */
    nested?: boolean;
  }>();

  const model = defineModel<Array<ActiveEffect>>({ default: () => [] });

  /**
   * Список эффектов один на оба вида блока — карточку своей вкладки и раздел
   * внутри записи. Через переиспользуемый шаблон, а не копией: разойдясь, копии
   * перестали бы редактировать эффект одинаково.
   */
  const [DefineEffects, ReuseEffects] = createReusableTemplate();

  const { isExpanded, toggle, expand, dropRow, getToggleIcon } =
    useExpandedRows();

  /** Индекс эффекта, удаление которого ждёт подтверждения. */
  const pendingRemoval = ref<number | undefined>(undefined);

  const isRemovalOpen = computed({
    get: () => pendingRemoval.value !== undefined,
    set: (open) => {
      if (!open) {
        pendingRemoval.value = undefined;
      }
    },
  });

  /**
   * Без эффектов у карточки остаётся одна шапка: пустое тело места не занимает.
   * Обрезку содержимого карточка снимает всегда: под ней сводка раскрытого
   * эффекта не прилипала бы к верху при прокрутке.
   */
  const cardUi = computed(() =>
    model.value.length
      ? { root: 'overflow-visible' }
      : { root: 'overflow-visible', body: 'p-0 sm:p-0' },
  );

  /**
   * Свёрнутые строки: сводка — по ней автор и модератор сразу видят, что
   * делает каждый эффект, — и число настроек, которые здесь не работают.
   */
  const effectRows = computed(() =>
    model.value.map((effect) => {
      const inertCount = listInertEffectFields(
        effect,
        resolveEffectFormLayout(context, effect, { zoneAvailable }),
      ).length;

      return {
        effect,
        icon: effect.icon || DEFAULT_EFFECT_ICON,
        name: effect.name || ACTIVE_EFFECT_LABELS.unnamed,
        scenario: describeEffectScenario(effect, context),
        inertBadge:
          inertCount > 0
            ? `${ACTIVE_EFFECT_LABELS.inertBadge}${inertCount}`
            : '',
      };
    }),
  );

  /** Добавляет новый эффект в конец списка и сразу его раскрывает. */
  function addEffect() {
    // Индекс считается ДО записи: `model.value` после присваивания ещё отдаёт
    // прежний массив — проп доедет только следующим тиком.
    const addedIndex = model.value.length;

    model.value = [
      ...model.value,
      createEmptyActiveEffect(origin, context, newEffectActivation),
    ];

    // Новый эффект сразу раскрыт: его всё равно тут же настраивают.
    expand(addedIndex);
  }

  /**
   * Просит подтвердить удаление эффекта.
   *
   * @param index номер эффекта.
   */
  function askRemoveEffect(index: number) {
    pendingRemoval.value = index;
  }

  /**
   * Удаляет эффект, удаление которого подтвердили, и закрывает окно
   * подтверждения.
   */
  function confirmRemoveEffect() {
    const index = pendingRemoval.value;

    pendingRemoval.value = undefined;

    if (index === undefined) {
      return;
    }

    model.value = model.value.filter((_, position) => position !== index);

    // Раскрытые сдвигаются вместе со списком: иначе после удаления
    // развернулся бы соседний эффект.
    dropRow(index);
  }

  /**
   * Заменяет эффект целиком.
   *
   * @param index номер эффекта.
   * @param nextEffect новый эффект.
   */
  function updateEffect(index: number, nextEffect: ActiveEffect) {
    model.value = model.value.map((effect, position) =>
      position === index ? nextEffect : effect,
    );
  }
</script>

<template>
  <DefineEffects>
    <!-- `contain-inline-size`: ширину списку задаёт форма, а не содержимое.
      Без него сводка без переносов и ряд вкладок доставки распирали сетку
      редактора, и на телефоне страница уезжала вбок на несколько экранов -->
    <div
      v-if="model.length"
      class="flex flex-col gap-3 contain-inline-size"
    >
      <div
        v-for="(effectRow, index) in effectRows"
        :key="effectRow.effect.id"
        class="rounded-lg border border-default bg-elevated/20"
      >
        <div
          class="relative flex items-center gap-2 px-3 py-2 transition-colors hover:bg-elevated/40"
        >
          <!-- Нажатие ловит накладка во всю плашку — псевдоэлемент кнопки от
            края до края: попадать в один значок приходилось прицельно. Значок
            свёртки от накладки не поднят, поэтому и он разворачивает эффект.
            Кнопка удаления поднята над ней `relative` -->
          <button
            type="button"
            class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :aria-expanded="isExpanded(index)"
            @click.left.exact.prevent="toggle(index)"
          >
            <UIcon
              :name="effectRow.icon"
              class="size-5 shrink-0 text-primary"
            />

            <span class="flex min-w-0 flex-1 flex-col text-left">
              <span class="truncate text-base">
                {{ effectRow.name }}
              </span>

              <span class="truncate text-xs text-muted">
                {{ effectRow.scenario }}
              </span>
            </span>
          </button>

          <UBadge
            v-if="effectRow.inertBadge"
            color="warning"
            variant="subtle"
            size="sm"
            :icon="ACTIVE_EFFECT_ICONS.inertBadge"
            class="shrink-0"
          >
            {{ effectRow.inertBadge }}
          </UBadge>

          <UButton
            :icon="ACTIVE_EFFECT_ICONS.remove"
            color="error"
            variant="ghost"
            size="xs"
            class="relative shrink-0"
            :aria-label="ACTIVE_EFFECT_LABELS.remove"
            @click.left.exact.prevent="askRemoveEffect(index)"
          />

          <UIcon
            :name="getToggleIcon(index)"
            class="size-4 shrink-0 text-dimmed"
          />
        </div>

        <div
          v-if="isExpanded(index)"
          class="border-t border-default p-3"
        >
          <ActiveEffectItem
            :model-value="effectRow.effect"
            :context="context"
            :zone-available="zoneAvailable"
            :applier-save-dc="applierSaveDc"
            @update:model-value="updateEffect(index, $event)"
          />
        </div>
      </div>
    </div>
  </DefineEffects>

  <EffectNestedSection
    v-if="nested"
    :title="title"
    :hint="ACTIVE_EFFECT_LABELS.subtitle"
    :count="model.length"
    :add-label="ACTIVE_EFFECT_LABELS.add"
    :collapsible="false"
    @add="addEffect"
  >
    <ReuseEffects />
  </EffectNestedSection>

  <UCard
    v-else
    variant="subtle"
    :ui="cardUi"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-base text-highlighted">
            {{ title }}
          </h2>

          <span class="text-xs text-muted">
            {{ ACTIVE_EFFECT_LABELS.subtitle }}
          </span>
        </div>

        <UButton
          :icon="ACTIVE_EFFECT_ICONS.add"
          size="sm"
          variant="subtle"
          @click.left.exact.prevent="addEffect"
        >
          {{ ACTIVE_EFFECT_LABELS.add }}
        </UButton>
      </div>
    </template>

    <ReuseEffects />
  </UCard>

  <UModal
    v-model:open="isRemovalOpen"
    :title="ACTIVE_EFFECT_LABELS.removeConfirmTitle"
    :description="ACTIVE_EFFECT_LABELS.removeConfirmText"
  >
    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="isRemovalOpen = false"
        >
          {{ ACTIVE_EFFECT_LABELS.removeConfirmCancel }}
        </UButton>

        <UButton
          color="error"
          :icon="ACTIVE_EFFECT_ICONS.remove"
          @click.left.exact.prevent="confirmRemoveEffect"
        >
          {{ ACTIVE_EFFECT_LABELS.removeConfirmApply }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
