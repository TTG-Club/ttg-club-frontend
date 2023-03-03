<template>
    <page-layout>
        <template #title>
            Тиамат
        </template>

        <template #subtitle>
            Tiamat
        </template>

        <template #default>
            <markup-render
                :entry="test"
            />
        </template>
    </page-layout>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import PageLayout from '@/components/content/PageLayout.vue';
    import MarkupRender from '@/components/render/MarkupRender.vue';

    export default defineComponent({
        components: {
            MarkupRender,
            PageLayout
        },
        setup() {
            /* eslint-disable vue/max-len */
            const test = [
                'Для начала нужно знать: закладки, когда вы не вошли в профиль на сайте, сохраняются только у вас в браузере. Закладки, которые у вас после авторизации, хранятся у нас на сервере и вы можете получить к ним доступ с любого устройства. Если у вас возникнут затруднения с инструкцией, вы всегда можете обратиться за помощью на нашем Discordсервере или в группе ВКонтакте.',
                {
                    type: 'heading',
                    level: 2,
                    name: 'Термины'
                },
                {
                    type: 'list',
                    items: ['Группа - это разделы закладок такие как "Общая", в нее входят категории.', 'Категории - это разделы в группах такие как: "Заклинания", "Классы", "Расы" и т.д.']
                },
                {
                    type: 'heading',
                    level: 1,
                    name: 'Инструкция'
                },
                {
                    type: 'list',
                    items: [
                        'Чтобы была возможность управлять группами и категориям закладок, вам нужно зарегистрироваться и авторизоваться на сайте.',
                        'После чего вы можете создать нужные группы закладок.',
                        'В момент добавления закладки, вы можете нажать на стрелку рядом с "флажком" и выбрать нужную группу — закладка будет добавлена в нее.',
                        'Вы можете перетаскивать закладки между группами и категориями, а также выполнять перетаскивание категории целиком (между группами).',
                        'В мобильной версии для перетаскивания и удаления закладок, нужно перейти в режим редактирования.'
                    ]
                },
                {
                    type: 'heading',
                    level: 3,
                    name: 'Ниже будет приведен видеоролик подготовки игрока перед игрой, а именно "создание" персонажа.'
                },
                {
                    type: 'youtube',
                    id: 'KsUGkjbkaSy'
                },
                'С уважением, команда {@link TTG Club|https://ttg.club}.'
            ];
            /* eslint-enable vue/max-len */

            return {
                test
            };
        }
    });
</script>
