<template>
    <div class="option-body">
        <detail-top-bar
            :left="`Требования: ${option?.requirements || 'Нет'}`"
            :source="option?.source"
        />

        <div class="option-body__desc content-padding">
            <raw-content :template="option?.description"/>

            <div
                v-if="option?.classes?.length"
                class="spell_stat_block_bottom"
            >
                <p>Классы:</p>

                <div class="classes_icon">
                    <class-square
                        v-for="(el, key) in option.classes"
                        :key="key"
                        :icon="el.icon"
                        :name="el.name"
                        :url="el.url"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import RawContent from "@/components/content/RawContent.vue";
    import DetailTopBar from "@/components/UI/DetailTopBar.vue";
    import ClassSquare from "@/components/UI/ClassSquare.vue";

    export default {
        name: "OptionBody",
        components: {
            ClassSquare,
            DetailTopBar,
            RawContent
        },
        props: {
            option: {
                type: Object,
                default: undefined,
                required: true
            }
        }
    };
</script>
