<template>
    <div
        class="item-body"
        :class="{ 'in-tooltip': inTooltip }"
    >
        <detail-top-bar
            :left="categoriesString"
            :source="item.source"
        />

        <div class=" content-padding">
            <p v-if="item.price">
                <b>Стоимость: </b>

                <span>{{ item.price }}</span>
            </p>

            <p v-if="item.weight">
                <b>Вес (в фунтах): </b>

                <span>{{ item.weight }}</span>
            </p>

            <raw-content
                v-if="item?.description"
                :template="item.description"
            />
        </div>
    </div>
</template>

<script>
    import RawContent from "@/components/content/RawContent.vue";
    import DetailTopBar from "@/components/UI/DetailTopBar.vue";

    export default {
        name: "ItemBody",
        components: {
            DetailTopBar,
            RawContent
        },
        props: {
            item: {
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
            categoriesString() {
                if (!this.item.categories?.length) {
                    return '';
                }

                let str = '';

                if (this.item.categories.length === 1) {
                    str += 'Категория: ';
                }

                if (this.item.categories.length > 1) {
                    str += 'Категории: ';
                }

                str += this.item.categories.join(', ');

                return str;
            }
        }
    };
</script>
