<script setup lang="ts">
  import { Icon } from '@iconify/vue';
  import { useToast } from 'vue-toastification';

  import { useUserStore } from '@/shared/stores/UserStore';
  import { getPlural } from '@/shared/utils/string';
  import { ToastEventBus } from '@/shared/utils/toast';

  import { ConfirmDialog } from '@/features/initiative/ui-kit';

  import { useCommentTimestamp } from '../composables';
  import {
    COMMENT_ACTIONS_MENU_LABEL,
    COMMENT_COPY_LINK_ERROR_TOAST,
    COMMENT_COPY_LINK_LABEL,
    COMMENT_COPY_LINK_SUCCESS_TOAST,
    COMMENT_DELETE_BRANCH_WARNING,
    COMMENT_DELETE_CONFIRM_LABEL,
    COMMENT_DELETE_DIALOG_TITLE,
    COMMENT_DELETE_IRREVERSIBLE_WARNING,
    COMMENT_DELETE_MENU_LABEL,
    COMMENT_EDIT_LABEL,
    COMMENT_EDIT_PLACEHOLDER,
    COMMENT_EDIT_SUBMIT_LABEL,
    COMMENT_EDITED_MARK,
    COMMENT_OWN_BADGE_LABEL,
    COMMENT_REPLIES_HIDE_LABEL,
    COMMENT_REPLIES_PLURAL_FORMS,
    COMMENT_REPLIES_SHOW_LABEL,
    COMMENT_REPLY_LABEL,
    COMMENT_REPLY_PLACEHOLDER_PREFIX,
    COMMENT_REPLY_TO_PREFIX,
    COMMENT_REPORT_LABEL,
    COMMENT_REPORTED_LABEL,
    COMMENT_SHOW_PARENT_LABEL,
    COMMENT_TOMBSTONE_TEXT,
    countCommentDescendants,
    getCommentAnchorId,
    getCommentAuthorInitial,
    hasServerReplyTotal,
    isCommentTombstone,
  } from '../model';

  import CommentComposer from './CommentComposer.vue';
  import CommentTombstone from './CommentTombstone.vue';

  import type { CommentNode, CommentTreeActions } from '../model';
  import type { DropdownOption } from 'naive-ui';

  const {
    node,
    actions,
    replyToName = null,
    highlightedCommentId = null,
  } = defineProps<{
    node: CommentNode;
    actions: CommentTreeActions;
    /** Имя автора родителя — приходит от ветки, см. `CommentThread`. */
    replyToName?: string | null;
    /** Комментарий, подсвеченный после перехода по якорной ссылке. */
    highlightedCommentId?: string | null;
  }>();

  const toast = useToast(ToastEventBus);
  const userStore = useUserStore();

  const { isEditor } = storeToRefs(userStore);

  const { copy, isSupported } = useClipboard({ legacy: true });

  const { createdLabel, createdFullLabel, editedTooltip } = useCommentTimestamp(
    () => node.comment,
  );

  /** DOM-якорь карточки — для ссылок вида `#comment-<id>`. */
  const anchorId = computed(() => getCommentAnchorId(node.comment.id));

  const isHighlighted = computed(
    () => highlightedCommentId === node.comment.id,
  );

  /**
   * Комментарий с содержимым; `null` — это надгробие, и вместо карточки
   * рисуется заглушка (`CommentTombstone`). Автора и текста у неё нет, а
   * ответ, жалоба и правка по ней возвращают 409 — поэтому действия
   * скрываются, а не гасятся ошибкой с бэка.
   */
  const publishedComment = computed(() =>
    isCommentTombstone(node.comment) ? null : node.comment,
  );

  const isTombstone = computed(() => !publishedComment.value);

  const authorInitial = computed(() =>
    getCommentAuthorInitial(publishedComment.value?.authorName ?? null),
  );

  /**
   * Доступное имя карточки. Обычную называет автор и текст внутри, а у
   * заглушки их нет — без явного имени она осталась бы в дереве доступности
   * безымянным `article`.
   */
  const articleLabel = computed(() =>
    isTombstone.value ? COMMENT_TOMBSTONE_TEXT : undefined,
  );

  /**
   * Подсказка в форме ответа — адресует автору, которому отвечают. Собирается
   * только при живом комментарии: опциональная цепочка внутри шаблонной строки
   * дала бы литеральное «Ответ для undefined».
   */
  const replyPlaceholder = computed(() =>
    publishedComment.value
      ? `${COMMENT_REPLY_PLACEHOLDER_PREFIX} ${publishedComment.value.authorName}`
      : '',
  );

  const isReplyOpen = ref(false);
  const isEditOpen = ref(false);
  const isDeleteOpen = ref(false);
  const isDeleting = ref(false);

  const isOwn = computed(() => actions.isOwnComment(node));

  /**
   * Гость обсуждение только читает: ответ и жалоба требуют входа (сервис
   * отвечает на них 401), поэтому такие действия ему не показываются —
   * приглашение войти стоит под лентой, на месте формы отправки.
   */
  const canComment = computed(() => actions.canComment());

  /**
   * Правка и удаление доступны автору, модераторам и администраторам
   * (те же правила проверяет и сам сервис).
   */
  const canManageComment = computed(() => isOwn.value || isEditor.value);

  const isReported = computed(() => actions.isCommentReported(node.comment.id));

  /**
   * Имя автора, которому отвечает комментарий. Берём из ветки, а при её
   * отсутствии (узел без отрисованного родителя) — из серверного
   * `parentAuthorName`. У ответа на надгробие имени нет: сервис его не
   * раскрывает, пока родителя не восстановят.
   */
  const replyToAuthorName = computed(
    () => replyToName ?? node.comment.parentAuthorName,
  );

  /** Подпись «кому ответили» видна на каждом ответе. */
  const showReplyTo = computed(() => !!replyToAuthorName.value);

  const deleteDescription = computed(() =>
    node.comment.replyCount > 0
      ? COMMENT_DELETE_BRANCH_WARNING
      : COMMENT_DELETE_IRREVERSIBLE_WARNING,
  );

  /**
   * Все потомки ветки (включая ответы на ответы). До загрузки ветки сервис
   * сообщает только прямых детей — после первой загрузки число уточняется.
   */
  const repliesTotal = computed(() => countCommentDescendants(node));

  /**
   * Кнопка ответов рядом с «Ответить»: догрузка ещё не загруженной ветки
   * (в том числе хвоста за предохранителем глубины) либо свёртка и развёртка
   * уже загруженной — доступна на любом уровне вложенности.
   */
  const showRepliesToggle = computed(() => repliesTotal.value > 0);

  const repliesToggleLabel = computed(() => {
    if (node.repliesLoaded && node.repliesExpanded) {
      return COMMENT_REPLIES_HIDE_LABEL;
    }

    // Точное число известно из загруженной ветки либо из серверного
    // totalReplyCount; старые сборки сервиса его не присылают — тогда до
    // загрузки ветки число не показываем, чтобы не врать (replyCount
    // считает только прямых детей).
    if (node.repliesLoaded || hasServerReplyTotal(node.comment)) {
      return `${repliesTotal.value} ${getPlural(repliesTotal.value, COMMENT_REPLIES_PLURAL_FORMS)}`;
    }

    return COMMENT_REPLIES_SHOW_LABEL;
  });

  const repliesToggleIcon = computed(() =>
    node.repliesLoaded && node.repliesExpanded
      ? 'tabler:chevron-up'
      : 'tabler:chevron-down',
  );

  /** Кнопка ответа: отвечают живому комментарию и только авторизованные. */
  const showReplyButton = computed(
    () => !isTombstone.value && canComment.value,
  );

  /**
   * Форма ответа. Открытой она могла остаться с того момента, когда
   * комментарий был живым, а пользователь — авторизованным: фоновая
   * пересборка ветки сохраняет инстанс карточки (ключ — id), а сам
   * комментарий подменяет надгробием; выход же гасит право писать,
   * не трогая дерево.
   */
  const showReplyForm = computed(
    () => isReplyOpen.value && showReplyButton.value,
  );

  /**
   * Форма правки — по той же причине, что и форма ответа: выход из аккаунта
   * не размонтирует карточку (дерево остаётся на месте, гасится только право
   * писать), и без проверки гость дошёл бы до отправки и получил 401. Сам
   * `isEditOpen` не сбрасываем: после повторного входа правка вернётся
   * вместе с набранным текстом.
   */
  const showEditForm = computed(
    () => isEditOpen.value && canManageComment.value,
  );

  /**
   * Ряд действий под карточкой. У надгробия он сводится к кнопке ветки
   * (отвечать самой заглушке нельзя), у обычной карточки прячется на время
   * правки — форма занимает его место. У гостя от ряда остаётся только ветка
   * ответов: без неё рисовать пустую полосу незачем.
   */
  const showFooter = computed(() => {
    if (isTombstone.value) {
      return showRepliesToggle.value;
    }

    return (
      !showEditForm.value && (showRepliesToggle.value || showReplyButton.value)
    );
  });

  // Диалог удаления, в отличие от форм, закрываем по-настоящему: право
  // управлять комментарием может погаснуть, пока он открыт (выход из
  // аккаунта, снятие роли), а подтверждение ушло бы в 401. Возвращать его
  // после повторного входа незачем — подтверждение удаления не черновик.
  // Цикла нет: вотчер меняет только локальный флаг, на права он не влияет.
  watch(canManageComment, (canManage) => {
    if (!canManage) {
      isDeleteOpen.value = false;
    }
  });

  function handleToggleReplies(): void {
    actions.toggleReplies(node);
  }

  /** Действие карточки: пункт меню «⋯» на сенсорных, иконка-кнопка с мышью. */
  interface CommentCardAction {
    key: string;
    label: string;
    icon: string;
    danger?: boolean;
    disabled?: boolean;
    handler?: () => void;
  }

  /**
   * Копирует якорную ссылку на комментарий — на каноническую страницу
   * обсуждения (в боковой панели текущий адрес может быть адресом списка).
   */
  async function copyCommentLink(): Promise<void> {
    if (!isSupported.value) {
      toast.error(COMMENT_COPY_LINK_ERROR_TOAST);

      return;
    }

    try {
      await copy(actions.getCommentLink(node.comment.id));

      toast.success(COMMENT_COPY_LINK_SUCCESS_TOAST);
    } catch {
      toast.error(COMMENT_COPY_LINK_ERROR_TOAST);
    }
  }

  function handleCopyLink(): void {
    copyCommentLink();
  }

  /**
   * Скроллит к родительскому комментарию и коротко подсвечивает его —
   * родитель видимого ответа всегда отрисован (его ветка раскрыта).
   */
  function showParentComment(): void {
    const { parentId } = node.comment;

    if (parentId) {
      actions.highlightComment(parentId);
    }
  }

  function openEdit(): void {
    isEditOpen.value = true;
    isReplyOpen.value = false;
  }

  function closeEdit(): void {
    isEditOpen.value = false;
  }

  function openDelete(): void {
    isDeleteOpen.value = true;
  }

  function toggleReply(): void {
    isReplyOpen.value = !isReplyOpen.value;
    isEditOpen.value = false;
  }

  function closeReply(): void {
    isReplyOpen.value = false;
  }

  function handleReport(): void {
    actions.submitReport(node);
  }

  /** Доступные действия карточки — общий источник для меню и ряда иконок. */
  const cardActions = computed<CommentCardAction[]>(() => {
    const availableActions: CommentCardAction[] = [
      {
        key: 'copy-link',
        label: COMMENT_COPY_LINK_LABEL,
        icon: 'tabler:link',
        handler: handleCopyLink,
      },
    ];

    if (node.comment.parentId) {
      availableActions.push({
        key: 'show-parent',
        label: COMMENT_SHOW_PARENT_LABEL,
        icon: 'tabler:corner-left-up',
        handler: showParentComment,
      });
    }

    if (canManageComment.value) {
      availableActions.push(
        {
          key: 'edit',
          label: COMMENT_EDIT_LABEL,
          icon: 'tabler:pencil',
          handler: openEdit,
        },
        {
          key: 'delete',
          label: COMMENT_DELETE_MENU_LABEL,
          icon: 'tabler:trash',
          danger: true,
          handler: openDelete,
        },
      );

      return availableActions;
    }

    if (!canComment.value) {
      return availableActions;
    }

    if (isReported.value) {
      availableActions.push({
        key: 'reported',
        label: COMMENT_REPORTED_LABEL,
        icon: 'tabler:flag',
        disabled: true,
      });

      return availableActions;
    }

    availableActions.push({
      key: 'report',
      label: COMMENT_REPORT_LABEL,
      icon: 'tabler:flag',
      danger: true,
      handler: handleReport,
    });

    return availableActions;
  });

  const menuOptions = computed<DropdownOption[]>(() =>
    cardActions.value.map((action) => ({
      key: action.key,
      label: action.label,
      disabled: action.disabled,
      icon: () => h(Icon, { icon: action.icon }),
    })),
  );

  /**
   * Запускает действие карточки по ключу из выпадающего меню.
   *
   * @param key Ключ выбранного пункта.
   */
  function handleMenuSelect(key: string): void {
    cardActions.value.find((action) => action.key === key)?.handler?.();
  }

  /**
   * Запускает действие карточки из ряда иконок.
   *
   * @param action Действие карточки.
   */
  function runCardAction(action: CommentCardAction): void {
    action.handler?.();
  }

  async function confirmDelete(): Promise<void> {
    isDeleting.value = true;

    try {
      const success = await actions.removeComment(node);

      if (success) {
        isDeleteOpen.value = false;
      }
    } finally {
      isDeleting.value = false;
    }
  }

  function handleConfirmDelete(): void {
    confirmDelete();
  }

  function submitReplyAction(content: string): Promise<boolean> {
    return actions.submitReply(node, content);
  }

  function submitEditAction(content: string): Promise<boolean> {
    return actions.submitEdit(node, content);
  }
