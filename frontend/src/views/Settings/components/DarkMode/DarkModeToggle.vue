<template>
  <div class="field-group">
    <button
      @click="toggleDarkMode"
      class="dark-mode-toggle"
      :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    >
      <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
    </button>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  name: "DarkModeToggle",
  computed: {
    ...mapGetters("theme", ["isDarkMode"]),
  },
  methods: {
    ...mapActions("theme", ["toggleDarkMode"]),
  },
};
</script>

<style scoped>
.dark-mode-toggle {
  color: var(--color-dark-navy);
  border: none;
  padding: 4px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

body.dark .dark-mode-toggle {
  color: var(--color-dull-white);
}
</style>
