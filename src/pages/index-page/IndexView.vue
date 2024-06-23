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
    height: 0;
    opacity: 0;
    overflow: hidden;
  }
</style>
