<template>
  <main-area>
    <LoadingOverlay v-if="isLoading" />
    <editor-area>
      <ResponseArea></ResponseArea>
      <ChatPanel></ChatPanel>
      <ContentActions></ContentActions>
    </editor-area>
  </main-area>
  <PopupTutorial
    :config="tutorialConfig"
    :startTutorial="startTutorial"
    tutorialId="chat"
    @close="onTutorialClose"
  />
</template>

<script>
import { ref, onMounted } from "vue";
import ResponseArea from "@/views/_components/feature/ResponseArea.vue";
import ChatPanel from "./components/ChatPanel.vue";
import ContentActions from "@/views/_components/feature/ContentActions.vue";
import LoadingOverlay from "@/views/_components/utility/LoadingOverlay.vue";
import PopupTutorial from "@/views/_components/utility/PopupTutorial.vue";
import { useTutorial } from "./useTutorial";
import store from "../../store/state";

export default {
  name: "ChatView",
  components: {
    ResponseArea,
    ChatPanel,
    ContentActions,
    PopupTutorial,
    LoadingOverlay
  },
  setup() {
    const { tutorialConfig, startTutorial, onTutorialClose } = useTutorial();

    const isLoading = ref(true);

    onMounted(() => {
      document.body.setAttribute("data-page", "chat");
      store.commit('chat/SET_PAGE', "chat");

      setTimeout(() => {
        isLoading.value = false;
      }, 500);

      setTimeout(() => {
        startTutorial.value = true;
      }, 2000);
    });

    return {
      isLoading,
      tutorialConfig,
      startTutorial,
      onTutorialClose,
    };
  },
};
</script>
