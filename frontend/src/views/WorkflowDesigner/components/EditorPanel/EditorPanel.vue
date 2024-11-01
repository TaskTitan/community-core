<template>
  <div id="editor-panel" v-if="isOpen" :class="{ 'full-screen': isFullScreen }">
    <div class="panel-header">
      <h2 class="title">/ {{ panelTitle }}</h2>
      <div class="right-tabs">
        <button
          v-for="tab in visibleTabs"
          :key="tab.name"
          class="tab-button"
          :class="{ active: activeTab === tab.name }"
          @click="setActiveTab(tab.name)"
        >
          <!-- <img :src="tab.icon" :alt="tab.name" :title="tab.title" /> -->
          <SvgIcon :name="tab.icon" :title="tab.title" />
        </button>
        <button
          class="tab-button"
          :class="{ active: isFullScreen }"
          @click="toggleFullScreen"
          :title="isFullScreen ? 'Contract Panel' : 'Expand Panel'"
        >
          <i :class="isFullScreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
        </button>
      </div>
    </div>
    <div class="panel-body" v-if="selectedNodeContent || selectedEdgeContent">
      <template v-if="selectedNodeContent && selectedNodeContent.error">
        <div class="error-message">
          <h3>Error:</h3>
          <p>{{ selectedNodeContent.error }}</p>
        </div>
      </template>
      <PanelTab
        :node-content="selectedNodeContent"
        :edge-content="selectedEdgeContent"
        :active-tab="activeTab"
        :tool-library="toolLibrary"
        :nodes="nodes"
        :node-output="selectedNodeContent ? selectedNodeContent.output : null"
        :customTools="customTools"
        :workflowId="workflowId"
        @update:nodeContent="updateNodeContent"
        @update:edgeContent="updateEdgeContent"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from "vue";
import PanelTab from "./components/PanelTab.vue";
import toolLibrary from "../../tools/toolLibrary.json";
import SvgIcon from "@/views/_components/common/SvgIcon.vue";

export default defineComponent({
  name: "EditorPanel",
  components: {
    PanelTab,
    SvgIcon,
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    selectedNodeContent: {
      type: Object,
      default: null,
    },
    selectedEdgeContent: {
      type: Object,
      default: null,
    },
    nodes: {
      type: Array,
      required: true,
    },
    customTools: {
      type: Array,
      default: () => [],
    },
    workflowId: {
      type: String,
      default: null,
    },
  },
  setup(props, { emit }) {
    const activeTab = ref("parameters");
    const isFullScreen = ref(false);
    const customTools = ref(props.customTools);

    const tabs = [
      {
        name: "parameters",
        icon: "params",
        title: "Node Parameters",
      },
      {
        name: "outputs",
        icon: "output",
        title: "Node Outputs",
      },
    ];

    // Watch for changes in selectedEdgeContent
    watch(
      () => props.selectedEdgeContent,
      (newEdgeContent) => {
        if (newEdgeContent) {
          activeTab.value = "parameters";
        }
      }
    );

    watch(
      () => props.customTools,
      (newCustomTools) => {
        customTools.value = newCustomTools;
      }
    );

    const visibleTabs = computed(() => {
      if (props.selectedEdgeContent) {
        return tabs.filter((tab) => tab.name === "parameters");
      }
      return tabs;
    });

    const setActiveTab = (tabName) => {
      activeTab.value = tabName;
    };

    const panelTitle = computed(() => {
      if (props.selectedEdgeContent) {
        return "Edge Parameters";
      }
      const tab = tabs.find((t) => t.name === activeTab.value);
      return tab ? tab.title : "Edit Module";
    });

    const toggleFullScreen = () => {
      isFullScreen.value = !isFullScreen.value;
    };

    const closeModuleModal = () => {
      emit("update:isOpen", false);
      emit("deselect-all-nodes");
    };

    const updateNodeContent = (newContent) => {
      emit("update:nodeContent", newContent);
    };

    const updateEdgeContent = (newContent) => {
      emit("update:edgeContent", newContent);
    };

    return {
      activeTab,
      visibleTabs,
      setActiveTab,
      panelTitle,
      closeModuleModal,
      updateNodeContent,
      updateEdgeContent,
      toolLibrary,
      isFullScreen,
      toggleFullScreen,
      customTools,
    };
  },
});
</script>

<style scoped>
#editor-panel {
  position: fixed;
  top: 48px;
  right: 0;
  width: 640px;
  max-width: calc(100% - 144px);
  height: fit-content;
  /* max-height: calc(100% - 98px); */
  max-height: calc(100% - 80px);
  overflow: scroll;
  background: transparent;
  /* border: 2px solid var(--color-pink); */
  border-radius: 8px;
  padding: 16px;
  gap: 12px;
  display: flex;
  flex-direction: column;
  z-index: 99;
  color: var(--Dark-Navy, #01052a);
}

#editor-panel.full-screen {
  width: calc(100% - 144px);
  /* height: calc(100% - 96px); */
}

#editor-panel .right-tabs button i {
  color: var(--color-dark-navy);
  font-size: 17px;
  opacity: 0.75;
}

body.dark #editor-panel .right-tabs button i {
  color: var(--color-med-navy);
}

/* div#editor-panel.fullscreen {
      width: calc(100% - 81px);
      height: fit-content;
      max-height: calc(100% - 108px);
  } */

.panel-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: nowrap;
  align-content: center;
  align-items: center;
  user-select: none;
}

.panel-header .title {
  color: #e53d8f;
  font-family: "League Spartan";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  letter-spacing: 0.48px;
}

.panel-body {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: var(--color-dull-white);
  border: 1px solid var(--color-light-navy);
  border-radius: 8px;
  overflow: scroll;
}

#editor-panel.full-screen .panel-body {
  height: 100%;
  overflow: scroll;
}

body.dark #editor-panel.full-screen .panel-body {
  background: var(--color-ultra-dark-navy);
}

.panel-body label {
  font-weight: 400;
  user-select: none;
}

.panel-body .title {
  user-select: none;
}

.right-tabs {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-right: 2px;
}

.tab-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.tab-button:hover,
.tab-button.active {
  opacity: 1;
}

.capitalize {
  text-transform: capitalize;
}

.error-message {
  color: #fe4e4e;
}

.error-message p {
  margin-top: 8px;
  color: #fe4e4e;
  font-family: monospace;
  padding: 3px 8px;
  border: 1px solid var(--color-light-navy);
  border-radius: 8px;
  /* animation: error-breathe-inset 1s ease-in-out infinite; */
  border-color: #fe4e4e;
  background: var(--color-bright-light-navy);
  overflow-wrap: anywhere;
}

.output-message p {
  margin-top: 8px;
  font-family: monospace;
  padding: 6px 8px;
  border: 1px solid var(--color-light-navy);
  /* border-color: limegreen; */
  border-radius: 8px;
  background: var(--color-bright-light-navy);
}

.hr {
  width: 100%;
  border-bottom: 1px solid #ddd;
}

body.dark .hr {
  border-bottom: 1px solid var(--color-dull-navy);
}

body.dark .error-message p,
body.dark .output-message p {
  border: 1px solid var(--color-dull-navy);
  background: transparent;
}
</style>
