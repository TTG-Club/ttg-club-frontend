<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import { SectionLayout } from '~section/layout';

  import { useTokenator } from './composables';
  import {
    TOKEN_FORMATS,
    TOKEN_SCALE,
    TOKENATOR_ICON,
    TOKENATOR_TEXT,
  } from './model';
  import TokenatorStamp from './TokenatorStamp.vue';

  /**
   * Токенатор: картинка в круглой рамке для виртуального стола. Всё
   * происходит в браузере, на сервер ничего не уходит.
   */
  const { hasImage, scale, setScale, center, toggleMirror, open, download } =
    useTokenator();

  const [defaultFormat] = TOKEN_FORMATS;

  const scaleModel = computed({
    get: () => scale.value,
    set: setScale,
  });

  const formatItems = computed<Array<DropdownMenuItem>>(() =>
    TOKEN_FORMATS.map((format) => ({
      label: format.label,
      onSelect: () => download(format.value),
    })),
  );

  function downloadDefault(): void {
    download(defaultFormat.value);
  }
</script>

<template>
  <SectionLayout
    :title="TOKENATOR_TEXT.title"
    is-full-width
  >
    <template #controls>
      <div class="flex flex-col gap-4">
        <UFormField :label="TOKENATOR_TEXT.scale">
          <USlider
            v-model="scaleModel"
            :min="TOKEN_SCALE.min"
            :max="TOKEN_SCALE.max"
            :step="TOKEN_SCALE.step"
            :disabled="!hasImage"
          />
        </UFormField>

        <div class="flex flex-wrap gap-2">
          <UButton
            :icon="TOKENATOR_ICON.mirror"
            :label="TOKENATOR_TEXT.mirror"
            :disabled="!hasImage"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="toggleMirror"
          />

          <UButton
            :icon="TOKENATOR_ICON.center"
            :label="TOKENATOR_TEXT.center"
            :disabled="!hasImage"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="center"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            :icon="TOKENATOR_ICON.upload"
            :label="TOKENATOR_TEXT.upload"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="open"
          />

          <UFieldGroup>
            <UButton
              :icon="TOKENATOR_ICON.download"
              :label="TOKENATOR_TEXT.download"
              :disabled="!hasImage"
              @click.left.exact.prevent="downloadDefault"
            />

            <UDropdownMenu
              :items="formatItems"
              :disabled="!hasImage"
            >
              <UButton
                :icon="TOKENATOR_ICON.format"
                :aria-label="TOKENATOR_TEXT.downloadFormat"
                :disabled="!hasImage"
              />
            </UDropdownMenu>
          </UFieldGroup>
        </div>

        <div class="flex flex-col gap-1 text-sm text-muted">
          <p>{{ TOKENATOR_TEXT.hint }}</p>

          <p>{{ TOKENATOR_TEXT.sizeLimit }}</p>

          <p>{{ TOKENATOR_TEXT.dimensionLimit }}</p>
        </div>
      </div>
    </template>

    <div class="flex justify-center py-6">
      <ClientOnly>
        <TokenatorStamp />
      </ClientOnly>
    </div>
  </SectionLayout>
</template>
