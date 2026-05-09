<script setup lang="ts">
  import { orderBy } from 'lodash-es';

  import { useNavPopover } from '@/shared/composable/useNavPopover';
  import type { TNavItem } from '@/shared/stores/NavStore';
  import { useNavStore } from '@/shared/stores/NavStore';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import OurPartners from '@/shared/ui/OurPartners.vue';

  import { useOnlineAdventurersCounter } from '@/features/online-counter/useOnlineAdventurersCounter';
  import YoutubeBlock from '@/features/youtube/components/YoutubeBlock.vue';

  const navStore = useNavStore();

  const { navItems, showedNavItems } = storeToRefs(navStore);

  const { isShowSearch } = useNavPopover();

  const {
    adventurersCount,
    isAdventurersCounterLoading,
    refreshAdventurersCounter,
  } = useOnlineAdventurersCounter();

  const mainNavItems = computed(() => {
    const items: TNavItem[] = [];

    const iterate = (childList: TNavItem[]) => {
      for (const child of childList) {
        if (child.children instanceof Array && child.children.length) {
          iterate(child.children);
        }

        if (child.onIndex) {
          items.push(child);
        }
      }
    };

    iterate(showedNavItems.value);

    return orderBy(items, ['indexOrder'], ['asc']);
  });

  const tools = computed<TNavItem[]>(() => {
    const navTools = navItems.value
      .flatMap((group) => group.children || [])
      .filter((item): item is TNavItem => !!item?.url?.startsWith('/tools'));

    return orderBy(navTools, ['order'], ['asc']);
  });

  const openSearchModal = () => {
    isShowSearch.value = true;
  };

  const adventurersCountLabel = computed(() =>
    new Intl.NumberFormat('ru-RU').format(adventurersCount.value),
  );

  onMounted(() => {
    refreshAdventurersCounter().then(undefined);
  });
</script>

