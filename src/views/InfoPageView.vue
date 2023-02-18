<template>
    <page-layout>
        <template #title>
            {{ infoPage?.title || 'Заголовок' }}
        </template>

        <template
            v-if="infoPage?.subtitle"
            #subtitle
        >
            Описание не обязательно
        </template>

        <template #default>
            <raw-content
                v-if="infoPage?.description"
                :template="infoPage.description"
            />

            <span v-else-if="error">Произошла ошибка</span>

            <span v-else>Загрузка...</span>
        </template>
    </page-layout>
</template>

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { tryOnBeforeMount } from '@vueuse/core';
    import { useRoute, useRouter } from 'vue-router';
    import { useAxios } from '@/common/composition/useAxios';
    import PageLayout from '@/components/content/PageLayout.vue';
    import errorHandler from '@/common/helpers/errorHandler';
    import RawContent from '@/components/content/RawContent.vue';

    export default defineComponent({
        components: {
            RawContent,
            PageLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const http = useAxios();
            const infoPage = ref();
            const error = ref(false);

            tryOnBeforeMount(async () => {
                try {
                    const resp = await http.get({ url: route.path });

                    if (resp.status !== 200) {
                        await router.push({ name: 'index' });

                        return;
                    }

                    infoPage.value = resp.data;
                } catch (err) {
                    error.value = true;

                    errorHandler(err);
                }
            });

            return {
                infoPage,
                error
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
