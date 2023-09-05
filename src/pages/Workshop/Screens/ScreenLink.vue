<template>
  <router-link
    custom
    v-bind="$props"
  >
    <a
      :href="href"
      class="screen-link"
      v-bind="$attrs"
      @click.left.exact.prevent="clickHandler"
    >
      <div class="screen-link__icon">
        <raw-content :template="screen.icon" />
      </div>

      <div class="screen-link__body">
        <div class="screen-link__name">
          {{ screen.name.rus }}
        </div>

        <div class="screen-link__desc">
          <span v-tippy-lazy="{ content: screen.source.name }">{{
            screen.source.shortName
          }}</span>

          / <span>{{ screen.name.eng }}</span>
        </div>
      </div>
    </a>
  </router-link>

  <base-modal
    v-if="modal.data"
    v-model="modal.show"
    :bookmark="bookmarkObj"
  >
    <template #title>
      {{ screen.name.rus }}
    </template>

    <template #default>
      <screen-body :screen="modal.data" />
    </template>
  </base-modal>
</template>

<script lang="ts">
  import { computed, defineComponent, ref } from 'vue';
  import { useLink } from 'vue-router';

  import ScreenBody from '@/pages/Workshop/Screens/ScreenBody.vue';

  import { useAxios } from '@/shared/compositions/useAxios';
  import { errorHandler } from '@/shared/helpers/errorHandler';
  import type { Maybe } from '@/shared/types/Utility';
  import type {
    IScreenItem,
    IScreenLink
  } from '@/shared/types/Workshop/Screens.d';
  import RawContent from '@/shared/ui/content/RawContent.vue';
  import BaseModal from '@/shared/ui/modals/BaseModal.vue';

  import type { PropType } from 'vue';
  import type { RouteLocationPathRaw } from 'vue-router';

  export default defineComponent({
    components: {
      ScreenBody,
      BaseModal,
      RawContent
    },
    inheritAttrs: false,
    props: {
      to: {
        type: Object as PropType<RouteLocationPathRaw>,
        required: true
      },
      screen: {
        type: Object as PropType<IScreenLink>,
        default: () => ({}),
        required: true
      }
    },
    setup(props) {
      const http = useAxios();
      const { href } = useLink(props);

      const modal = ref<{
        show: boolean;
        data: Maybe<IScreenItem>;
      }>({
        data: undefined,
        show: false
      });

      const error = ref(false);
      const loading = ref(false);
      const abortController = ref<AbortController | null>(null);

      const screenInfoQuery = async () => {
        if (abortController.value) {
          abortController.value.abort();
        }

        try {
          error.value = false;
          loading.value = true;
          abortController.value = new AbortController();

          const resp = await http.post<IScreenItem>({
            url: href.value,
            signal: abortController.value.signal
          });

          return resp.data;
        } catch (err) {
          errorHandler(err);

          error.value = true;

          return undefined;
        } finally {
          loading.value = false;
          abortController.value = null;
        }
      };

      const clickHandler = async () => {
        try {
          if (!modal.value.data) {
            modal.value.data = await screenInfoQuery();
          }

          modal.value.show = true;
        } catch (err) {
          errorHandler(err);
        }
      };

      return {
        href,
        modal,
        bookmarkObj: computed(() => ({
          url: props.screen.url,
          name: props.screen.name.rus
        })),
        clickHandler
      };
    }
  });
</script>

<style lang="scss" scoped>
  .screen-link {
    @include css_anim();

    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
    background-color: var(--bg-secondary);
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 8px;

    &:hover {
      background-color: var(--hover);
    }

    &__icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;

      :deep(svg) {
        width: 100% !important;
        height: 100% !important;

        path {
          fill: var(--primary);
        }
      }
    }

    &__body {
      margin-left: 12px;
    }

    &__name {
      font-weight: 600;
      font-size: var(--h5-font-size);
      color: var(--text-color-title);
    }

    &__desc {
      font-weight: 400;
      // margin-top: 12px;
      font-size: var(--main-font-size);
      line-height: var(--main-line-height);
      color: var(--text-color);
    }
  }
</style>
