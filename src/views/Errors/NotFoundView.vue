<template>
    <div class="error_wrapper">
        <div>
            <h1>404</h1>

            <h4>
                Вы не прокинули проверку выживания, стоит вернуться к <router-link
                    :to="{
                        name: 'index',
                    }"
                >
                    началу
                </router-link>.
            </h4>
        </div>
    </div>
</template>
