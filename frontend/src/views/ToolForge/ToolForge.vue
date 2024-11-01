<template>
  <main-area>
    <LoadingOverlay v-if="isLoading" />
    <ToolPanel></ToolPanel>
    <editor-area>
      <ResponseArea @content-loaded="onResponseAreaLoaded"></ResponseArea>
      <ContentActions></ContentActions>
    </editor-area>
  </main-area>
  <div
    id="generating-modal"
    class="modal"
    style="display: none; user-select: none"
  >
    <div class="modal-content">
      <p>Generating Template, Please Wait...</p>
    </div>
  </div>
  <PopupTutorial
    :config="tutorialConfig"
    :startTutorial="startTutorial"
    tutorialId="toolForge"
    @close="onTutorialClose"
  />
</template>

<script>
import { onMounted, ref } from "vue";
import ContentActions from "./components/ContentActions/ContentActions.vue";
import ResponseArea from "./components/ResponseArea/ResponseArea.vue";
import ToolPanel from "./components/ToolPanel/ToolPanel.vue";
import PopupTutorial from "@/views/_components/utility/PopupTutorial.vue";
import LoadingOverlay from "@/views/_components/utility/LoadingOverlay.vue";
import useToolForge from "./useToolForge";

export default {
  name: "ToolForge",
  components: {
    ContentActions,
    ResponseArea,
    ToolPanel,
    PopupTutorial,
    LoadingOverlay,
  },
  setup() {
    const {
      tutorialConfig,
      startTutorial,
      onTutorialClose,
      initializeToolForge,
    } = useToolForge();

    const isLoading = ref(true);

    const onResponseAreaLoaded = () => {
      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    };

    onMounted(() => {
      initializeToolForge();
    });

    return {
      tutorialConfig,
      startTutorial,
      onTutorialClose,
      isLoading,
      onResponseAreaLoaded,
    };
  },
};
</script>