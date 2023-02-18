<template>
    <div class="main_page_wrapper">
        <h1 style="height: 0; opacity: 0; overflow: hidden;">
            TTG.Club Oнлайн-справочник
        </h1>

        <div class="main_block">
            <div class="header">
                <p
                    class="search_row_g"
                    @click.left.exact.prevent="openSearchModal"
                >
                    Нажмите
                    <span class="computer_version">
                        &nbsp;тут или<span class="key">&#171; / &#187;</span>
                    </span>
                    для начала поиска
                </p>
            </div>

            <div class="card_row">
                <router-link
                    v-for="(section, key) in nav"
                    :key="key"
                    :to="{ path: section.url }"
                    class="card"
                    :class="[section.name]"
                >
                    <div class="title">
                        <h4>{{ section.label }}</h4>
                    </div>
                </router-link>
            </div>

            <div class="column">
                <div class="left">
                    <div class="block">
                        <div class="block__bot">
                            <div class="dnd5club_tel_bot">
                                <div class="info">
                                    <h4>Telegram Spells Bot</h4>

                                    <p>Книга заклинаний, у вас в руках!</p>

                                    <div class="bottom">
                                        <a
                                            class="main"
                                            href="https://t.me/ttg_club_bot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >Подключить</a>

                                        <a
                                            href="https://vk.com/@ttg.club-telegram-spell-bot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >Описание</a>
                                    </div>
                                </div>

                                <div class="bg_img" />
                            </div>

                            <div class="discord_bot">
                                <div class="info">
                                    <h4>Discord Bot <sup class="beta">β</sup></h4>

                                    <p>Весь сайт, у вас на сервере!</p>

                                    <div class="bottom">
                                        <!-- eslint-disable vue/max-len -->
                                        <a
                                            class="main"
                                            href="https://discord.com/api/oauth2/authorize?client_id=1074095730265964654&permissions=274878032896&scope=bot%20applications.commands"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >Пригласить</a>
                                        <!-- eslint-enable vue/max-len -->

                                        <a
                                            href="https://vk.com/@ttg.club-kak-ispolzovat-discord-bot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >Описание</a>
                                    </div>
                                </div>

                                <div class="bg_img" />
                            </div>
                        </div>

                        <div class="links_block">
                            <h3>Инструменты:</h3>

                            <div class="list">
                                <router-link
                                    v-for="(tool, key) in tools"
                                    :key="key"
                                    :to="{ path: tool.url }"
                                    class="block tip w-100"
                                >
                                    {{ tool.label }}
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="right">
                    <div class="links_block">
                        <h3>Наши друзья:</h3>

                        <div class="list">
                            <a
                                v-for="(partner, key) in partners"
                                :key="key"
                                v-tippy="partner.tooltip"
                                :href="partner.url"
                                class="block tip"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    width="20px"
                                    height="20px"
                                    :src="partner.img"
                                    :alt="partner.alt"
                                >
                                {{ partner.label }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent, ref } from 'vue';

    export default defineComponent({
        setup() {
            const nav = ref([
                {
                    name: 'classes',
                    url: '/classes',
                    label: 'Классы'
                },
                {
                    name: 'races',
                    url: '/races',
                    label: 'Расы'
                },
                {
                    name: 'traits',
                    url: '/traits',
                    label: 'Черты'
                },
                {
                    name: 'options',
                    url: '/options',
                    label: 'Особенности классов'
                },
                {
                    name: 'backgrounds',
                    url: '/backgrounds',
                    label: 'Предыстории'
                },
                {
                    name: 'spells',
                    url: '/spells',
                    label: 'Заклинания'
                },
                {
                    name: 'weapons',
                    url: '/weapons',
                    label: 'Оружие'
                },
                {
                    name: 'armors',
                    url: '/armors',
                    label: 'Доспехи'
                },
                {
                    name: 'items',
                    url: '/items',
                    label: 'Снаряжение'
                },
                {
                    name: 'magic-items',
                    url: '/items/magic',
                    label: 'Магические предметы'
                },
                {
                    name: 'bestiary',
                    url: '/bestiary',
                    label: 'Бестиарий'
                },
                {
                    name: 'screens',
                    url: '/screens',
                    label: 'Ширма'
                }
            ]);

            const tools = ref([
                {
                    label: 'Калькулятор характеристик',
                    url: '/tools/ability-calc'
                },
                {
                    label: 'Торговец',
                    url: '/tools/trader'
                },
                {
                    label: 'Случайные столкновения',
                    url: '/tools/encounters'
                },
                {
                    label: 'Генератор содержимого сокровищницы',
                    url: '/tools/treasury'
                },
                {
                    label: 'Случайная дикая магия',
                    url: '/tools/wildmagic'
                },
                {
                    label: 'Случайное безумие',
                    url: '/tools/madness'
                }
            ]);

            /* eslint-disable vue/max-len */
            const partners = ref([
                {
                    tooltip: 'команда создает авторские миниатюры в разных системах и жанрах. Заказать 3Д скульпт и найти качественную отливку можно у них в группе или на сайте',
                    url: 'https://badmimic.com/?partner=ttg.club',
                    label: 'Bad Mimic',
                    img: '/partner/bad_mimic.webp',
                    alt: 'Наши друзья магазин миниатюр Bad Mimic'
                },
                {
                    tooltip: 'Канал расскжет вам о тонкостях и нюансах игры в онлайне. Поможет разобраться с виртуальными столами. Упростит подготовку к вашей игре. Автоматизирует максимум процессов игровой механики. Всё, чтобы игра стала атмосфернее и интереснее.',
                    url: 'https://www.youtube.com/channel/UCMfMw5ZX4_rZ4rv4TlY8j8g?partner=ttg.club',
                    label: '«Онлайн ширма»',
                    img: '/partner/koroz.webp',
                    alt: 'Онлайн ширма'
                },
                {
                    tooltip: 'Сервер ставит перед собой цель помочь новичкам, интересующимся D&D в Discord сегменте, а также стремится стать надежной базой для Discord-комьюнити системы D&D.',
                    url: 'https://discord.gg/Vxu2Cu9mbM?partner=ttg.club',
                    label: 'Empire Tavern',
                    img: '/partner/Empire_tavern.webp',
                    alt: 'Empire Tavern'
                },
                {
                    tooltip: 'Это клуб ролевых игр Великого Новгорода Студия «Ravenheart». Если ты хочешь круто провести время, то ты пришел по адресу!',
                    url: 'https://vk.com/ravenheart_studio?partner=ttg.club',
                    label: 'Студия «Ravenheart»',
                    img: '/partner/ravenheart_studio.webp',
                    alt: 'Студия «Ravenheart»'
                },
                {
                    tooltip: 'Сообщество опытного мастера Andy по настольным и ролевым играм, который хочет сделать ваш досуг максимально интересным и доступным.',
                    url: 'https://vk.com/anykeyspb?partner=ttg.club',
                    label: 'ANY KEY',
                    img: '/partner/any_key.webp',
                    alt: 'ANY KEY'
                },
                {
                    tooltip: 'Random Rules это канал про настольные ролевые игры. Любите проводить время с друзьями, играя в Dungeons & Dragons? Вам сюда!',
                    url: 'https://vk.com/rrules?partner=ttg.club',
                    label: 'Random Rules',
                    img: '/partner/random_rules.webp',
                    alt: 'Random Rules'
                },
                {
                    tooltip: 'DiceHead собирает множество информации по Dungeons & Dragons, выкладывает материалы для вдохновения и стремиться поддерживать сообщество НРИ в России.',
                    url: 'https://vk.com/dicehead_dnd?partner=ttg.club',
                    label: 'DiceHead | D&D',
                    img: '/partner/dicehead.webp',
                    alt: 'DiceHead | D&D'
                },
                {
                    tooltip: 'Короткие авторские приключения для D&D 5e и других систем.',
                    url: 'https://vk.com/ngdnd?partner=ttg.club',
                    label: 'Заметки упыря',
                    img: '/partner/ngdnd.webp',
                    alt: 'Заметки упыря | Короткие приключения | D&D'
                },
                {
                    tooltip: 'Если вы хотите украсить свой игровой стол различными игровыми предметами по настольным играм, приобрести фигурки для D&D и других игр, то вам нужна Плутовка Пэтти.',
                    url: 'https://vk.com/plutovkapetti?partner=ttg.club',
                    label: 'Плутовка Пэтти',
                    img: '/partner/plutovkapetti.webp',
                    alt: 'Плутовка Пэтти'
                },
                {
                    tooltip: 'Пятеро друзей, которые любят играть в Dungeons & Dragons. Среди них есть актёры, режиссёры, художники, и сценаристы, но в первую очередь они друзья и большие поклонники ролевых игр.',
                    url: 'https://vk.com/gryadut_priklyucheniya?partner=ttg.club',
                    label: 'Грядут Приключения',
                    img: '/partner/gryadut_priklyucheniya.webp',
                    alt: 'Грядут Приключения'
                },
                {
                    tooltip: 'Этот парень любит настольно-ролевые игры и делится своей любовью на канале, рассказывая о правилах и нюансах игры на своём опыте, да и просто веселится.',
                    url: 'https://www.youtube.com/channel/UCe_vCsHHRPT9XPVYDInQqqQ?partner=ttg.club',
                    label: 'Sneaky Dice',
                    img: '/partner/sneaky_dice.webp',
                    alt: 'Sneaky Dice'
                },
                {
                    tooltip: 'Программа DM Helpmate 2 будет полезна мастерам D&D для подготовки и проведения игр в офлайн. В ней вы сможете найти: база данных D&D 5, добавление персонажей и НПЦ, ведение тактических карт, генератор добычи и множество других вещей.',
                    url: 'https://vk.com/mastademic?partner=ttg.club',
                    label: 'DM Helpmate',
                    img: '/partner/dm_helpmate.webp',
                    alt: 'DM Helpmate'
                },
                {
                    tooltip: 'Переводы материалов для мастеров и игроков, мемы, запись на игры.',
                    url: 'https://vk.com/dndworlds?partner=ttg.club',
                    label: 'Круговорот миров',
                    img: '/partner/dndworlds.webp',
                    alt: 'Круговорот миров'
                },
                {
                    tooltip: 'Небольшая команда энтузиастов, которая хочет переводить, оформлять и делиться с вами интересными новостями, статьями, артами и прочими работами во вселенной D&D',
                    url: 'https://vk.com/myriads_of_truths?partner=ttg.club',
                    label: 'Мириады Истин',
                    img: '/partner/myriads_of_truths.webp',
                    alt: 'Мириады Истин'
                },
                {
                    tooltip: 'Создатель НРИ-контента, рисующий иконки, карты, токены и другие вещи, которые пригодятся как ГМам, так и игрокам.',
                    url: 'https://vk.com/artfilinkov?partner=ttg.club',
                    label: 'A.Filinkov',
                    img: '/partner/artfilinkov.webp',
                    alt: 'A.Filinkov'
                }
            ]);
            /* eslint-enable vue/max-len */

            const openSearchModal = () => {
                document.dispatchEvent(new Event('open-search'));
            };

            return {
                nav,
                tools,
                partners,
                openSearchModal
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
