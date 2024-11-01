<template>
  <SharedResponseArea @content-loaded="onContentLoaded" />
</template>

<script>
import SharedResponseArea from "@/views/_components/feature/ResponseArea.vue";

export default {
  name: "ResponseArea",
  components: {
    SharedResponseArea,
  },
  methods: {
    onContentLoaded() {
      this.$emit('content-loaded');
    }
  }
};
</script>