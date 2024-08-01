<template>
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    :class="$style['icon-loader']"
  >
    <!-- eslint-disable vue/max-len -->
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1773 4.318 16.1624 5.66425 17.6665C7.22137 19.4063 9.48263 20.5 12 20.5C12.2761 20.5 12.5 20.7239 12.5 21C12.5 21.2761 12.2761 21.5 12 21.5C9.18637 21.5 6.65791 20.2762 4.91911 18.3335C3.41512 16.6531 2.5 14.4328 2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12C21.5 12.2761 21.2761 12.5 21 12.5C20.7239 12.5 20.5 12.2761 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5Z"
    />
    <!-- eslint-enable vue/max-len -->
  </svg>
</template>

<style module lang="scss">
  .icon-loader {
    width: 100%;
    height: 100%;
    transition: none;
    animation: {
      delay: 0s;
      duration: 1s;
      iteration-count: infinite;
      name: loading-rotate;
      play-state: running;
      timing-function: linear;
    }

    path {
      fill: currentcolor;
    }
  }

  @keyframes loading-rotate {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>
