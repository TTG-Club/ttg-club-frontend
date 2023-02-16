<template>
    <page-layout>
        <template #title>
            Тест парсера
        </template>

        <template #default>
            <markup-render :entries="test" />
        </template>
    </page-layout>
</template>

<script>
    import { defineComponent } from 'vue';
    import PageLayout from '@/components/content/PageLayout.vue';
    import MarkupRender from '@/components/content/MarkupRender.vue';

    export default defineComponent({
        components: {
            MarkupRender,
            PageLayout
        },
        setup() {
            /* eslint-disable vue/max-len */
            const test = [
                'Dice: {@dice 1d8+2d6} is dice component',
                'Spells: {@spell acid splash} assumes {@b {@i PHB}} {@u U-text} by default, {@spell tiny servant|xge} can have sources added with a pipe, {@spell tiny servant|xge|and optional link text added with another pipe}.',
                'Items: {@item alchemy jug} assumes {@b {@s DMG}} by default, {@item longsword|phb} can have sources added with a pipe, {@item longsword|phb|and optional link text added with another pipe}.',
                'Creatures: {@creature goblin} assumes MM by default, {@creature cow|vgm} can have sources added with a pipe, {@creature cow|vgm|and optional link text added with another pipe}.',
                'Backgrounds: {@background Charlatan} assumes PHB by default, {@background Anthropologist|toa} can have sources added with a pipe, {@background Anthropologist|ToA|and optional link text added with another pipe}.',
                'Races: {@race Human} assumes PHB by default, {@race Aarakocra|eepc} can have sources added with a pipe, {@race Aarakocra|eepc|and optional link text added with another pipe}.',
                'Invocations and Other Optional Features: {@optfeature Agonizing Blast} assumes PHB by default, {@optfeature Aspect of the Moon|xge} can have sources added with a pipe, {@optfeature Aspect of the Moon|xge|and optional link text added with another pipe}.',
                'Classes: {@class fighter} assumes PHB by default, {@class artificer|uaartificer} can have sources added with a pipe, {@class fighter|phb|optional link text added with another pipe}, {@class fighter|phb|subclasses added|Eldritch Knight} with another pipe, {@class fighter|phb|and class feature added|Eldritch Knight|phb|2-0} with another pipe (first number is level index (0-19), second number is feature index (0-n)).',
                'Class Features: {@classFeature Rage|Barbarian||1}, {@classFeature Infuse Item|Artificer|TCE|2}, {@classFeature Survival Instincts|Barbarian||2|UAClassFeatureVariants}, {@classFeature Rage|Barbarian||1||optional display text}. Class source is assumed to be PHB. Class feature source is assumed to be the same as class source.',
                'Subclass Features: {@subclassFeature Path of the Berserker|Barbarian||Berserker||3}, {@subclassFeature Alchemist|Artificer|TCE|Alchemist|TCE|3}, {@subclassFeature Path of the Battlerager|Barbarian||Battlerager|SCAG|3}, {@subclassFeature Blessed Strikes|Cleric||Life||8|UAClassFeatureVariants}, {@subclassFeature Path of the Berserker|Barbarian||Berserker||3||optional display text}. Class source is assumed to be PHB. Subclass source is assumed to be PHB. Subclass feature source is assumed to be the same as subclass source.',
                "Conditions: {@condition stunned} assumes PHB by default, {@condition stunned|PHB} can have sources added with a pipe (not that it's ever useful), {@condition stunned|PHB|and optional link text added with another pipe}.",
                'Diseases: {@disease cackle fever} assumes DMG by default, {@disease cackle fever} can have sources added with a pipe, {@disease cackle fever|DMG|and optional link text added with another pipe}.',
                'Other Rewards: {@reward Blessing of Health} assumes DMG by default, {@reward Blessing of Health} can have sources added with a pipe, {@reward Blessing of Health|DMG|and optional link text added with another pipe}.',
                'Feats: {@feat Alert} assumes PHB by default, {@feat Elven Accuracy|xge} can have sources added with a pipe, {@feat Elven Accuracy|xge|and optional link text added with another pipe}.',
                'Psionics: {@psionic Mastery of Force} assumes UATheMysticClass by default, {@psionic Mastery of Force|UATheMysticClass} can have sources added with a pipe, {@psionic Mastery of Force|UATheMysticClass|and optional link text added with another pipe}.',
                'Objects: {@object Ballista} assumes DMG by default, {@object Ballista} can have sources added with a pipe, {@object Ballista|DMG|and optional link text added with another pipe}.',
                'Boons: {@boon Demonic Boon of Demogorgon} assumes MTF by default, {@boon Demonic Boon of Demogorgon} can have sources added with a pipe, {@boon Demonic Boon of Demogorgon|MTF|and optional link text added with another pipe}.',
                'Cults: {@cult Cult of Asmodeus} assumes MTF by default, {@cult Cult of Asmodeus} can have sources added with a pipe, {@cult Cult of Asmodeus|MTF|and optional link text added with another pipe}.',
                'Traps: {@trap falling net} assumes DMG by default, {@trap falling portcullis|xge} can have sources added with a pipe, {@trap falling portcullis|xge|and optional link text added with another pipe}.',
                'Hazards: {@hazard brown mold} assumes DMG by default, {@hazard russet mold|vgm} can have sources added with a pipe, {@hazard russet mold|vgm|and optional link text added with another pipe}.',
                'Deities: {@deity Gond} assumes PHB Forgotten Realms pantheon by default, {@deity Gruumsh|nonhuman} can have pantheons added with a pipe, {@deity Ioun|dawn war|dmg} can have sources added with another pipe, {@deity Ioun|dawn war|dmg|and optional link text added with another pipe}.',
                'Variant rules: {@variantrule Diagonals} assumes DMG by default, {@variantrule Multiclassing|phb} can have sources added with a pipe, {@variantrule Multiclassing|phb|and optional link text added with another pipe}.',
                'Vehicles: {@vehicle Galley} assumes GoS by default, {@vehicle Galley|UAOfShipsAndSea} can have sources added with a pipe, {@vehicle Galley|GoS|and optional link text added with another pipe}.',
                'Vehicle upgrades: {@vehupgrade Guardian Figurehead} assumes GoS by default, {@vehicle Gilded Death Armor|BGDIA} can have sources added with a pipe, {@vehicle Guardian Figurehead|GoS|and optional link text added with another pipe}.',
                'Tables: {@table 25 gp Art Objects} assumes DMG by default, {@table Adventuring Gear|phb} can have sources added with a pipe, {@table Adventuring Gear|phb|and optional link text added with another pipe}.',
                'Actions: {@action Attack} assumes PHB by default, {@action Tumble|DMG} can have sources added with a pipe, {@action Tumble|DMG|and optional link text added with another pipe}.',
                'Languages: {@language common} assumes PHB by default, {@language Dambrathan|SCAG} can have sources added with a pipe, {@language Dambrathan|SCAG|and optional link text added with another pipe}.',
                'Other Character Creation Options: {@charoption Anvilwrought} assumes MOT by default, {@charoption Hollow One|EGW} can have sources added with a pipe, {@charoption Hollow One|EGW|and optional link text added with another pipe}.',
                "Recipes: {@recipe Elven Bread} assumes Heroes' Feast by default, {@recipe Elven Bread|HF} can have sources added with a pipe, {@recipe Elven Bread|HF|and optional link text added with another pipe}.",
                'Decks: {@deck Deck of Many Things} assumes DMG by default, {@deck Deck of Many Things|DMG} can have sources added with a pipe, {@deck Deck of Many Things|DMG|and optional link text added with another pipe}.',
                'Cards: {@card Vizier|Deck of Many Things} assumes DMG by default, {@card Vizier|Deck of Many Things|DMG} can have sources added with a pipe, {@card Vizier|Deck of Many Things|DMG|and optional link text added with another pipe}.'
            ];
            /* eslint-enable vue/max-len */

            return {
                test
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
