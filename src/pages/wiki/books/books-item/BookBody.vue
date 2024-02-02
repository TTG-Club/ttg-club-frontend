<script>
  import RawContent from '@/shared/ui/RawContent.vue';

  import DetailTopBar from '@/features/DetailTopBar.vue';

  export default {
    name: 'BookBody',
    components: {
      DetailTopBar,
      RawContent,
    },
    props: {
      book: {
        type: Object,
        default: undefined,
        required: true,
      },
    },
  };
</script>

<template>
  <div class="book-body">
    <detail-top-bar :left="book.type.name">
      <template
        v-if="book.source?.shortName"
        #default
      >
        Аббревиатура: {{ book.source.shortName }}
      </template>
    </detail-top-bar>

    <div class="content-padding">
      <raw-content
        v-if="book?.description"
        :template="book.description"
      />
    </div>
  </div>
</template>
