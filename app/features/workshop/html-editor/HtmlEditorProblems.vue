<script setup lang="ts">
  import type { HtmlProblem } from '../model';

  import {
    describeHtmlProblem,
    HTML_EDITOR_ICON,
    HTML_EDITOR_TEXT,
    MAX_VISIBLE_PROBLEMS,
  } from '../model';

  /**
   * Ошибки разметки, из-за которых бэкенд отклонит описание. Старые тексты
   * бывают сломаны, и без подсказки непонятно, почему форма не сохраняется.
   */
  const { problems, disabled = false } = defineProps<{
    problems: ReadonlyArray<HtmlProblem>;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    show: [problem: HtmlProblem];
    fix: [];
  }>();

  const visibleProblems = computed(() =>
    problems.slice(0, MAX_VISIBLE_PROBLEMS).map((problem) => ({
      problem,
      text: describeHtmlProblem(problem),
    })),
  );

  const hiddenText = computed(() => {
    const hidden = problems.length - MAX_VISIBLE_PROBLEMS;

    return hidden > 0 ? `${HTML_EDITOR_TEXT.moreProblems} ${hidden}` : '';
  });

  function handleShow(problem: HtmlProblem): void {
    emit('show', problem);
  }

  function handleFix(): void {
    emit('fix');
  }
</script>

<template>
  <div
    class="flex flex-col items-start gap-1.5 border-b border-error bg-error/10 px-3 py-2 text-sm"
    role="alert"
  >
    <p class="flex items-center gap-1.5 font-semibold text-error">
      <UIcon
        :name="HTML_EDITOR_ICON.problems"
        class="size-4"
      />

      {{ HTML_EDITOR_TEXT.problemsTitle }}
    </p>

    <ul class="flex flex-col gap-1">
      <li
        v-for="item in visibleProblems"
        :key="item.problem.start"
        class="flex flex-wrap items-center gap-x-2"
      >
        <span>{{ item.text }}</span>

        <UButton
          :label="HTML_EDITOR_TEXT.showProblem"
          variant="link"
          size="xs"
          class="p-0"
          @click.left.exact.prevent="handleShow(item.problem)"
        />
      </li>
    </ul>

    <p
      v-if="hiddenText"
      class="text-muted"
    >
      {{ hiddenText }}
    </p>

    <UTooltip :text="HTML_EDITOR_TEXT.fixProblemsHint">
      <UButton
        :label="HTML_EDITOR_TEXT.fixProblems"
        :icon="HTML_EDITOR_ICON.fix"
        :disabled="disabled"
        color="error"
        variant="subtle"
        size="xs"
        @click.left.exact.prevent="handleFix"
      />
    </UTooltip>
  </div>
</template>
