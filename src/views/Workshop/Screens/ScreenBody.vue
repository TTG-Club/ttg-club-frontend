<template>
    <div
        v-if="screen"
        class="screen-body"
        :class="{ 'in-tooltip': inTooltip }"
    >
        <detail-top-bar :source="screen.source">
            <template
                v-if="screen.parent?.url"
                #left
            >
                Раздел: <a :href="screen.parent.url">{{ screen.parent.name.rus }}</a>
            </template>
        </detail-top-bar>

        <div class="content-padding">
            <raw-content
                v-if="screen.description"
                :template="screen.description"
            />
        </div>
    </div>
</template>

<script>
    import DetailTopBar from "@/components/UI/DetailTopBar.vue";
    import RawContent from "@/components/content/RawContent.vue";

    export default {
        name: "ScreenBody",
        components: {
            RawContent,
            DetailTopBar
        },
        props: {
            screen: {
                type: Object,
                default: undefined,
                required: true
            },
            inTooltip: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({})
    };
</script>
