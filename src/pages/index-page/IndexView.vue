<script setup lang="ts">
  import { orderBy } from 'lodash-es';

  import { useNavPopover } from '@/shared/composable/useNavPopover';
  import type { TNavItem } from '@/shared/stores/NavStore';
  import { useNavStore } from '@/shared/stores/NavStore';
  import OurPartners from '@/shared/ui/OurPartners.vue';

  import YoutubeBlock from '@/features/youtube/components/YoutubeBlock.vue';

  const navStore = useNavStore();

  const { navItems, showedNavItems } = storeToRefs(navStore);

  const { isShowSearch } = useNavPopover();

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
      .flatMap((group) => group.children)
      .filter((item) => item.url?.startsWith('/tools'));

    return orderBy(navTools, ['order'], ['asc']);
  });

  const openSearchModal = () => {
    isShowSearch.value = true;
  };
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
        href="http://new.ttg.club"
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

      <div class="main-page-blocks">
        <div class="row">
          <div class="column">
            <div class="row">
              <div class="column">
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

                <router-link
                  to="/info/telegram_spells_bot"
                  class="block dnd5club_tel_bot"
                >
                  <div class="info">
                    <p>Книга заклинаний у вас в руках!</p>

                    <h4>Telegram Spells Bot</h4>
                  </div>

                  <div class="bg_img" />
                </router-link>
              </div>

              <div class="column">
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
            </div>

            <div class="row">
              <our-partners />
            </div>
          </div>

          <div class="column youtube-block">
            <youtube-block />
          </div>
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
        0% 0% / 12px 12px no-repeat,
      radial-gradient(
          circle at 0 100%,
          var(--bg-secondary) 0,
          var(--bg-secondary) 11px,
          transparent 11px
        )
        100% 0% / 12px 12px no-repeat,
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
</style>
