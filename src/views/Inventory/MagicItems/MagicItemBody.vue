<template>
    <div
        v-if="magicItem"
        :class="{ 'in-tooltip': inTooltip }"
        class="magic-item_wrapper magic-item-body bestiary"
    >
        <detail-top-bar
            :left="topBarLeftString"
            :source="magicItem.source"
        />

        <div class=" content-padding">
            <ui-easy-lightbox
                :images="magicItem.images"
                :use-bg-hide="false"
            />

            <ul class="stat-list">
                <li>
                    <b>Настройка: </b>

                    <span>{{ magicItem.customization ? 'требуется настройка' : 'нет' }}</span>

                    <span v-if="magicItem.detailCustamization?.length">
                        ({{
                            magicItem.detailCustamization.join(', ')
                                .toLowerCase()
                        }})
                    </span>
                </li>

                <li v-if="magicItem.cost">
                    <b>Стоимость по <span
                        v-tippy="'Руководство Мастера'"
                    >DMG</span>: </b>

                    <span>{{ magicItem.cost.dmg }}</span>
                </li>

                <li v-if="magicItem.cost">
                    <b>Стоимость по <span
                        v-tippy="'Руководство Зантара обо всем'"
                    >XGE</span>: </b>

                    <span><dice-roller :formula="magicItem.cost.xge" /></span> зм.
                </li>
            </ul>

            <raw-content
                v-if="magicItem.description"
                :template="magicItem.description"
            />
        </div>
    </div>
</template>

<script>
    import upperFirst from 'lodash/upperFirst';
    import RawContent from '@/components/content/RawContent.vue';
    import DetailTopBar from '@/components/UI/DetailTopBar.vue';
    import DiceRoller from '@/components/UI/DiceRoller.vue';
    import UiEasyLightbox from '@/components/UI/kit/UiEasyLightbox.vue';

    export default {
        name: 'MagicItemBody',
        components: {
            UiEasyLightbox,
            DetailTopBar,
            RawContent,
            DiceRoller
        },
        props: {
            magicItem: {
                type: Object,
                default: undefined,
                required: true
            },
            inTooltip: {
                type: Boolean,
                default: false
            }
        },
        computed: {
            topBarLeftString() {
                let detail = '';

                if (this.magicItem.detailType?.length) {
                    detail = ` (${ this.magicItem.detailType.join(', ') })`;
                }

                return `${ upperFirst(this.magicItem.type.name) }${ detail }, ${ this.magicItem.rarity.name }`;
            }
        }
    };
</script>
