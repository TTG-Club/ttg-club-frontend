<template>
  <div class="main_page_wrapper">
    <h1 style="height: 0; opacity: 0; overflow: hidden;">
      TTG.Club Oнлайн-справочник
    </h1>

    <div class="main_block">
      <div class="header">
        <p
          class="search_row_g"
          @click.left.exact.prevent="openSearchModal"
        >
          Нажмите <span class="computer_version">&nbsp;тут или <span class="key">\</span>&nbsp;</span>для начала поиска
        </p>
      </div>

      <div class="card_row">
        <router-link
          v-for="(section, key) in navItems"
          :key="key"
          :to="{ path: section.url }"
          class="card"
        >
          <div class="title">
            <h4>{{ section.name }}</h4>
          </div>
        </router-link>
      </div>

      <div class="column">
        <div class="left">
          <div class="block">
            <div class="block__bot">
              <div class="dnd5club_tel_bot">
                <div class="info">
                  <h4>Telegram Spells Bot</h4>

                  <p>Книга заклинаний у вас в руках!</p>

                  <div class="bottom">
                    <a
                      class="main"
                      href="https://t.me/ttg_club_bot"
                      rel="noopener noreferrer"
                      target="_blank"
                    >Подключить</a>

                    <router-link
                      :to="{ path: '/info/telegram_spells_bot' }"
                      rel="noopener noreferrer"
                    >
                      Описание
                    </router-link>
                  </div>
                </div>

                <div class="bg_img" />
              </div>

              <div class="discord_bot">
                <div class="info">
                  <h4>Discord Bot <sup class="beta">β</sup></h4>

                  <p>Весь сайт у вас на сервере!</p>

                  <div class="bottom">
                    <!-- eslint-disable vue/max-len -->
                    <a
                      class="main"
                      href="https://discord.com/api/oauth2/authorize?client_id=1074095730265964654&permissions=274878032896&scope=bot%20applications.commands"
                      rel="noopener noreferrer"
                      target="_blank"
                    >Пригласить</a>
                    <!-- eslint-enable vue/max-len -->

                    <router-link
                      :to="{ path: '/info/discord_bot' }"
                      rel="noopener noreferrer"
                    >
                      Описание
                    </router-link>
                  </div>
                </div>

                <div class="bg_img" />
              </div>
            </div>

            <div class="links_block">
              <h3>Инструменты:</h3>

              <div class="list">
                <router-link
                  v-for="(tool, key) in tools"
                  :key="key"
                  :to="{ path: tool.url }"
                  class="block tip w-100"
                >
                  {{ tool.name }}
                </router-link>
              </div>
            </div>
          </div>

          <div class="block__youtube">
            <h3>Интересное D&D 5e:</h3>

            <transition
              mode="out-in"
              name="fade"
            >
              <ui-youtube
                v-if="currentVideo"
                :id="currentVideo"
                ref="youtube"
              />

              <div
                v-else
                class="no-video"
              >
                Новостей не было за последнее время
              </div>
            </transition>

            <!-- <a
                            href="https://www.youtube.com/@online.shirma"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn"
                        >Все видео</a> -->
          </div>
        </div>

        <div
          v-if="showedPartners.length"
          class="right"
        >
          <div class="links_block">
            <h3>Наши друзья:</h3>

            <div class="list">
              <a
                v-for="(partner, key) in showedPartners"
                :key="key"
                v-tippy="{
                  content: partner.description,
                }"
                :href="partner.url"
                class="block tip"
                rel="noopener noreferrer"
                target="_blank"
              >
                <img
                  :alt="partner.name"
                  :src="partner.img"
                  height="20px"
                  width="20px"
                >
                {{ partner.name }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import {
    computed, defineComponent, ref
  } from 'vue';
  import { storeToRefs } from 'pinia';
  import orderBy from 'lodash/orderBy';
  import { tryOnBeforeMount } from '@vueuse/core';
  import type { TNavItem } from '@/store/UI/NavStore';
  import { useNavStore } from '@/store/UI/NavStore';
  import UiYoutube from '@/components/UI/kit/UiYoutube.vue';
  import { useAxios } from '@/common/composition/useAxios';

  export default defineComponent({
    components: { UiYoutube },
    setup() {
      const navStore = useNavStore();

      const {
        showedNavItems,
        showedPartners,
        isShowSearch
      } = storeToRefs(navStore);

      const youtube = ref<HTMLElement | null>(null);
      const http = useAxios();
      const currentVideo = ref<string | null>(null);

      const navItems = computed(() => {
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

        return orderBy(
          items,
          ['indexOrder'],
          ['asc']
        );
      });

      const tools = computed<TNavItem[]>(() => {
        const navTools = showedNavItems.value.find(item => item?.icon === 'menu-tools');

        if (!navTools?.children?.length) {
          return [];
        }

        return orderBy(
          navTools.children,
          ['order'],
          ['asc']
        );
      });

      const setLastVideo = async () => {
        try {
          const resp = await http.get({ url: '/youtube/last' });

          if (resp.status !== 200) {
            return Promise.reject(resp.status);
          }

          currentVideo.value = resp.data.id;

          return Promise.resolve(resp.data);
        } catch (err) {
          return Promise.reject(err);
        }
      };

      const openSearchModal = () => {
        isShowSearch.value = true;
      };

      tryOnBeforeMount(async () => {
        await setLastVideo();
      });

      return {
        youtube,
        currentVideo,
        navItems,
        tools,
        showedPartners,
        openSearchModal
      };
    }
  });
</script>

<style lang="scss" scoped>

</style>
