<script lang="ts" setup>
  import { httpClient } from '@/shared/api';

  const props = withDefaults(
    defineProps<{
      template?: string;
      url?: string;
      tag?: string;
    }>(),
    {
      template: undefined,
      url: undefined,
      tag: 'div',
    },
  );

  const emit = defineEmits(['loaded', 'before-unmount']);

  const templateString = ref<string | null>(null);
  const error = ref(false);
  const loading = ref(true);

  const updateTemplate = async () => {
    if (!props.template && !props.url) {
      throw new Error('URL and template is not defined');
    }

    try {
      error.value = false;
      loading.value = true;

      templateString.value = props.template || '';

      if (!templateString.value && !props.template) {
        const { data } = await httpClient.rawGet({
          url: props.url,
        });

        templateString.value = data;
      }

      loading.value = false;

      return Promise.resolve();
    } catch (err) {
      error.value = true;
      loading.value = false;

      return Promise.reject(err);
    }
  };

  const render = computed(() => {
    if (loading.value) {
      return h(props.tag, null, 'Загрузка...');
    }

    if (error.value || !templateString.value) {
      return h(props.tag, null, 'Ошибка...');
    }

    return h(
      props.tag,
      null,
      h(
        defineComponent({
          mounted() {
            emit('loaded');
          },
          template: templateString.value,
        }),
      ),
    );
  });

  watch(
    [() => props.template, () => props.url],
    async () => {
      await updateTemplate();
    },
    {
      immediate: true,
    },
  );

  onBeforeUnmount(() => {
    emit('before-unmount');
  });
</script>

<template>
  <render />
</template>
