<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import type { TrackerParticipant } from '@/features/initiative/model';
  import { PARTICIPANT_TYPE_ICON } from '@/features/initiative/model';

  const { participant, image = undefined } = defineProps<{
    participant: TrackerParticipant;
    /** URL картинки существа из бестиария (для игроков — не задаётся). */
    image?: string;
  }>();

  defineEmits<{
    'image-error': [];
  }>();

  const isCreature = computed(() => participant.type === 'CREATURE');

  // Аббревиатура игрока: инициалы двух слов либо две первые буквы одного.
  const initials = computed(() => {
    const words = participant.name.trim().split(/\s+/).filter(Boolean);
    const first = words[0];

    if (!first) {
      return '?';
    }

    const second = words[1];

    const base = second
      ? first.charAt(0) + second.charAt(0)
      : first.slice(0, 2);

    return base.toUpperCase();
  });
</script>

<template>
  <!-- 44px — в высоту плиток статов строки, чтобы ряд был одной высоты. -->
  <div class="participant-avatar">
    <img
      v-if="isCreature && image"
      :src="image"
      alt=""
      loading="lazy"
      class="participant-avatar__image"
      @error="$emit('image-error')"
    />

    <icon
      v-else-if="isCreature"
      :icon="PARTICIPANT_TYPE_ICON.CREATURE"
      class="participant-avatar__icon"
    />

    <span
      v-else
      class="participant-avatar__initials"
    >
      {{ initials }}
    </span>
  </div>
</template>

<style scoped lang="scss">
  .participant-avatar {
    position: relative;

    overflow: hidden;
    display: grid;
    flex-shrink: 0;
    place-items: center;

    width: 44px;
    height: 44px;

    background-color: var(--bg-sub-menu);
    border: 1px solid var(--border);
    border-radius: 50%;

    &__image {
      position: absolute;
      inset: 0;

      width: 100%;
      height: 100%;

      object-fit: cover;
    }

    &__icon {
      width: 20px;
      height: 20px;
      color: var(--text-g-color);
    }

    &__initials {
      font-size: 12px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--text-g-color);
      text-transform: uppercase;
    }
  }
</style>
