<template>
  <div class="error-view">
    <div class="error-view__body">
      <h1>404</h1>

      <h4>
        Вы не прокинули проверку выживания, стоит вернуться к
        <router-link
          :to="{
            name: 'index'
          }"
        >
          началу
        </router-link>
      </h4>
    </div>
  </div>
</template>
