<template>
  <div class="error-view">
    <div class="error-view__body">
      <h1>401</h1>

      <h4>
        Вы не прокинули проверку Расследования, у вас нет доступа к этой тайне,
        стоит вернуться к
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
