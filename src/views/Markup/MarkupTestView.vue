<template>
    <page-layout>
        <template #title>
            Тиамат
        </template>

        <template #subtitle>
            Tiamat
        </template>

        <template #default>
            <markup-render :entry="test" />
        </template>
    </page-layout>
</template>

<script>
    import { defineComponent } from 'vue';
    import PageLayout from '@/components/content/PageLayout.vue';
    import MarkupRender from '@/components/content/MarkupRender.vue';

    export default defineComponent({
        components: {
            MarkupRender,
            PageLayout
        },
        setup() {
            /* eslint-disable vue/max-len */
            const test = '{@gallery https://image.ttg.club:8089/creatures/Tiamat.webp;https://image.ttg.club:8089/creatures/Tiamat2.webp}\n\n{@b Класс доспеха} {@ac 25 natural}\n\n{@b Хиты} {@hit 30d20+300}\n\n{@bold Скорость} {@speed 60}, {@speed 120|fly}\n\n{@style {@style {@b СИЛ} {@ability str 30}|scores__stats;strength} {@style {@b ЛОВ} {@ability dex 10}|scores__stats;dexterity} {@style {@b ТЕЛ} {@ability con 30}|scores__stats;constitution} {@style {@b ИНТ} {@ability int 26}|scores__stats;intelligence} {@style {@b МДР} {@ability wis 26}|scores__stats;wisdom} {@style {@b ХАР} {@ability cha 29}|scores__stats;charisma}|scores}\n\n{@b Спасброски} Сил {@savingThrow str 19}, Лов {@savingThrow dex 9}, Мдр {@savingThrow wis 17}\n\n{@b Навыки} {@skill arcana} {@skillCheck arcana 17}, {@skill perception} {@skillCheck perception 26}, {@skill religion} {@skillCheck religion 17}\n\n{@b Иммунитет к урону} {@damageType fire|от огня|colored}, {@damageType cold|от холода}, {@damageType lightning|от электричества}, {@damageType poison|от яда}, {@damageType acid|от кислоты|colored}; {@damageType bludgeoning}, {@damageType piercing} и {@damageType slashing} от немагических атак\n\n{@b Иммунитет к состояниям} ослепление, очарование, глухота, испуг, отравление, ошеломление\n\n{@b Чувства} {@sense darkvision} 240 фт., {@sense truesight} 120 фт., пассивная Внимательность 36\n\n{@b Языки} {@language Общий}, {@language Драконий}, {@language Инфернальный}\n\n{@b Уровень опасности} {@challengeRating 30}\n\n{@title4 Способности|header_separator}';
            /* eslint-enable vue/max-len */

            return {
                test
            };
        }
    });
</script>