</script>

<template>
  <article
    :id="anchorId"
    class="comment-card"
    :class="{ 'is-highlighted': isHighlighted }"
    :aria-label="articleLabel"
  >
    <comment-tombstone
      v-if="isTombstone"
      :node="node"
      :actions="actions"
      :reply-to-name="replyToName"
    />

    <template v-else>
      <!-- На узких экранах мета-блок (бейдж, время, меню) уходит под имя -->
      <header class="comment-card__header">
        <n-avatar
          round
          size="small"
        >
          {{ authorInitial }}
        </n-avatar>

        <div class="comment-card__identity">
          <span class="comment-card__author">
            {{ publishedComment?.authorName }}
          </span>

          <div class="comment-card__meta">
            <n-tag
              v-if="isOwn"
              size="tiny"
              :bordered="false"
            >
              {{ COMMENT_OWN_BADGE_LABEL }}
            </n-tag>

            <n-tooltip
              v-if="createdLabel"
              trigger="hover"
            >
              <template #trigger>
                <time
                  class="comment-card__time"
                  :datetime="node.comment.createdAt"
                >
                  {{ createdLabel }}
                </time>
              </template>

              {{ createdFullLabel }}
            </n-tooltip>

            <n-tooltip
              v-if="node.comment.editedAt"
              trigger="hover"
            >
              <template #trigger>
                <span class="comment-card__edited">
                  {{ COMMENT_EDITED_MARK }}
                </span>
              </template>

              {{ editedTooltip }}
            </n-tooltip>

            <!--
              С мышью (точный указатель) действия — ряд иконок с подсказками,
              проявляющийся при наведении на карточку и при фокусе
              с клавиатуры. На сенсорных экранах ховера нет — там остаётся
              меню «⋯».
            -->
            <div class="comment-card__actions">
              <n-tooltip
                v-for="action in cardActions"
                :key="action.key"
                trigger="hover"
              >
                <template #trigger>
                  <n-button
                    quaternary
                    size="tiny"
                    :type="action.danger ? 'error' : 'default'"
                    :disabled="action.disabled"
                    :aria-label="action.label"
                    @click.left.exact.prevent="runCardAction(action)"
                  >
                    <template #icon>
                      <icon :icon="action.icon" />
                    </template>
                  </n-button>
                </template>

                {{ action.label }}
              </n-tooltip>
            </div>

            <n-dropdown
              trigger="click"
              :options="menuOptions"
              @select="handleMenuSelect"
            >
              <n-button
                class="comment-card__menu-trigger"
                quaternary
                size="tiny"
                :aria-label="COMMENT_ACTIONS_MENU_LABEL"
              >
                <template #icon>
                  <icon icon="tabler:dots-vertical" />
                </template>
              </n-button>
            </n-dropdown>
          </div>
        </div>
      </header>

      <p
        v-if="showReplyTo"
        class="comment-card__reply-to"
      >
        <icon icon="tabler:arrow-back-up" />

        {{ COMMENT_REPLY_TO_PREFIX }} {{ replyToAuthorName }}
      </p>

      <!-- Контент рендерится текстом: сервис не санитизирует ввод -->
      <p
        v-if="!showEditForm"
        class="comment-card__content"
      >
        {{ publishedComment?.content }}
      </p>

      <comment-composer
        v-else
        :initial-content="publishedComment?.content"
        :placeholder="COMMENT_EDIT_PLACEHOLDER"
        :submit-label="COMMENT_EDIT_SUBMIT_LABEL"
        cancellable
        autofocus
        :with-cooldown="false"
        :submit-action="submitEditAction"
        @done="closeEdit"
        @cancel="closeEdit"
      />
    </template>

    <footer
      v-if="showFooter"
      class="comment-card__footer"
    >
      <n-button
        v-if="showRepliesToggle"
        quaternary
        size="tiny"
        type="primary"
        :loading="node.repliesLoading"
        @click.left.exact.prevent="handleToggleReplies"
      >
        <template #icon>
          <icon :icon="repliesToggleIcon" />
        </template>

        {{ repliesToggleLabel }}
      </n-button>

      <n-button
        v-if="showReplyButton"
        quaternary
        size="tiny"
        @click.left.exact.prevent="toggleReply"
      >
        <template #icon>
          <icon icon="tabler:arrow-back-up" />
        </template>

        {{ COMMENT_REPLY_LABEL }}
      </n-button>
    </footer>

    <comment-composer
      v-if="showReplyForm"
      :placeholder="replyPlaceholder"
      :submit-label="COMMENT_REPLY_LABEL"
      cancellable
      autofocus
      :submit-action="submitReplyAction"
      @done="closeReply"
      @cancel="closeReply"
    />

    <confirm-dialog
      v-model:open="isDeleteOpen"
      :title="COMMENT_DELETE_DIALOG_TITLE"
      :description="deleteDescription"
      :confirm-label="COMMENT_DELETE_CONFIRM_LABEL"
      confirm-color="error"
      confirm-icon="tabler:trash"
      :loading="isDeleting"
      @confirm="handleConfirmDelete"
    />
  </article>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/mixins' as *;

  .comment-card {
    scroll-margin-top: 96px;

    display: flex;
    flex-direction: column;
    gap: 6px;

    margin: 0 -8px;
    padding: 0 8px;

    // Подсветка перехода по якорю: фон появляется мгновенно, а при снятии
    // подсветки плавно угасает.
    background-color: transparent;
    border-radius: 8px;

    transition: background-color 1s ease;

    &.is-highlighted {
      background-color: var(--hover);
      transition: none;
    }

    &__header {
      display: flex;
      gap: 8px;
      align-items: flex-start;

      @include media-min($sm) {
        align-items: center;
      }
    }

    &__identity {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      gap: 4px;

      min-width: 0;

      @include media-min($sm) {
        flex-direction: row;
        gap: 8px;
        align-items: center;
      }
    }

    &__author {
      overflow: hidden;

      min-width: 0;

      font-weight: 600;
      color: var(--text-color-title);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__meta {
      display: flex;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }

    &__time {
      font-size: 12px;
      color: var(--text-g-color);
      white-space: nowrap;
    }

    &__edited {
      font-size: 12px;
      color: var(--text-g-color);
    }

    &__actions {
      display: none;
      gap: 2px;
      align-items: center;

      opacity: 0;

      transition: opacity 0.2s ease;

      // С мышью ряд иконок заменяет меню «⋯»: он проявляется при наведении
      // на карточку и при фокусе с клавиатуры.
      @media (pointer: fine) {
        display: flex;
      }
    }

    &:hover &__actions,
    &__actions:focus-within {
      opacity: 1;
    }

    &__menu-trigger {
      @media (pointer: fine) {
        display: none;
      }
    }

    &__reply-to {
      display: flex;
      gap: 4px;
      align-items: center;

      margin: 0;

      font-size: 12px;
      color: var(--text-g-color);
    }

    &__content {
      margin: 0;

      font-size: var(--main-font-size);
      color: var(--text-color);
      overflow-wrap: break-word;
      white-space: pre-line;
    }

    &__footer {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
    }
  }
</style>
