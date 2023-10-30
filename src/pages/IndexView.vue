<template>
  <div class="main_page_wrapper">
    <h1 style="height: 0; opacity: 0; overflow: hidden">
      TTG.Club Oнлайн-справочник
    </h1>

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
                <a
                  href="/info/discord_bot"
                  class="block token_library"
                >
                  <div class="info">
                    <p>Всегда под рукой!</p>

                    <h4>Библиотека токинов</h4>
                  </div>

                  <div class="bg_img" />
                </a>

                <a
                  href="/info/discord_bot"
                  class="block discord_bot"
                >
                  <div class="info">
                    <p>Весь сайт у вас на сервере!</p>

                    <h4>Discord Bot</h4>
                  </div>

                  <div class="bg_img" />
                </a>

                <a
                  href="/info/telegram_spells_bot"
                  class="block dnd5club_tel_bot"
                >
                  <div class="info">
                    <p>Книга заклинаний у вас в руках!</p>

                    <h4>Telegram Spells Bot</h4>
                  </div>

                  <div class="bg_img" />
                </a>
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
              <div
                v-if="showedPartners.length"
                class="row"
              >
                <div class="links_block">
                  <h3>Наши друзья:</h3>

                  <div class="list">
                    <a
                      v-for="(partner, key) in showedPartners"
                      :key="key"
                      v-tippy="{
                        content: partner.description
                      }"
                      :href="partner.url"
                      class="chips tip"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <img
                        :alt="partner.name"
                        :src="partner.img"
                        height="20px"
                        width="20px"
                      />
                      {{ partner.name }}
                    </a>
                  </div>
                </div>
              </div>
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

<script setup lang="ts">
  import { orderBy } from 'lodash-es';
  import { storeToRefs } from 'pinia';
  import { computed } from 'vue';

  import YoutubeBlock from '@/features/youtube/components/YoutubeBlock.vue';

  import type { TNavItem } from '@/shared/stores/NavStore';
  import { useNavStore } from '@/shared/stores/NavStore';

  const navStore = useNavStore();

  const { navItems, showedNavItems, showedPartners, isShowSearch } =
    storeToRefs(navStore);

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
      .flatMap(group => group.children)
      .filter(item => item.url?.startsWith('/tools'));

    return orderBy(navTools, ['order'], ['asc']);
  });

  const openSearchModal = () => {
    isShowSearch.value = true;
  };
</script>

<style lang="scss" scoped></style>
