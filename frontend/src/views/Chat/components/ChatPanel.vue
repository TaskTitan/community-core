<template>
  <chat-panel>
    <div class="chat-panel-inner">
      <ModelSelector
        :provider="currentProvider"
        :model="currentModel"
        @update:provider="updateProvider"
        @update:model="updateModel"
      ></ModelSelector>
      <ChatInput />
    </div>
  </chat-panel>
</template>

<script>
import { ref, onMounted } from "vue";
import ModelSelector from "@/views/_components/feature/ModelSelector.vue";
import ChatInput from "./ChatInput.vue";

export default {
  name: "ChatPanel",
  components: {
    ModelSelector,
    ChatInput,
  },
  setup() {
    const currentProvider = ref("");
    const currentModel = ref("");
    const updateProvider = (newProvider) => {
      currentProvider.value = newProvider;
    };
    const updateModel = (newModel) => {
      currentModel.value = newModel;
    };

    onMounted(() => {
      // Set initial values
      currentProvider.value = "OpenAI";
      currentModel.value = "gpt-4o-mini";
    });

    return {
      currentProvider,
      currentModel,
      updateProvider,
      updateModel,
    };
  },
};
</script>

<style scoped>
chat-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0;
  width: fit-content;
  padding: 0;
  user-select: none;
  line-height: 150%;
}
.chat-panel-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  width: calc(800px);
  height: 100%;
  padding: 0;
  user-select: none;
  line-height: 150%;
  overflow-y: visible;
  margin: auto;
}
.separator {
  font-weight: 400;
  color: var(--color-navy);
  opacity: 0.25;
}
@media screen and (max-width: 1024px) {
  chat-panel {
    max-width: 100vw;
    width: 100%;
    height: fit-content;
  }
  .chat-panel-inner {
    padding: 8px;
    width: calc(100% - 16px);
  }
  .chat-panel-inner {
    width: 100%;
    padding: 0;
    margin: 0;
  }
  span.separator {
    display: none;
  }
}
</style>