<template>
  <div class="main_page_wrapper">
    <h1 class="site-name">TTG.Club Oнлайн-справочник</h1>

    <div class="main_block">
      <div class="header">
        <p
          class="search_row_g"
          @click.left.exact.prevent="openSearchModal"
        >
          Нажмите
          <span class="computer_version"
            >&nbsp;тут или <span class="key">\</span>&nbsp;</span
          >для начала поиска
        </p>
      </div>

      <a
        href="//new.ttg.club"
        class="banner"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="title">Редакция D&D 2024</span>

        <img
          class="bg"
          alt="Баннер 2024 DnD"
          src="/img/banner-2024.webp"
        />
      </a>

      <div class="card_row">
        <router-link
          v-for="(section, key) in mainNavItems"
          :key="key"
          :to="{ path: section.url }"
          class="card"
        >
          <div class="title">
            <h4>{{ section.name }}</h4>
          </div>
        </router-link>
      </div>

      <div class="main-page-grid">
        <div class="main-page-grid__col left-col">
          <router-link
            to="/tools/tokenator"
            class="block token_library"
          >
            <div class="info">
              <p>Всегда под рукой!</p>

              <h4>Токенатор</h4>
            </div>

            <div class="bg_img" />
          </router-link>

          <router-link
            to="/info/discord_bot"
            class="block discord_bot"
          >
            <div class="info">
              <p>Весь сайт у вас на сервере!</p>

              <h4>Discord Bot</h4>
            </div>

            <div class="bg_img" />
          </router-link>

          <div class="links_block">
            <h3>Инструменты:</h3>

            <div class="list">
              <router-link
                v-for="(tool, key) in tools"
                :key="key"
                :to="{ path: tool.url }"
                class="chips tip w-100"
              >
                {{ tool.name }}
              </router-link>
            </div>
          </div>
        </div>

        <div class="main-page-grid__col center-col">
          <div class="youtube-block">
            <youtube-block />
          </div>
        </div>

        <div class="main-page-grid__col right-col">
          <div class="online-counter-card">
            <div class="online-counter-card__header">
              <span class="online-counter-card__indicator" />

              <h3>Статистика онлайн</h3>
            </div>

            <p>
              TTG - твой проводник в мир Dungeons & Dragons, созданный
              сообществом для сообщества!
            </p>

            <div class="online-counter-card__stats">
              <span>Авантюристов</span>

              <strong
                :class="{
                  'is-loading': isAdventurersCounterLoading,
                }"
              >
                {{ adventurersCountLabel }}
              </strong>
            </div>
          </div>

          <div class="index-social-links">
            <a
              href="https://t.me/ttgclubnews"
              target="_blank"
              rel="noopener noreferrer"
              class="index-social-btn is-telegram"
            >
              <svg-icon
                icon="telegram"
                :size="24"
              />

              <span>Telegram</span>
            </a>

            <a
              href="https://discord.gg/JqFKMKRtxv"
              target="_blank"
              rel="noopener noreferrer"
              class="index-social-btn is-discord"
            >
              <svg-icon
                icon="discord"
                :size="24"
              />

              <span>Discord</span>
            </a>

            <a
              href="https://vk.com/ttg.club"
              target="_blank"
              rel="noopener noreferrer"
              class="index-social-btn is-vk"
            >
              <svg-icon
                icon="vk"
                :size="24"
              />

              <span>ВКонтакте</span>
            </a>

            <a
              href="https://boosty.to/dnd5club"
              target="_blank"
              rel="noopener noreferrer"
              class="index-social-btn is-boosty"
            >
              <svg-icon
                icon="boosty"
                :size="24"
              />

              <span>Boosty</span>
            </a>
          </div>
        </div>

        <div class="main-page-grid__partners">
          <our-partners />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .site-name {
    overflow: hidden;
    height: 0;
    opacity: 0;
  }

  .banner {
    overflow: hidden;
    display: flex;
    align-items: center;

    width: 100%;
    height: 100px;

    background:
      radial-gradient(
          circle at 100% 100%,
          var(--bg-secondary) 0,
          var(--bg-secondary) 11px,
          transparent 11px
        )
        0 0 / 12px 12px no-repeat,
      radial-gradient(
          circle at 0 100%,
          var(--bg-secondary) 0,
          var(--bg-secondary) 11px,
          transparent 11px
        )
        100% 0 / 12px 12px no-repeat,
      radial-gradient(
          circle at 100% 0,
          var(--bg-secondary) 0,
          var(--bg-secondary) 11px,
          transparent 11px
        )
        0% 100% / 12px 12px no-repeat,
      radial-gradient(
          circle at 0 0,
          var(--bg-secondary) 0,
          var(--bg-secondary) 11px,
          transparent 11px
        )
        100% 100% / 12px 12px no-repeat,
      linear-gradient(var(--bg-secondary), var(--bg-secondary)) 50% 50% /
        calc(100% - 2px) calc(100% - 24px) no-repeat,
      linear-gradient(var(--bg-secondary), var(--bg-secondary)) 50% 50% /
        calc(100% - 24px) calc(100% - 2px) no-repeat,
      linear-gradient(135deg, var(--border-gradient) 0%, var(--border) 100%);
    border-radius: 12px;

    &:hover {
      .bg {
        transform: scale(1.15);
        transition: transform 0.6s;
      }
    }

    .title {
      position: absolute;

      width: 110px;
      margin-left: 36px;

      font-size: var(--h4-font-size);
      font-weight: 600;
      line-height: 28px;
      color: var(--text-color-title);
    }

    .bg {
      transform: scale(1);
      transition: transform 0.6s;
    }
  }

  .online-counter-card {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 12px;

    padding: 16px;

    color: var(--text-color);

    background:
      radial-gradient(
          circle at 100% 100%,
          var(--bg-secondary) 0,
          var(--bg-secondary) 11px,
          transparent 11px
        )
        0 0 / 12px 12px no-repeat,
      radial-gradient(
          circle at 0 100%,
          var(--bg-secondary) 0,
          var(--bg-secondary) 11px,
          transparent 11px
        )
        100% 0 / 12px 12px no-repeat,
      radial-gradient(
          circle at 100% 0,
          var(--bg-secondary) 0,
          var(--bg-secondary) 11px,
          transparent 11px
        )
        0% 100% / 12px 12px no-repeat,
      radial-gradient(
          circle at 0 0,
          var(--bg-secondary) 0,
          var(--bg-secondary) 11px,
          transparent 11px
        )
        100% 100% / 12px 12px no-repeat,
      linear-gradient(var(--bg-secondary), var(--bg-secondary)) 50% 50% /
        calc(100% - 2px) calc(100% - 24px) no-repeat,
      linear-gradient(var(--bg-secondary), var(--bg-secondary)) 50% 50% /
        calc(100% - 24px) calc(100% - 2px) no-repeat,
      linear-gradient(135deg, var(--border-gradient) 0%, var(--border) 100%);
    border-radius: 12px;
    box-shadow: 0 0.625rem 0.75rem 0 var(--card-shadow);

    &__header {
      display: flex;
      gap: 8px;
      align-items: center;

      h3 {
        margin: 0;

        font-family: 'Open Sans', sans-serif;
        font-size: var(--main-font-size);
        font-weight: 600;
        color: var(--success);
      }
    }

    &__indicator {
      width: 18px;
      height: 18px;

      background: linear-gradient(135deg, var(--success), var(--success-hover));
      border-radius: 5px;
      box-shadow: 0 0 10px var(--success);

      animation: online-counter-glow 2s ease-in-out infinite;
    }

    p {
      margin: 0;
      font-size: calc(var(--main-font-size) - 2px);
      line-height: calc(var(--main-line-height) - 2px);
    }

    &__stats {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;

      padding-top: 4px;

      span {
        font-size: calc(var(--main-font-size) - 2px);
        font-weight: 600;
        color: var(--text-g-color);
        text-transform: uppercase;
      }

      strong {
        font-size: 32px;
        line-height: 36px;
        color: var(--primary);
        transition: opacity 0.2s;

        &.is-loading {
          opacity: 0.55;
        }
      }
    }
  }

  @keyframes online-counter-glow {
    0%,
    100% {
      box-shadow: 0 0 8px var(--success);
    }

    50% {
      box-shadow: 0 0 16px var(--success-hover);
    }
  }

  .index-social-links {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .index-social-btn {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: center;

      width: 100%;
      height: 48px;

      font-size: var(--main-font-size);
      font-weight: 500;
      color: var(--text-color-title);
      text-decoration: none;

      opacity: 0.7;
      background-color: transparent;
      border: 1px solid transparent;
      border-radius: 8px;

      @include css-anim();

      &:deep(svg) {
        color: var(--text-btn-color);
        fill: var(--text-btn-color);
        transition: all 0.2s ease;
      }

      &:hover {
        opacity: 1;
      }

      &.is-telegram {
        border-color: var(--telegram-base);
        &:hover {
          background-color: rgba(36, 161, 222, 0.1);
        }
      }

      &.is-discord {
        border-color: var(--discord-base);
        &:hover {
          background-color: rgba(88, 101, 242, 0.1);
        }
      }

      &.is-vk {
        border-color: var(--vk-base);
        &:hover {
          background-color: rgba(0, 119, 255, 0.1);
        }
      }

      &.is-boosty {
        border-color: var(--boosty-base);
        &:hover {
          background-color: rgba(241, 95, 44, 0.1);
        }
      }
    }
  }
</style>
