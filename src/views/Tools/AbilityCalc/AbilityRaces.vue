<template>
    <div class="ability-races">
        <div
            v-if="selectedRace"
            class="ability-races__calc"
        >
            <div class="ability-races__race">
                <race-link
                    :race-item="selectedRace"
                    :to="{ path: selectedRace.url }"
                    is-ability-calc
                />

                <button
                    type="button"
                    class="ability-races__race_hover"
                    @click.left.exact.prevent="onDeselect"
                >
                    change
                </button>
            </div>

            <div class="ability-races__sub-race">
                <ui-select
                    v-if="subRaces?.length"
                    v-model="subRace"
                    track-by="url"
                    :options="subRaces"
                >
                    <template #label>
                        Подраса
                    </template>

                    <template #singleLabel="{ option }">
                        {{ option.name.rus }}
                    </template>

                    <template #option="{ option }">
                        {{ option.name.rus }}
                    </template>

                    <template #placeholder>
                        Выбери подрасу
                    </template>
                </ui-select>

                <ui-select
                    v-if="isChoiceDouble"
                    v-model="selectedChoiceDouble"
                    :options="choiceDouble"
                    track-by="key"
                    label="label"
                >
                    <template #label>
                        Набор характеристик
                    </template>
                </ui-select>
            </div>

            <div class="ability-races__abilities">
                test
            </div>
        </div>

        <div
            v-else-if="races.length"
            class="ability-races__list"
        >
            <div
                class="ability-races__grid"
                :class="{ 'is-opened': opened }"
            >
                <race-link
                    v-for="(race, raceKey) in races"
                    :key="raceKey"
                    :race-item="race"
                    :to="{ path: race.url }"
                    is-ability-calc
                    @select="onSelect"
                />
            </div>

            <ui-button
                v-if="items.length > 3"
                class="ability-races__expand"
                @click.left.exact.prevent="opened = !opened"
            >
                <template #icon-left>
                    <svg-icon
                        icon-name="arrow-stroke"
                        class="ability-races__expand_icon"
                        :class="{ 'is-opened': opened }"
                    />
                </template>

                <template #default>
                    {{ opened ? 'Свернуть' : 'Раскрыть' }} список
                </template>
            </ui-button>
        </div>
    </div>
</template>

<script lang="ts">
    import {
        computed, defineComponent, onBeforeMount, ref
    } from 'vue';
    import type { TRaceLink } from '@/types/Character/Races.types';
    import RaceLink from '@/views/Character/Races/RaceLink.vue';
    import { usePagination } from '@/common/composition/usePagination';
    import UiButton from '@/components/form/UiButton.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import UiSelect from '@/components/form/UiSelect.vue';
    import {
        AbilityChoiceDouble, AbilityChoiceDoubleKey, AbilityTypeKey
    } from '@/types/Tools/AbilityCalc.types';

    export default defineComponent({
        components: {
            UiSelect,
            UiButton,
            RaceLink,
            SvgIcon
        },
        setup() {
            const opened = ref(false);
            const selectedRace = ref<TRaceLink | null>(null);
            const subRace = ref<TRaceLink | null>(null);

            const selectedChoiceDouble = ref<{
                key: keyof typeof AbilityChoiceDouble
                label: AbilityChoiceDouble
            } | null>(null);

            const {
                initPages, items
            } = usePagination({
                url: '/races',
                limit: -1,
                order: [
                    {
                        field: 'name',
                        direction: 'asc'
                    }
                ]
            });

            const races = computed(() => {
                if (opened.value) {
                    return items.value;
                }

                return items.value.slice(0, 3);
            });

            const isChoiceDouble = computed(() => (
                selectedRace.value?.abilities.length === 1
                && selectedRace.value?.abilities[0].key === AbilityTypeKey.CHOICE_DOUBLE
            ));

            const subRaces = computed(() => selectedRace.value?.subraces);

            const choiceDouble = ref<Array<{
                key: AbilityChoiceDoubleKey
                label: AbilityChoiceDouble
            }>>(Object.entries(AbilityChoiceDouble).map(entry => ({
                key: entry[0] as AbilityChoiceDoubleKey,
                label: entry[1] as AbilityChoiceDouble
            })));

            onBeforeMount(async () => {
                await initPages();
            });

            const onSelect = (race: TRaceLink) => {
                selectedRace.value = race;
            };

            const onDeselect = () => {
                selectedRace.value = null;
                subRace.value = null;
                selectedChoiceDouble.value = null;
            };

            return {
                opened,
                items,
                races,
                selectedRace,
                isChoiceDouble,
                subRaces,
                subRace,
                choiceDouble,
                selectedChoiceDouble,
                onSelect,
                onDeselect
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ability-races {
        &__calc {
            display: grid;
            gap: 32px;
            grid-template-columns: 270px 200px auto;
        }

        &__race {
            width: 270px;
            flex-shrink: 0;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;

            &_hover {
                @include css_anim();

                opacity: 0;
                width: 100%;
                height: 100%;
                position: absolute;
                background: var(--bg-light-main);
                color: var(--text-b-color);

                &:hover {
                    opacity: 1;
                }
            }
        }

        &__sub-race {
            display: grid;
            gap: 12px;
        }

        &__grid {
            display: grid;
            gap: 24px;
            grid-template-columns: repeat(3, 1fr);
        }

        &__expand {
            margin: 24px auto 0;
            display: flex;

            &_icon {
                &.is-opened {
                    transform: rotate(-180deg);
                }
            }
        }
    }
</style>
