<template>
    <div
        v-if="magicItem"
        class="magic-item_wrapper magic-item-body bestiary"
        :class="{ 'in-tooltip': inTooltip }"
    >
        <detail-top-bar
            :left="topBarLeftString"
            :source="magicItem.source"
        />

        <div class=" content-padding">
            <div class="avatar">
                <div class="image-container">
                    <a id="magic-item-href">
                        <img
                            id="magic-item-img"
                            v-lazy="!magicItem.images?.length ? '/img/dark/no-img-best.png' : magicItem.images[0]"
                            :alt="magicItem.name.rus"
                            @click.left.exact.prevent="showGallery"
                        >
                    </a>
                </div>
            </div>

            <p>
                <b>Настройка:</b> <span>{{ magicItem.customization ? 'требуется настройка' : 'нет' }}</span>

                <span v-if="magicItem.detailCustamization?.length">
                    ({{ magicItem.detailCustamization.join(', ').toLowerCase() }})
                </span>
            </p>

            <p>
                <b>Стоимость по <span
                    v-tippy="'Руководство Мастера'"
                >DMG</span>:</b> <span>{{ magicItem.cost.dmg }}</span>

                <br>

                <b>Стоимость по <span
                    v-tippy="'Руководство Зантара обо всем'"
                >XGE</span>:</b> <span><dice-roller :formula="magicItem.cost.xge"/></span> зм.
            </p>

            <raw-content
                v-if="magicItem.description"
                :template="magicItem.description"
            />
        </div>
    </div>

    <vue-easy-lightbox
        v-if="magicItem.images?.length"
        :imgs="magicItem.images"
        :index="gallery.index"
        :visible="gallery.show"
        :teleport="'body'"
        loop
        move-disabled
        scroll-disabled
        @hide="gallery.show = false"
    >
        <template #toolbar/>
    </vue-easy-lightbox>
</template>

<script>
    import upperFirst from "lodash/upperFirst";
    import RawContent from "@/components/content/RawContent";
    import DetailTopBar from "@/components/UI/DetailTopBar";

    export default {
        name: "MagicItemBody",
        components: {
            DetailTopBar,
            RawContent
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
        data: () => ({
            gallery: {
                index: null,
                show: false
            }
        }),
        computed: {
            topBarLeftString() {
                let str = `${ upperFirst(this.magicItem.type.name) }, ${ this.magicItem.rarity.name }`;

                if (this.magicItem.detailType?.length) {
                    str += ` (${ this.magicItem.detailType.join(', ') })`;
                }

                return str;
            }
        },
        methods: {
            showGallery() {
                if (!this.magicItem.images?.length) {
                    return;
                }

                this.gallery.show = true;
                this.gallery.index = 0;
            }
        }
    };
</script>
