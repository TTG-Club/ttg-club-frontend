<template>
    <div class="error_wrapper">
        <div>
            <h1>Внимание</h1>

            <h4>
                Ошибка которую мы не знаем, посмотри <router-link :to="{ path: 'index' }">
                    в другом
                </router-link> месте.
            </h4>
        </div>
    </div>
</template>
