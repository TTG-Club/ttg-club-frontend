<script lang="ts">
  import { computed, defineComponent, ref } from 'vue';
  import { useLink } from 'vue-router';

  import { httpClient } from '@/shared/api';
  import { CapitalizeFirst } from '@/shared/directives/CapitalizeFirst';
  import type {
    OptionDetail,
    OptionLink,
  } from '@/shared/types/character/Options.d';
  import type { Maybe } from '@/shared/types/Utility';
  import BaseModal from '@/shared/ui/modals/BaseModal.vue';

  import BookmarkSaveButton from '@/features/bookmarks/components/buttons/BookmarkSaveButton.vue';

  import OptionBody from '@/pages/character/options/options-detail/OptionBody.vue';

  import type { PropType } from 'vue';
  import type { RouteLocationPathRaw } from 'vue-router';

  export default defineComponent({
    components: {
      BookmarkSaveButton,
      OptionBody,
      BaseModal,
    },
    directives: {
      CapitalizeFirst,
    },
    inheritAttrs: false,
    props: {
      to: {
        type: Object as PropType<RouteLocationPathRaw>,
        required: true,
      },
      optionItem: {
        type: Object as PropType<OptionLink>,
        default: null,
      },
      inTab: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const { navigate, isActive, href } = useLink(props);

      const modal = ref<{
        show: boolean;
        data: Maybe<OptionDetail>;
      }>({
        show: false,
        data: undefined,
      });

      const bookmarkObj = computed(() => ({
        url: props.optionItem.url,
        name: props.optionItem.name.rus,
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
            const resp = await httpClient.post<OptionDetail>({
              url: props.optionItem.url,
            });

            modal.value.data = resp.data;
          }

          modal.value.show = true;
        } catch (err) {
          console.error(err);
        }
      };

      return {
        href,
        modal,
        bookmarkObj,
        classList,
        clickHandler,
      };
    },
  });
</script>

<template>
  <router-link
    v-if="optionItem"
    :to="{ path: optionItem.url }"
    custom
    v-bind="$props"
  >
    <a
      ref="optionItem"
      :class="classList"
      :href="href"
      class="link-item"
      v-bind="$attrs"
      @click.left.exact.prevent="clickHandler"
    >
      <div class="link-item__content">
        <div class="link-item__body">
          <div class="link-item__row">
            <div class="link-item__name">
              <span class="link-item__name--rus">
                {{ optionItem.name.rus }}
              </span>

              <span class="link-item__name--eng">
                [{{ optionItem.name.eng }}]
              </span>
            </div>

            <div
              v-if="optionItem.source.group"
              v-tippy-lazy="{
                content: optionItem.source.group.name,
                touch: true,
              }"
              :style="{
                '--source-group-color': `var(--badge-${optionItem.source.group.shortName.toLowerCase()})`,
              }"
              class="link-item__source"
            >
              {{ optionItem.source.group.shortName }}
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
      {{ modal.data?.name.rus || '' }}
    </template>

    <template #topButtons>
      <bookmark-save-button v-bind="bookmarkObj" />
    </template>

    <template #default>
      <option-body :option="modal.data" />
    </template>
  </base-modal>
</template>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
