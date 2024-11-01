<template>
  <LeftSidebar></LeftSidebar>
  <RouterView />
</template>

<script setup>
import LeftSidebar from '@/views/_components/layout/LeftSidebar.vue';
import { RouterView } from 'vue-router';
</script>

<style scoped></style>
