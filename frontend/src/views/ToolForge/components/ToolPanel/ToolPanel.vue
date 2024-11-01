<template>
  <editor-panel>
    <top-section>
      <TopMenu
        :selectedTool="selectedTool"
        :formData="formData"
        @tool-selected="onToolSelected"
        @clear-fields="clearFields"
      />
      <FieldsArea
        ref="toolFields"
        :formData="formData"
        @form-updated="onFormUpdated"
      />
    </top-section>
    <bottom-menu>
      <button id="generate" class="generate" @click="handleGenerateClick">
        <img src="@/assets/icons/create-light.svg" alt="" />Run Tool
      </button>
    </bottom-menu>
  </editor-panel>
</template>

<script>
import { provide, onMounted } from "vue";
import TopMenu from "./components/TopMenu/TopMenu.vue";
import FieldsArea from "./components/FieldsArea/FieldsArea.vue";
import { useToolPanel } from "./useToolPanel";

export default {
  name: "ToolPanel",
  components: {
    TopMenu,
    FieldsArea,
  },
  setup() {
    const {
      selectedTool,
      formData,
      templates,
      handleGenerateClick,
      onFormUpdated,
      onToolGenerated,
      onToolSelected,
      onToolSaved,
      onToolDeleted,
      clearFields,
      saveFormDataToDB,
      confirmDelete,
      importTemplate,
      shareTemplate,
      fetchTemplates,
      loadToolById
    } = useToolPanel();

    provide("toolActions", {
      selectedTool,
      formData,
      fetchTemplates,
      saveFormDataToDB,
      confirmDelete,
      importTemplate,
      shareTemplate,
      clearFields,
      onToolGenerated,
      onToolSaved,
      onToolDeleted,
    });

    provide("toolSelector", {
      templates,
      selectedTemplate: selectedTool,
      onTemplateSelected: onToolSelected,
    });

    onMounted(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const toolId = urlParams.get('tool-id');
      if (toolId) {
        loadToolById(toolId);
      }
    });

    return {
      selectedTool,
      formData,
      handleGenerateClick,
      onFormUpdated,
      onToolSelected,
      clearFields
    };
  },
};
</script>

<style scoped>
top-section {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  height: -webkit-fill-available;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  overflow-y: scroll;
  background: transparent;
}

top-section::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
