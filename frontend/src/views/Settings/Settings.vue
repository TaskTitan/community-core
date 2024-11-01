<template>
  <main-area>
    <LoadingOverlay v-if="isLoading" />
    <settings-panel>
      <AuthSection></AuthSection>
      <inner-setting-panel>
        <DarkModeToggle />
      </inner-setting-panel>
      <inner-setting-panel class="label credits-bottom">
        <div class="credits">
          <span>a creation by <a href="https://x.com/NathanWilbanks_" target="_blank">@NathanWilbanks</a></span>
          <a href="https://github.com/TaskTitan/community-core" target="_blank" class="github-link">
            <SvgIcon name="github" />
          </a>
          <a href="https://discord.gg/nwXJMnHmXP" target="_blank" class="discord-link">
            <SvgIcon name="discord" />
          </a>
        </div>
      </inner-setting-panel>
    </settings-panel>
  </main-area>
</template>

<script>
import { ref, onMounted } from "vue";
import AuthSection from "./components/AuthSection/AuthSection.vue";
import DarkModeToggle from "./components/DarkMode/DarkModeToggle.vue";
import PopupTutorial from "@/views/_components/utility/PopupTutorial.vue";
import LoadingOverlay from "@/views/_components/utility/LoadingOverlay.vue";
import SvgIcon from "@/views/_components/common/SvgIcon.vue";

export default {
  name: "SettingsView",
  components: {
    AuthSection,
    DarkModeToggle,
    PopupTutorial,
    LoadingOverlay,
    SvgIcon
  },
  setup() {
    const isLoading = ref(true);
    onMounted(() => {
      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    });
    return {
      isLoading,
    };
  },
};
</script>

<style scoped>
settings-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  overflow-y: scroll;
  width: calc(100%);
  min-height: 100%;
  background: var(--color-dull-white);
}

inner-setting-panel {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  width: calc(100% - 32px);
  border-top: 1px solid var(--color-light-navy);
}

body.dark settings-panel {
  background: var(--color-ultra-dark-navy);
}

body.dark inner-setting-panel {
  border-top: 1px solid var(--color-dull-navy);
}

inner-setting-panel.label.credits-bottom {
  position: absolute;
  bottom: 0;
}

inner-setting-panel.label.credits-bottom .credits {
  display: flex;
  font-weight: 400;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.credits-bottom a {
  color: var(--color-pink);
  font-weight: 500;
}

body.dark .credits-bottom a {
  color: var(--color-green);
  font-weight: 300;
}
</style>