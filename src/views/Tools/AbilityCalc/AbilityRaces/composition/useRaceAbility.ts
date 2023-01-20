import type { ComputedRef, Ref } from 'vue';
import { computed, ref } from 'vue';
import type { AbilityRoll } from '@/types/Tools/AbilityCalc.types';
import {
    AbilityChoiceDouble, AbilityChoiceDoubleKey, AbilityTypeKey
} from '@/types/Tools/AbilityCalc.types';
import type { TRaceLink } from '@/types/Character/Races.types';

type TConfig = {
    isChoiceDouble: ComputedRef<boolean>
    selectedChoiceDouble: Ref<{
        key: AbilityChoiceDoubleKey
        label: AbilityChoiceDouble
    } | null>
    checkInstance: ComputedRef<TRaceLink | null>
}

export function useRaceAbility(config: TConfig) {
    const {
        isChoiceDouble,
        selectedChoiceDouble,
        checkInstance
    } = config;

    // First
    const firstValue = ref<AbilityRoll | null>(null);

    const isFirstDisabled = computed(() => {
        if (isChoiceDouble.value) {
            return !selectedChoiceDouble.value;
        }

        return !checkInstance.value?.abilities.find(ability => [
            AbilityTypeKey.ONE,
            AbilityTypeKey.CHOICE,
            AbilityTypeKey.CHOICE_UNIQUE
        ].includes(ability.key as AbilityTypeKey));
    });

    const firstLabel = computed(() => {
        if (isChoiceDouble.value && selectedChoiceDouble.value?.key === AbilityChoiceDoubleKey.FOR_TWO) {
            return 2;
        }

        if (isChoiceDouble.value && selectedChoiceDouble.value?.key === AbilityChoiceDoubleKey.FOR_THREE) {
            return 1;
        }

        const ability = checkInstance.value?.abilities.find(item => [
            AbilityTypeKey.ONE,
            AbilityTypeKey.CHOICE,
            AbilityTypeKey.CHOICE_UNIQUE
        ].includes(item.key as AbilityTypeKey));

        if (ability) {
            return ability.value;
        }

        return null;
    });

    // Second
    const secondValue = ref<AbilityRoll | null>(null);

    const isSecondDisabled = computed(() => {
        if (isChoiceDouble.value) {
            return !selectedChoiceDouble.value;
        }

        return !checkInstance.value?.abilities.find(ability => (
            ability.key as AbilityTypeKey === AbilityTypeKey.CHOICE_UNIQUE
        ));
    });

    const secondLabel = computed(() => {
        if (isChoiceDouble.value && !!selectedChoiceDouble.value) {
            return 1;
        }

        const ability = checkInstance.value?.abilities
            .find(item => [AbilityTypeKey.CHOICE_UNIQUE].includes(item.key as AbilityTypeKey));

        if (ability) {
            return ability.value;
        }

        return null;
    });

    // Third
    const thirdValue = ref<AbilityRoll | null>(null);

    const isThirdDisabled = computed(() => !(
        isChoiceDouble.value && selectedChoiceDouble.value?.key === AbilityChoiceDoubleKey.FOR_THREE
    ));

    const thirdLabel = computed(() => {
        if (isChoiceDouble.value && selectedChoiceDouble.value?.key === AbilityChoiceDoubleKey.FOR_THREE) {
            return 1;
        }

        return null;
    });

    const onFirstSelect = (value: AbilityRoll | null) => {
        firstValue.value = value;

        if (firstLabel.value && firstValue.value) {
            firstValue.value.value = firstLabel.value;
        }

        if (secondValue.value?.key === value?.key) {
            secondValue.value = null;
        }

        if (thirdValue.value?.key === value?.key) {
            thirdValue.value = null;
        }
    };

    const onSecondSelect = (value: AbilityRoll | null) => {
        secondValue.value = value;

        if (secondLabel.value && secondValue.value) {
            secondValue.value.value = secondLabel.value;
        }

        if (firstValue.value?.key === value?.key) {
            firstValue.value = null;
        }

        if (thirdValue.value?.key === value?.key) {
            thirdValue.value = null;
        }
    };

    const onThirdSelect = (value: AbilityRoll | null) => {
        thirdValue.value = value;

        if (thirdLabel.value && thirdValue.value) {
            thirdValue.value.value = thirdLabel.value;
        }

        if (firstValue.value?.key === value?.key) {
            firstValue.value = null;
        }

        if (secondValue.value?.key === value?.key) {
            secondValue.value = null;
        }
    };

    return {
        firstValue,
        firstLabel,
        isFirstDisabled,
        onFirstSelect,

        secondValue,
        secondLabel,
        isSecondDisabled,
        onSecondSelect,

        thirdValue,
        thirdLabel,
        isThirdDisabled,
        onThirdSelect
    };
}
