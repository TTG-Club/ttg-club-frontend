<template>
    <router-link
        :class="{ 'is-green': backgroundItem?.homebrew }"
        :to="{ path: backgroundItem.url }"
        class="link-item"
    >
        <div class="link-item__content">
            <div class="link-item__body">
                <div class="link-item__row">
                    <div class="link-item__name">
                        <p class="link-item__name--rus">
                            {{ backgroundItem.name.rus }}
                        </p>

                        <p class="link-item__name--eng">
                            [{{ backgroundItem.name.eng }}]
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </router-link>
</template>

<script>
    import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';

    export default {

        directives: {
            CapitalizeFirst
        },
        props: {
            backgroundItem: {
                type: Object,
                required: true
            }
        }
    };
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
