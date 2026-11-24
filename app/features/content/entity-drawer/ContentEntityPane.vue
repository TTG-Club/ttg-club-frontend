<script setup lang="ts">
  import type { EntityPaneType } from '../model';

  import { BackgroundBody } from '~character/backgrounds';
  import { ClassBody } from '~character/classes';
  import { FeatBody } from '~character/feats';
  import {
    backgroundDetailSchema,
    classDetailSchema,
    featDetailSchema,
    optionDetailSchema,
    raceDetailSchema,
    spellDetailSchema,
  } from '~character/model';
  import { OptionBody } from '~character/options';
  import { RaceBody } from '~character/races';
  import { SpellBody } from '~character/spells';
  import { ArmorBody } from '~inventory/armors';
  import { ItemBody } from '~inventory/items';
  import { MagicItemBody } from '~inventory/magic-items';
  import {
    armorDetailSchema,
    itemDetailSchema,
    magicItemDetailSchema,
    weaponDetailSchema,
  } from '~inventory/model';
  import { WeaponBody } from '~inventory/weapons';
  import { provideSectionEntryCompact } from '~section/composables';
  import { getEntryApiPath } from '~section/model';

  import { CONTENT_ENTITY_PANE_TEXT, isFeatDetailType } from '../model';

  /**
   * Карточка записи справочника прямо на месте, без дровера: для панели
   * описания рядом со списком. Грузит запись по адресу и выводит её
   * карточкой своего раздела в сжатом виде, как в окне ширмы: без переходов
   * по разделу.
   */
  const { type, path } = defineProps<{
    type: EntityPaneType;
    /** Адрес страницы записи, например `/spells/fireball`. */
    path: string;
  }>();

  const api = useApi();

  provideSectionEntryCompact();

  /**
   * Загружает запись и проверяет её схемой своего раздела.
   * @returns запись вместе с видом карточки; null — вида без карточки
   */
  async function loadEntry() {
    const raw: unknown = await api(getEntryApiPath(path), { method: 'POST' });

    if (type === 'spell') {
      return { kind: 'spell', entry: spellDetailSchema.parse(raw) } as const;
    }

    switch (type) {
      case 'class': {
        return { kind: 'class', entry: classDetailSchema.parse(raw) } as const;
      }
      case 'race': {
        return { kind: 'race', entry: raceDetailSchema.parse(raw) } as const;
      }
      case 'background': {
        return {
          kind: 'background',
          entry: backgroundDetailSchema.parse(raw),
        } as const;
      }
      default: {
        break;
      }
    }

    if (isFeatDetailType(type)) {
      return { kind: 'feat', entry: featDetailSchema.parse(raw) } as const;
    }

    switch (type) {
      case 'option': {
        return {
          kind: 'option',
          entry: optionDetailSchema.parse(raw),
        } as const;
      }
      case 'armor': {
        return { kind: 'armor', entry: armorDetailSchema.parse(raw) } as const;
      }
      case 'weapon': {
        return {
          kind: 'weapon',
          entry: weaponDetailSchema.parse(raw),
        } as const;
      }
      case 'item': {
        return { kind: 'item', entry: itemDetailSchema.parse(raw) } as const;
      }
      case 'magic-item': {
        return {
          kind: 'magic-item',
          entry: magicItemDetailSchema.parse(raw),
        } as const;
      }
      default: {
        return null;
      }
    }
  }

  const { data: loaded, status } = useAsyncData(
    () => `content-entity-pane:${type}:${path}`,
    loadEntry,
    { server: false, deep: false },
  );

  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const isError = computed(() => status.value === 'error');
</script>

<template>
  <div
    v-if="isLoading"
    class="grid grow place-items-center p-6"
  >
    <UIcon
      :name="CONTENT_ENTITY_PANE_TEXT.loadingIcon"
      class="size-6 animate-spin text-dimmed"
    />
  </div>

  <p
    v-else-if="isError || !loaded"
    class="p-6 text-center text-sm text-dimmed"
  >
    {{ CONTENT_ENTITY_PANE_TEXT.error }}
  </p>

  <SpellBody
    v-else-if="loaded.kind === 'spell'"
    :spell="loaded.entry"
  />

  <FeatBody
    v-else-if="loaded.kind === 'feat'"
    :feat="loaded.entry"
  />

  <OptionBody
    v-else-if="loaded.kind === 'option'"
    :option="loaded.entry"
  />

  <ArmorBody
    v-else-if="loaded.kind === 'armor'"
    :armor="loaded.entry"
  />

  <WeaponBody
    v-else-if="loaded.kind === 'weapon'"
    :weapon="loaded.entry"
  />

  <ItemBody
    v-else-if="loaded.kind === 'item'"
    :item="loaded.entry"
  />

  <MagicItemBody
    v-else-if="loaded.kind === 'magic-item'"
    :item="loaded.entry"
  />

  <ClassBody
    v-else-if="loaded.kind === 'class'"
    :entry="loaded.entry"
    :path="path"
  />

  <RaceBody
    v-else-if="loaded.kind === 'race'"
    :race="loaded.entry"
    :path="path"
  />

  <BackgroundBody
    v-else
    :background="loaded.entry"
  />
</template>
