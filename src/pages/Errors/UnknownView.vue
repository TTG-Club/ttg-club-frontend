<template>
  <div class="error-view">
    <div class="error-view__body">
      <h1>Внимание</h1>

      <h4>
        Ошибка которую мы не знаем, посмотри
        <router-link :to="{ path: 'index' }"> в другом </router-link>
        месте
      </h4>
    </div>
  </div>
</template>
