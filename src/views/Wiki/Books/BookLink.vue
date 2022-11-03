<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: book.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="bookItem"
            :class="getClassList(isActive)"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="navigate()"
        >
            <div class="link-item__content">
                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <div class="link-item__name--rus">
                                {{ book.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ book.name.eng }}]
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    </router-link>
</template>

<script>
    import { RouterLink } from 'vue-router';
    import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';
    import { useBooksStore } from "@/store/Wiki/BooksStore";

    export default {
        name: 'BookLink',
        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            ...RouterLink.props,
            book: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({
            booksStore: useBooksStore(),
            modal: {
                show: false,
                data: undefined
            }
        }),
        methods: {
            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-book-selected': this.$route.name === 'bookDetail',
                    'is-green': this.book?.homebrew
                };
            },

            clickHandler(callback) {
                if (!this.inTab) {
                    callback();

                    return;
                }

                this.booksStore.bookInfoQuery(this.book.url)
                    .then(spell => {
                        this.modal = {
                            show: true,
                            data: spell
                        };
                    });
            }
        }
    };
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss"/>
