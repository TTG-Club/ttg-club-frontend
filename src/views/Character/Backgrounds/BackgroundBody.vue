<template>
    <div class="background-body">
        <detail-top-bar
            :left="topBarLeftString"
            :source="background?.source"
        />

        <div class="background-body__desc content-padding">
            <raw-content :url="background?.url"/>
        </div>
    </div>
</template>

<script>
    import RawContent from "@/components/content/RawContent.vue";
    import DetailTopBar from "@/components/UI/DetailTopBar.vue";

    export default {
        name: "BackgroundBody",
        components: {
            DetailTopBar,
            RawContent
        },
        props: {
            background: {
                type: Object,
                default: undefined,
                required: true
            }
        },
        computed: {
            topBarLeftString() {
                return ` `;
            }
        }
    };
</script>
