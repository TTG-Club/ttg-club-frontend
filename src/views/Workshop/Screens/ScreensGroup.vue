<template>
    <div
        v-for="group in groups"
        :key="group.name"
        class="screen-group"
    >
        <div class="screen-group__name">
            {{ group.name }}
        </div>

        <div class="screen-group__list">
            <screen-link
                v-for="screenObj in group.list"
                :key="screenObj.url"
                :screen="screenObj"
                :to="{ path: screenObj.url }"
            />
        </div>
    </div>
</template>

<script>
    import sortBy from 'lodash/sortBy';
    import groupBy from 'lodash/groupBy';
    import ScreenLink from '@/views/Workshop/Screens/ScreenLink.vue';

    export default {
        name: 'ScreensGroup',
        components: {
            ScreenLink
        },
        inheritAttrs: false,
        props: {
            childList: {
                type: Array,
                default: () => ([]),
                required: true
            }
        },
        computed: {
            groups() {
                const groups = sortBy(
                    Object.values(groupBy(
                        this.childList.filter(item => item.group),
                        o => o.group
                    ))
                        .map(list => ({
                            name: list[0].group,
                            list: sortBy(list, [o => o.order, o => o.name.rus])
                        })),
                    [o => o.group]
                );

                return [
                    {
                        list: sortBy(this.childList.filter(item => !item.group), [o => o.order, o => o.name.rus])
                    },
                    ...groups
                ];
            }
        }
    };
</script>

<style lang="scss" scoped>
    .screen-group {
        width: 100%;

        &__name {
            background: var(--hover);
            text-align: center;
            line-height: 50px;
            font-size: var(--h4-font-size);
            font-weight: 300;
            color: var(--text-color-title);
            font-family: 'Lora';
        }

        &__list {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(1, 1fr);

            @include media-min($sm) {
                grid-template-columns: repeat(2, 1fr);
            }

            @include media-min($md) {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    }
</style>
