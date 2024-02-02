<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';
</script>

<template>
  <page-layout :use-social-links="false">
    <template #title> Мастерская </template>

    <template #default>
      <div class="workshop">
        <div class="workshop__row">
          <div class="workshop__blocks">
            <div class="workshop__block">
              <h5 class="workshop__block_name">Бестиарий</h5>

              <div class="workshop__block_body">
                <p class="workshop__block_item">
                  <span class="workshop__block_item-name">Черновики: </span>

                  <span class="workshop__block_item-value">
                    <a href="#">0</a>
                  </span>
                </p>

                <p class="workshop__block_item">
                  <span class="workshop__block_item-name">На проверке: </span>

                  <span class="workshop__block_item-value">
                    <a href="#">0</a>
                  </span>
                </p>

                <p class="workshop__block_item">
                  <span class="workshop__block_item-name"
                    >Ожидают модерации:
                  </span>

                  <span class="workshop__block_item-value">
                    <a href="#">0</a>
                  </span>
                </p>
              </div>

              <div class="workshop__block_footer">
                <router-link :to="{ name: 'workshop-creature-new' }"
                  >Добавить существо</router-link
                >

                <router-link :to="{ name: 'workshop-bestiary' }"
                  >Мой бестиарий</router-link
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </page-layout>
</template>

<style scoped lang="scss">
  .workshop {
    &__row {
      & + & {
        margin-top: 24px;
      }
    }

    &__blocks {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    &__block {
      background-color: var(--bg-secondary);
      padding: 24px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;

      &_name {
        margin: 0;
        flex-shrink: 0;
        font-size: var(--h4-font-size);
        line-height: var(--h4-line-height);
      }

      &_body {
        flex: 1 1 auto;
        margin-top: 12px;
      }

      &_item {
        margin: 0;

        & + & {
          margin-top: 8px;
        }
      }

      &_footer {
        flex-shrink: 0;
        display: flex;
        gap: 12px;
        margin-top: 12px;
        border-top: 1px solid var(--border);
        padding-top: 12px;
      }
    }
  }
</style>
