<template>
    <div
        v-if="god"
        class="god_wrapper god-body gods"
    >
        <detail-top-bar
            :left="topBarLeftString"
            :source="god.source"
        />

        <div class=" content-padding">
            <div class="avatar">
                <div class="image-container">
                    <a id="god_href">
                        <img
                            id="god_img"
                            v-lazy="!god.images?.length ? '/img/dark/no-img-best.png' : god.images[0]"
                            :alt="god.name.rus"
                            @click.left.exact.prevent="showGallery"
                        >
                    </a>
                </div>
            </div>

            <p>
                <b>Мировоззрение:</b>

                <span>{{ god.alignment }}</span>
            </p>

            <p>
                <b>Ранг:</b>

                <span>{{ god.rank }}</span>
            </p>

            <p v-if="god.titles?.length">
                <b>Титулы:</b>

                <span>{{ god.titles.join(', ') }}</span>
            </p>

            <p>
                <b>Символ:</b>

                <span>{{ god.symbol }}</span>
            </p>

            <p v-if="god.domains?.length">
                <b>Домены:</b>

                <span>{{ god.domains.join(', ') }}</span>
            </p>

            <p v-if="god.panteons?.length">
                <b>Пантеон:</b>

                <span>{{ god.panteons.join(', ') }}</span>
            </p>

            <raw-content
                v-if="god.description"
                :template="god.description"
            />
        </div>

        <vue-easy-lightbox
            v-if="god.images?.length"
            :imgs="god.images"
            :index="gallery.index"
            :visible="gallery.show"
            loop
            move-disabled
            scroll-disabled
            teleport="body"
            @hide="gallery.show = false"
        >
            <template #toolbar />
        </vue-easy-lightbox>
    </div>
</template>

<script>
    import RawContent from '@/components/content/RawContent.vue';
    import DetailTopBar from '@/components/UI/DetailTopBar.vue';

    export default {
        name: 'GodBody',
        components: {
            DetailTopBar,
            RawContent
        },
        props: {
            god: {
                type: Object,
                default: undefined,
                required: true
            }
        },
        data: () => ({
            gallery: {
                index: 0,
                show: false
            }
        }),
        computed: {
            topBarLeftString() {
                return ` `;
            }
        },
        methods: {
            showGallery() {
                if (!this.god.images?.length) {
                    return;
                }

                this.gallery.show = true;
                this.gallery.index = 0;
            }
        }
    };
</script>
