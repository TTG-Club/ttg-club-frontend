<script lang="ts" setup>
  import { omit } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import { CapitalizeFirst as vCapitalizeFirst } from '@/shared/directives/CapitalizeFirst';
  import type {
    TSpellItem,
    TSpellLink,
  } from '@/shared/types/character/Spells.d';
  import type { Maybe } from '@/shared/types/Utility';
  import BaseModal from '@/shared/ui/modals/BaseModal.vue';

  import BookmarkSaveButton from '@/features/bookmarks/components/buttons/BookmarkSaveButton.vue';

  import SpellBody from '@/pages/character/spells/spells-detail/SpellBody.vue';

  import type { RouteLocationPathRaw } from 'vue-router';

  const props = withDefaults(
    defineProps<{
      to: RouteLocationPathRaw;
      spell: TSpellLink;
      inTab?: boolean;
    }>(),
    {
      inTab: false,
    },
  );

  const { navigate, isActive, href } = useLink(props);

  const modal = ref<{
    show: boolean;
    data: Maybe<TSpellItem>;
  }>({
    show: false,
    data: undefined,
  });

  const bookmarkObj = computed(() => ({
    url: props.spell.url,
    name: props.spell.name.rus,
  }));

  const classList = computed(() => ({
    'router-link-active': isActive.value,
    'is-sub-item': props.inTab,
  }));

  const clickHandler = async () => {
    if (!props.inTab) {
      await navigate();

      return;
    }

    try {
      if (!modal.value.data) {
        const resp = await httpClient.post<TSpellItem>({
          url: props.spell.url,
        });

        modal.value.data = resp.data;
      }

      modal.value.show = true;
    } catch (err) {
      console.error(err);
    }
  };
</script>

<template>
  <router-link
    :to="{ path: spell.url }"
    custom
    v-bind="omit($props, 'to')"
  >
    <a
      :class="classList"
      :href="href"
      class="link-item"
      v-bind="$attrs"
      @click.left.exact.prevent="clickHandler"
    >
      <div class="link-item__content">
        <div
          v-tippy-lazy="{
            content: spell.level
              ? `${spell.level} уровень заклинания`
              : 'Заговор',
          }"
          class="link-item__lvl"
        >
          {{ spell.level || '◐' }}
        </div>

        <div class="link-item__body">
          <div class="link-item__row">
            <div class="link-item__name">
              <span class="link-item__name--rus">
                {{ spell.name.rus }}
              </span>

              <span class="link-item__name--eng"> [{{ spell.name.eng }}] </span>
            </div>

            <div
              v-if="spell.source.group"
              v-tippy-lazy="{
                content: spell.source.group.name,
                touch: true,
              }"
              :style="{
                '--source-group-color': `var(--badge-${props.spell.source.group.shortName.toLowerCase()})`,
              }"
              class="link-item__source"
            >
              {{ spell.source.group.shortName }}
            </div>
          </div>

          <div class="link-item__row">
            <div
              v-if="spell.concentration || spell.ritual"
              class="link-item__modifications"
            >
              <div
                v-if="spell.concentration"
                v-tippy-lazy="{ content: 'Концентрация' }"
                class="link-item__modification"
              >
                К
              </div>

              <div
                v-if="spell.ritual"
                v-tippy-lazy="{ content: 'Ритуал' }"
                class="link-item__modification"
              >
                Р
              </div>
            </div>

            <div
              v-capitalize-first
              class="link-item__school"
            >
              {{ spell.school }}
            </div>

            <div class="link-item__components">
              <div
                v-tippy-lazy="{
                  content: 'Вербальный',
                  onShow() {
                    return !!spell.components?.v;
                  },
                }"
                class="link-item__component"
              >
                {{ spell?.components?.v ? 'В' : '·' }}
              </div>

              <div
                v-tippy-lazy="{
                  content: 'Соматический',
                  onShow() {
                    return !!spell.components?.s;
                  },
                }"
                class="link-item__component"
              >
                {{ spell?.components?.s ? 'С' : '·' }}
              </div>

              <div
                v-tippy-lazy="{
                  content: 'Материальный',
                  onShow() {
                    return !!spell.components?.m;
                  },
                }"
                class="link-item__component"
              >
                {{ !!spell?.components?.m ? 'М' : '·' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  </router-link>

  <base-modal
    v-if="modal.data"
    v-model="modal.show"
  >
    <template #title>
      {{ modal.data!.name.rus }}
    </template>

    <template #topButtons>
      <bookmark-save-button v-bind="bookmarkObj" />
    </template>

    <template #default>
      <spell-body :spell="modal.data" />
    </template>
  </base-modal>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/link-item' as *;

  .link-item {
    &__lvl {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      width: 42px;
      height: 42px;
      margin-right: 12px;
      margin-left: -8px;

      font-size: 17px;
      color: var(--text-color);
      text-align: center;

      border-right: 1px solid var(--border);
    }

    &__modifications {
      display: flex;
      margin-right: 8px;
    }

    &__modification {
      padding: 0 6px;

      font-size: calc(var(--main-font-size) - 1px);
      line-height: normal;
      color: var(--text-color);

      background-color: var(--bg-sub-menu);
      border: 1px solid var(--border);
      border-radius: 6px;

      & + & {
        margin-left: 4px;
      }
    }

    &__school {
      overflow: hidden;

      font-size: calc(var(--main-font-size) - 1px);
      line-height: normal;
      color: var(--text-g-color);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__components {
      display: flex;
      margin-left: auto;
    }

    &__component {
      width: 12px;

      font-size: calc(var(--main-font-size) - 1px);
      line-height: normal;
      color: var(--text-color);
      text-align: center;

      & + & {
        margin-left: 4px;
      }
    }

    &.router-link-active {
      .link-item {
        &__lvl,
        &__modification,
        &__school,
        &__component {
          color: var(--text-btn-color);
        }
      }
    }
  }
</style>
