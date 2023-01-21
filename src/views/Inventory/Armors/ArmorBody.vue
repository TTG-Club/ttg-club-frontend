<template>
    <div
        v-if="armor"
        :class="{ 'in-tooltip': inTooltip }"
        class="armor-body"
    >
        <detail-top-bar
            :bg-grey="false"
            :left="armor.type.name"
            :source="armor.source"
        />

        <div class="grid_stat_block">
            <div class="block">
                <p>Класс Доспеха (AC):</p>

                <span>{{ armor.armorClass }}</span>
            </div>

            <div class="block">
                <p>Стоимость:</p>

                <span>{{ armor.price }}</span>
            </div>

            <div class="block">
                <p>Вес (в фунтах):</p>

                <span>{{ armor.weight }}</span>
            </div>

            <div class="block">
                <p>Помеха на Скрытность:</p>

                <span>{{ armor.disadvantage ? 'Есть' : 'Нет' }}</span>
            </div>

            <div class="block">
                <p>Требование к Силе:</p>

                <span>{{ armor.requirement || 'Нет' }}</span>
            </div>

            <div class="block">
                <p>Надевание / Снятие:</p>

                <span>{{ armor.duration }}</span>
            </div>
        </div>

        <div class=" content-padding">
            <raw-content
                v-if="armor.description"
                :template="armor.description"
            />
        </div>
    </div>
</template>

<script>
    import RawContent from '@/components/content/RawContent.vue';
    import DetailTopBar from '@/components/UI/DetailTopBar.vue';

    export default {
        name: 'ArmorBody',
        components: {
            DetailTopBar,
            RawContent
        },
        props: {
            armor: {
                type: Object,
                required: true,
                default: undefined
            },
            inTooltip: {
                type: Boolean,
                default: false
            }
        }
    };
</script>
