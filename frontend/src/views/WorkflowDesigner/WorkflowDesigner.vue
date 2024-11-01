<template>
  <div class="node-based-tool">
    <LoadingOverlay v-if="isLoading" />
    <ToolSidebar></ToolSidebar>
    <div class="canvas-state-controls">
      <div id="workflow-name">{{ workflowName }}</div>
      <button
        @click="toggleTinyNodeMode"
        :title="
          isTinyNodeMode ? 'Disable Tiny Node Mode' : 'Enable Tiny Node Mode'
        "
      >
        <i :class="['fas', isTinyNodeMode ? 'fa-expand' : 'fa-compress']"></i>
      </button>
      <WorkflowGenerator
        @workflow-generated="handleWorkflowGenerator"
        @update-active-workflow-id="updateActiveWorkflowId"
      ></WorkflowGenerator>
      <WorkflowEngine
        :edges="edges"
        :canvasRef="canvasRef"
        :workflowId="activeWorkflowId"
        :workflowStatus="workflowStatus"
        @animation-state-changed="updateAnimationState"
        @workflow-started="handleWorkflowStarted"
        @workflow-error="handleWorkflowError"
        @workflow-stopped="handleWorkflowStopped"
        @workflow-id-set="setActiveWorkflowId"
        @workflow-status-update="handleWorkflowStatusUpdate"
      />
      <button
        id="save-workflow"
        @click="saveCanvasState(false, false)"
        title="Save Workflow"
      >
        <i class="fas fa-save"></i>
      </button>
      <button
        id="delete-workflow"
        @click="deleteWorkflow"
        title="Delete Workflow"
      >
        <i class="fas fa-trash"></i>
      </button>
      <button
        id="toggle-shareable"
        @click="toggleShareable"
        :title="isShareable ? 'Make Private' : 'Make Shareable'"
      >
        <i :class="['fas', isShareable ? 'fa-lock-open' : 'fa-lock']"></i>
      </button>
      <button
        id="import-workflow"
        @click="importWorkflow"
        title="Import Workflow"
      >
        <i class="fas fa-download"></i>
      </button>
      <!-- LOADS WORKFLOW FROM LOCALSTORAGE -->
      <!-- <button id="load-workflow" @click="loadCanvasState" title="Load Workflow">
        <i class="fas fa-download"></i>
      </button> -->
    </div>
    <Canvas
      ref="canvas"
      :nodes="nodes"
      :edges="edges"
      :gridSize="gridSize"
      :isAnimating="isAnimating"
      :zoomLevel="zoomLevel"
      :selectedEdgeId="selectedEdgeId"
      :selectedNodeIndex="selectedNodeIndex"
      :isTinyNodeMode="isTinyNodeMode"
      :nodeWidth="nodeWidth"
      @update:nodes="nodes = $event"
      @update:edges="edges = $event"
      @update:zoomLevel="zoomLevel = $event"
      @select-node="selectNode"
      @select-edge="selectEdge"
      @deselect-all-nodes="deselectAllNodes"
      @deselect-all-edges="deselectAllEdges"
      @create-edge="createEdge"
      @update-edges="updateEdges"
      @create-node="createNode"
      @start-editing="startEditing"
      @finish-editing="finishEditing"
      @delete-node="deleteNode"
      @delete-selected-edge="deleteSelectedEdge"
      @delete-selected-node="deleteSelectedNode"
    />
    <EditorPanel
      :nodes="nodes"
      :isOpen.sync="isModuleModalOpen"
      :selectedNodeContent="selectedNodeContent"
      :selectedEdgeContent="selectedEdgeContent"
      :customTools="customTools"
      :workflowId="activeWorkflowId"
      @update:nodeContent="updateNodeContent"
      @update:edgeContent="updateEdgeContent"
      @deselect-all-nodes="deselectAllNodes"
    ></EditorPanel>
  </div>
  <div
    id="generating-modal"
    class="modal"
    style="display: none; user-select: none"
  >
    <div class="modal-content">
      <p>Generating Workflow, Please Wait...</p>
    </div>
  </div>
  <PopupTutorial
    :config="tutorialConfig"
    :startTutorial="startTutorial"
    tutorialId="workflowDesigner"
    @close="onTutorialClose"
  />
</template>

<script>
import { useRoute } from "vue-router";
import { ref, onMounted, watch } from "vue";

import ToolSidebar from "./components/ToolSidebar/ToolSidebar.vue";
import Canvas from "./components/Canvas/Canvas.vue";
import EditorPanel from "./components/EditorPanel/EditorPanel.vue";
import WorkflowGenerator from "./components/WorkflowActions/WorkflowGenerator/WorkflowGenerator.vue";
import WorkflowEngine from "./components/WorkflowActions/WorkflowEngine/WorkflowEngine.vue";
import toolLibrary from "./tools/toolLibrary.json";
import generateUUID from "@/views/_utils/generateUUID.js";
import LoadingOverlay from "@/views/_components/utility/LoadingOverlay.vue";
import PopupTutorial from "@/views/_components/utility/PopupTutorial.vue";
import useWorkflowDesigner from "./useWorkflowDesigner";
import { API_CONFIG } from "@/tt.config.js";

export default {
  name: "WorkflowDesignerView",
  components: {
    ToolSidebar,
    Canvas,
    EditorPanel,
    WorkflowGenerator,
    WorkflowEngine,
    PopupTutorial,
    LoadingOverlay
  },
  data() {
    return {
      nodes: [],
      edges: [],
      isAnimating: false,
      gridSize: 16,
      nodeWidth: 288, // THIS IS 288 NORMALLY, 48 IN TINY MODE
      nodeHeight: 48,
      isTinyNodeMode: false,
      isModuleModalOpen: false,
      selectedNode: null,
      selectedNodeIndex: null,
      selectedEdge: null,
      selectedEdgeIndex: null,
      selectedEdgeId: null,
      zoomLevel: 1,
      workflowId: null,
      workflowError: null,
      activeWorkflowId: null,
      workflowStatus: null,
      nodeOutputs: {},
      nodeErrors: {},
      workflowName: "My Workflow",
      pollingTimer: null,
      customTools: [],
    };
  },
  computed: {
    selectedNodeContent() {
      return this.selectedNode ? { ...this.selectedNode } : null;
    },
    selectedEdgeContent() {
      return this.selectedEdge ? { ...this.selectedEdge } : null;
    },
    canvasRef() {
      return this.$refs.canvas ? this.$refs.canvas.$el : null;
    },
  },
  methods: {
    createNode(data, x, y) {
      const isLabel = data.type === "label";
      let nodeData = null;

      // Find the node data in the toolLibrary
      for (const category in toolLibrary) {
        const foundNode = toolLibrary[category].find(
          (node) => node.type === data.type
        );
        if (foundNode) {
          nodeData = foundNode;
          break;
        }
      }

      // If not found in toolLibrary, check in custom tools
      if (!nodeData) {
        nodeData = this.customTools.find((tool) => tool.type === data.type);
      }

      if (!nodeData && !isLabel) {
        console.error(
          `Node type ${data.type} not found in toolLibrary or custom tools`
        );
        return;
      }

      const newNode = {
        id: generateUUID(),
        text: isLabel ? "Text Label" : nodeData.title,
        x: Math.round((x - this.nodeWidth / 2) / this.gridSize) * this.gridSize,
        y:
          Math.round((y - this.nodeHeight / 2) / this.gridSize) * this.gridSize,
        isEditing: false,
        type: data.type,
        icon: isLabel ? "text" : nodeData.icon,
        category: data.category,
        isSelected: false,
        parameters: {}, // Initialize an empty parameters object
        description: nodeData.description,
        error: null,
      };

      // Initialize parameters with default values
      if (nodeData && nodeData.parameters) {
        for (const key in nodeData.parameters) {
          if (nodeData.category === "custom") {
            // For custom tools
            if (
              typeof nodeData.parameters[key] === "object" &&
              nodeData.parameters[key].value !== undefined
            ) {
              newNode.parameters[key] = {
                ...nodeData.parameters[key],
                value: nodeData.parameters[key].value,
              };
            } else {
              newNode.parameters[key] = nodeData.parameters[key];
            }
          } else {
            // For standard tools
            newNode.parameters[key] = nodeData.parameters[key].default || "";
            if (nodeData.parameters[key].inputType === "select") {
              newNode.parameters[key + "_options"] =
                nodeData.parameters[key].options;
            }
          }
        }
      }

      // Set outputs for custom tools
      if (nodeData.category === "custom") {
        newNode.outputs = {
          generatedText: { type: "string" },
          tokenCount: { type: "number" },
          error: { type: "string" },
        };
      } else {
        newNode.outputs = nodeData.outputs;
      }

      this.nodes.push(newNode);
      const newNodeIndex = this.nodes.length - 1;

      if (isLabel) {
        setTimeout(() => {
          this.startEditing(newNodeIndex);
        }, 100);
      }

      return newNodeIndex;
    },
    selectNode(index) {
      this.deselectAllNodes();
      this.nodes.forEach((node, i) => {
        node.isSelected = i === index;
      });
      this.selectedNodeIndex = index;
      this.selectedNode = { ...this.nodes[index] };
      this.isModuleModalOpen = true;
      this.deselectAllEdges();
    },
    updateNodeContent(updatedContent) {
      if (this.selectedNodeIndex !== null) {
        this.nodes[this.selectedNodeIndex] = {
          ...this.nodes[this.selectedNodeIndex],
          text: updatedContent.text,
          type: updatedContent.type,
          description: updatedContent.description,
          parameters: { ...updatedContent.parameters },
        };
        this.selectedNode = { ...this.nodes[this.selectedNodeIndex] };
        this.$emit("update:nodes", [...this.nodes]);
      }
    },
    selectEdge(edgeId) {
      if (this.selectedEdgeId === edgeId) {
        this.deselectAllEdges();
      } else {
        this.selectedEdgeId = edgeId;
        this.selectedEdge = this.edges.find((e) => e.id === edgeId);
        this.isModuleModalOpen = true;
        this.deselectAllNodes();
      }
    },
    updateEdgeContent(updatedContent) {
      if (this.selectedEdgeId) {
        const edgeIndex = this.edges.findIndex(
          (e) => e.id === this.selectedEdgeId
        );
        if (edgeIndex !== -1) {
          this.edges[edgeIndex] = {
            ...this.edges[edgeIndex],
            ...updatedContent,
          };
          this.selectedEdge = { ...this.edges[edgeIndex] };
          // Force a re-render of the edges
          this.edges = [...this.edges];
        }
      }
    },
    deselectAllNodes() {
      this.nodes.forEach((node) => {
        node.isSelected = false;
      });
      this.selectedNode = null;
      this.selectedNodeIndex = null;
    },
    deselectAllEdges() {
      this.selectedEdgeId = null;
      this.selectedEdge = null;
      if (this.isModuleModalOpen && !this.selectedNode) {
        this.isModuleModalOpen = false;
      }
    },
    clearSelection() {
      // Force focus with blur on next tick when click away
      this.$nextTick(() => {
        if (document.activeElement) {
          document.activeElement.blur();
        }
      });

      if (window.getSelection) {
        if (window.getSelection().empty) {
          // Chrome
          window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
          // Firefox
          window.getSelection().removeAllRanges();
        }
      } else if (document.selection) {
        // IE
        document.selection.empty();
      }
    },
    deleteNode(index) {
      const confirmed = confirm("Are you sure you want delete this node?");
      if (confirmed) {
        const nodeId = this.nodes[index].id;

        // Remove all edges connected to this node
        this.edges = this.edges.filter(
          (edge) => edge.start.id !== nodeId && edge.end.id !== nodeId
        );

        // Remove the node
        this.nodes.splice(index, 1);

        // Update the edges
        this.updateEdges();

        // Close the module modal if it's open
        this.isModuleModalOpen = false;

        // Deselect all nodes
        this.deselectAllNodes();

        // Force a re-render of the nodes
        this.$nextTick(() => {
          this.nodes = [...this.nodes];
        });
      }
    },
    startEditing(index) {
      this.nodes[index].isEditing = true;
      this.deselectAllNodes();
      this.selectNode(index);
    },
    finishEditing(index, content) {
      console.log("finished editing!");
      this.nodes[index].isEditing = false;
      this.nodes[index].text = content;
      if (this.selectedNode && this.selectedNode.index === index) {
        this.selectedNode = { ...this.nodes[index] };
      }
      // this.selectNode(index);
    },
    createEdge(start, end) {
      const newEdge = {
        id: generateUUID(),
        start: { id: start.nodeId, type: start.type },
        end: { id: end.nodeId, type: end.type },
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        isActive: false,
      };
      this.updateEdgeCoordinates(newEdge);
      this.edges.push(newEdge);
    },
    updateEdges() {
      this.edges = this.edges.filter((edge) => {
        const startNode = this.nodes.find((node) => node.id === edge.start.id);
        const endNode = this.nodes.find((node) => node.id === edge.end.id);
        return startNode && endNode;
      });

      this.edges.forEach((edge) => {
        this.updateEdgeCoordinates(edge);
      });
    },
    deleteSelectedNode(index) {
      this.deleteNode(index);
    },
    deleteSelectedEdge() {
      if (this.selectedEdgeId) {
        const confirmed = confirm("Are you sure you want to delete this edge?");
        if (confirmed) {
          this.edges = this.edges.filter(
            (edge) => edge.id !== this.selectedEdgeId
          );
          this.selectedEdgeId = null;
          this.selectedEdge = null;
          this.isModuleModalOpen = false;
          // Update the edges directly instead of emitting an event
          this.$nextTick(() => {
            this.updateEdges();
          });
        }
      }
    },
    updateEdgeCoordinates(edge) {
      const startNode = this.nodes.find((node) => node.id === edge.start.id);
      const endNode = this.nodes.find((node) => node.id === edge.end.id);

      // If either the start or end node doesn't exist, return early
      if (!startNode || !endNode) {
        console.warn("Start or end node not found for edge:", edge);
        return;
      }

      const nodeWidth = this.nodeWidth; // CHANGE THIS TO 48 IF TINY NODE ENABLED, 288 IF REGULAR
      const nodeHeight = this.nodeHeight;

      if (edge.start.type === "output") {
        edge.startX = startNode.x + nodeWidth;
        edge.startY = startNode.y + nodeHeight / 2;
      } else {
        edge.startX = startNode.x;
        edge.startY = startNode.y + nodeHeight / 2;
      }

      if (edge.end.type === "input") {
        edge.endX = endNode.x;
        edge.endY = endNode.y + nodeHeight / 2;
      } else {
        edge.endX = endNode.x + nodeWidth;
        edge.endY = endNode.y + nodeHeight / 2;
      }
    },
    updateAnimationState(isAnimating) {
      this.isAnimating = isAnimating;
    },
    handleWorkflowGenerator(workflowData) {
      // Clear existing nodes and edges
      this.nodes = [];
      this.edges = [];

      this.updateActiveWorkflowId(workflowData.id);

      // Populate new nodes and edges
      this.nodes = workflowData.nodes.map((node) => {
        const nodeDetails = this.getNodeDetails(node.type);
        const initializedOutputs = {};
        const initializedParameters = {};

        // Initialize outputs with default values
        if (nodeDetails.outputs) {
          for (const [key, value] of Object.entries(nodeDetails.outputs)) {
            initializedOutputs[key] = this.getDefaultValueForType(value.type);
          }
        }

        // Initialize parameters with existing values or default values
        if (nodeDetails.parameters) {
          for (const [key, param] of Object.entries(nodeDetails.parameters)) {
            initializedParameters[key] = this.getDefaultValueForParameter(
              param,
              node.parameters[key]
            );
          }
        }

        return {
          ...node,
          icon: nodeDetails.icon,
          parameters: initializedParameters,
          outputs: initializedOutputs,
          description: node.description || nodeDetails.description,
        };
      });

      this.edges = workflowData.edges;

      // Update canvas transform
      this.$nextTick(() => {
        this.$refs.canvas.zoomLevel = workflowData.zoomLevel;
        this.$refs.canvas.canvasOffsetX = workflowData.canvasOffsetX;
        this.$refs.canvas.canvasOffsetY = workflowData.canvasOffsetY;
        this.$refs.canvas.updateCanvasTransform();
      });
    },
    setWorkflowId(id) {
      this.workflowId = id;
    },
    updateActiveWorkflowId(id) {
      this.activeWorkflowId = id;
      localStorage.setItem("activeWorkflow", id);
    },
    async toggleShareable() {
      this.isShareable = !this.isShareable;
      if (this.isShareable) {
        await this.saveCanvasState(false, true);
      } else {
        alert("Workflow is now private.");
        await this.saveCanvasState(true, false);
      }
    },
    async saveCanvasState(silent = false, isSharing = false) {
      this.deselectAllNodes();
      this.deselectAllEdges();

      // Get the current workflow state from localStorage
      const currentState = localStorage.getItem("canvasState");
      let currentName = "My Workflow";

      if (currentState) {
        const parsedState = JSON.parse(currentState);
        // Check if the name is directly in the state or in the workflow object
        currentName =
          parsedState.name ||
          (parsedState.workflow && parsedState.workflow.name) ||
          currentName;
      }

      let newWorkflowName = this.workflowName;

      if (!silent && !isSharing) {
        // Only prompt for name if not silent and not sharing
        // Prompt for workflow name, pre-filled with the current name
        newWorkflowName = prompt(
          "Enter a name for your workflow:",
          newWorkflowName
        );

        // If user cancels the prompt, abort the save operation
        if (newWorkflowName === null) {
          return;
        }
      }

      // Get the active workflow ID from localStorage
      const activeWorkflowId = localStorage.getItem("activeWorkflow");

      // Generate a new ID if there's no active workflow ID
      const workflowId = activeWorkflowId || generateUUID();

      // Update the workflowName using the method from setup
      this.updateWorkflowName(newWorkflowName);

      const state = {
        id: activeWorkflowId,
        name: newWorkflowName,
        nodes: this.nodes.map((node) => ({
          ...node,
          parameters: { ...node.parameters },
          outputs: { ...node.outputs },
        })),
        edges: this.edges,
        zoomLevel: this.zoomLevel,
        canvasOffsetX: this.$refs.canvas.canvasOffsetX,
        canvasOffsetY: this.$refs.canvas.canvasOffsetY,
        isTinyNodeMode: this.isTinyNodeMode,
        isShareable: this.isShareable,
        customTools: isSharing ? this.getCustomToolsUsedInWorkflow() : [],
      };
      const stateString = JSON.stringify(state);

      // Save to localStorage
      localStorage.setItem("canvasState", stateString);
      localStorage.setItem("activeWorkflow", workflowId);
      this.workflowId = workflowId;

      // Save to database
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Always save locally
        const localEndpoint = this.getEndpoint("save");
        await fetch(`${localEndpoint}/api/workflows/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ workflow: state }),
        });

        // Always save to the remote endpoint, regardless of isSharing
        const remoteEndpoint = this.getEndpoint("share");
        const shareResponse = await fetch(
          `${remoteEndpoint}/api/workflows/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ workflow: state }),
          }
        );

        if (!shareResponse.ok) {
          const errorData = await shareResponse.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${shareResponse.status}`
          );
        }

        const shareData = await shareResponse.json();
        const sharedId = shareData.workflowId;

        if (!silent) {
          if (isSharing) {
            await navigator.clipboard.writeText(sharedId);
            alert(
              `Workflow shared successfully! Shared ID copied to clipboard: ${sharedId}`
            );
          } else {
            alert(`Workflow "${this.workflowName}" saved and privacy updated.`);
          }
        }
        console.log(
          isSharing ? "Workflow shared:" : "Workflow privacy updated:",
          sharedId || state.id
        );
      } catch (error) {
        console.error(
          isSharing
            ? "Error sharing workflow:"
            : "Error saving workflow to database:",
          error
        );
        alert(
          `Workflow "${this.workflowName}" failed to ${
            isSharing ? "share" : "save"
          }. Please try again.`
        );
      }
    },
    getCustomToolsUsedInWorkflow() {
      const customToolTypes = this.nodes
        .filter((node) => node.category === "custom")
        .map((node) => node.type);

      return this.customTools.filter((tool) =>
        customToolTypes.includes(tool.type)
      );
    },
    importWorkflow() {
      const workflowId = prompt("Enter the shared workflow ID to import:");
      if (workflowId) {
        this.loadWorkflow(`shared_${workflowId}`);
      }
    },
    loadCanvasState() {
      const stateString = localStorage.getItem("canvasState");
      if (stateString) {
        const state = JSON.parse(stateString);

        // Update the workflowName from the loaded state
        this.updateWorkflowName(state.name || "My Workflow");

        // Update shareable status
        this.isShareable = state.isShareable || false;

        // Update isTinyNodeMode and nodeWidth based on the saved state
        this.isTinyNodeMode = state.isTinyNodeMode;
        this.nodeWidth = this.isTinyNodeMode ? 48 : 288;

        state.nodes = state.nodes.map((node) => {
          const nodeDetails = this.getNodeDetails(node.type);
          const initializedOutputs = {};
          const initializedParameters = { ...node.parameters }; // Preserve existing parameters

          // Initialize outputs with default values
          if (nodeDetails.outputs) {
            for (const [key, value] of Object.entries(nodeDetails.outputs)) {
              initializedOutputs[key] = this.getDefaultValueForType(value.type);
            }
          }

          // Initialize new parameters with default values
          if (nodeDetails.parameters) {
            for (const [key, param] of Object.entries(nodeDetails.parameters)) {
              if (!(key in initializedParameters)) {
                initializedParameters[key] =
                  this.getDefaultValueForParameter(param);
              }
            }
          }

          return {
            ...node,
            icon: nodeDetails.icon,
            parameters: initializedParameters,
            outputs: initializedOutputs,
            description: node.description || nodeDetails.description,
          };
        });

        this.handleWorkflowGenerator(state);

        // After loading the state, call toggleTinyNodeMode to adjust positions if necessary
        if (this.isTinyNodeMode !== state.isTinyNodeMode) {
          this.$nextTick(() => {
            this.toggleTinyNodeMode();
          });
        }

        this.workflowId = state.id;
        alert(`Workflow Loaded! ID: ${state.id}`);
      } else {
        alert("No saved workflow found!");
      }
    },
    async deleteWorkflow() {
      const activeWorkflowId = localStorage.getItem("activeWorkflow");

      if (!activeWorkflowId) {
        alert("No active workflow to delete.");
        return;
      }

      const confirmDelete = confirm(
        "Are you sure you want to delete this workflow?"
      );
      if (!confirmDelete) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/workflows/${activeWorkflowId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Workflow deleted:", data);
        alert("Workflow deleted successfully");

        // Clear the canvas and reset the state
        this.nodes = [];
        this.edges = [];
        this.activeWorkflowId = null;
        this.workflowName = "My Workflow";
        localStorage.removeItem("canvasState");
        localStorage.removeItem("activeWorkflow");

        // Refresh the page and remove query parameters
        window.location.href = window.location.pathname;
      } catch (error) {
        console.error("Error deleting workflow:", error);
        alert("Failed to delete workflow. Please try again.");
      }
    },
    getNodeDetails(type) {
      // First, check in the toolLibrary
      for (const category in toolLibrary) {
        const foundNode = toolLibrary[category].find(
          (node) => node.type === type
        );
        if (foundNode) {
          return foundNode;
        }
      }

      // If not found in toolLibrary, check in custom tools
      const customTool = this.customTools.find((tool) => tool.type === type);
      if (customTool) {
        return customTool;
      }

      // If not found anywhere, return null or a default object
      console.warn(
        `Node type ${type} not found in toolLibrary or custom tools`
      );
      return null;
    },
    async fetchCustomTools() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/custom-tools`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.customTools = data.tools.map((tool) => ({
          ...tool,
          category: "custom",
        }));
      } catch (error) {
        console.error("Error fetching custom tools:", error);
      }
    },
    getDefaultValueForType(type) {
      switch (type) {
        case "string":
          return "";
        case "number":
        case "integer":
          return 0;
        case "boolean":
          return false;
        case "array":
          return [];
        case "object":
          return {};
        default:
          return null;
      }
    },
    getDefaultValueForParameter(param, existingValue) {
      // If the existing value is not undefined or null, return it
      if (existingValue !== undefined && existingValue !== null) {
        return existingValue;
      }

      // Otherwise, return the default value based on the parameter type
      if (param.default !== undefined) {
        return param.default;
      }

      switch (param.type) {
        case "string":
          return "";
        case "number":
        case "integer":
          return 0;
        case "boolean":
          return false;
        case "array":
          return [];
        case "object":
          return {};
        default:
          return null;
      }
    },
    toggleTinyNodeMode() {
      const oldWidth = this.nodeWidth;
      this.isTinyNodeMode = !this.isTinyNodeMode;
      this.nodeWidth = this.isTinyNodeMode ? 48 : 288;
      const gap = this.isTinyNodeMode ? 32 : 32; // Adjust these values as needed

      // Filter out label nodes
      const nonLabelNodes = this.nodes.filter((node) => node.type !== "label");

      // Group non-label nodes by their x-coordinate (column)
      const columnGroups = nonLabelNodes.reduce((groups, node) => {
        const x = Math.round(node.x / this.gridSize) * this.gridSize;
        if (!groups[x]) groups[x] = [];
        groups[x].push(node);
        return groups;
      }, {});

      // Sort columns from left to right
      const sortedColumns = Object.keys(columnGroups).sort(
        (a, b) => Number(a) - Number(b)
      );

      // Calculate the total width change
      const widthDifference = this.nodeWidth - oldWidth;

      // Adjust node positions for each column
      sortedColumns.forEach((columnX, columnIndex) => {
        const columnNodes = columnGroups[columnX];

        columnNodes.forEach((node) => {
          if (columnIndex === 0) {
            // Keep the leftmost column fixed
            // No change to node.x
          } else {
            // Calculate the new position based on the number of columns to the left
            const newX =
              Number(sortedColumns[0]) + columnIndex * (this.nodeWidth + gap);
            node.x = newX;
          }
        });
      });

      // Update the nodes array, preserving label nodes' positions
      this.nodes = this.nodes.map((node) => {
        if (node.type === "label") {
          return node; // Return label nodes unchanged
        } else {
          return nonLabelNodes.find((n) => n.id === node.id) || node;
        }
      });

      this.updateEdges();
    },
    updateNodePositions() {
      this.nodes.forEach((node) => {
        if (node.type !== "label") {
          node.x = Math.round(node.x / this.gridSize) * this.gridSize;
          node.y = Math.round(node.y / this.gridSize) * this.gridSize;
        }
      });
      this.updateEdges();
    },
    handleWorkflowStarted() {
      // Reset all nodes and edges to inactive state
      this.nodes = this.nodes.map((node) => ({
        ...node,
        isActive: false,
        error: null,
        output: null,
      }));

      this.edges = this.edges.map((edge) => ({
        ...edge,
        isActive: false,
      }));

      // this.activeWorkflowId = localStorage.getItem('activeWorkflow');

      this.pollWorkflowStatus();
    },
    handleWorkflowError(error) {
      console.error("Workflow error:", error);
      // Update the UI to show the general workflow error
    },
    handleWorkflowStopped() {
      // Reset all nodes and edges to inactive state
      this.nodes = this.nodes.map((node) => ({
        ...node,
        isActive: false,
        error: null,
        output: null,
      }));

      this.edges = this.edges.map((edge) => ({
        ...edge,
        isActive: false,
      }));

      // Reset workflow-related states
      // this.activeWorkflowId = null;
      this.workflowStatus = "stopped";
      this.nodeOutputs = {};
      this.nodeErrors = {};

      // Stop the animation
      this.updateAnimationState(false);
    },
    setActiveWorkflowId(id) {
      this.activeWorkflowId = id;
    },
    async pollWorkflowStatus() {
      if (!this.activeWorkflowId) {
        console.log("No active workflow ID, stopping polling");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/workflows/${this.activeWorkflowId}/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // console.log("Workflow status data:", data);

        this.workflowStatus = data.status || "unknown";
        this.nodeErrors = data.errors || {};
        this.nodeOutputs = data.outputs || {};

        // Emit the status change
        this.$emit("workflow-status-change", {
          id: this.activeWorkflowId,
          status: this.workflowStatus,
          isActive: data.isActive,
        });

        // Update the current active node
        const currentNodeId = data.currentNodeId;

        // Update nodes
        this.nodes = this.nodes.map((node) => ({
          ...node,
          isActive: node.id === currentNodeId,
          error: this.nodeErrors[node.id] || null,
          output: this.nodeOutputs[node.id] || null,
        }));

        // Update edges
        this.edges = this.edges.map((edge) => ({
          ...edge,
          isActive: data.activeEdges && data.activeEdges.includes(edge.id),
        }));

        // Set animation state
        // this.updateAnimationState(this.workflowStatus === "running");
        this.updateAnimationState(
          this.workflowStatus === "running" || this.workflowStatus === "error"
        );

        // Continue polling if the workflow is still running or has an error
        if (
          this.workflowStatus === "running" ||
          this.workflowStatus === "error"
        ) {
          this.pollingTimer = setTimeout(() => this.pollWorkflowStatus(), 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error("Error polling workflow status:", error);
        // Don't stop polling on error, just try again
        setTimeout(() => this.pollWorkflowStatus(), 2000);
      }
    },
    handleWorkflowStatusUpdate(data) {
      this.workflowStatus = data.status || "unknown";
      this.nodeErrors = data.errors || {};
      this.nodeOutputs = data.outputs || {};

      const currentNodeId = data.currentNodeId;

      // Update nodes
      this.nodes = this.nodes.map((node) => ({
        ...node,
        isActive: node.id === currentNodeId,
        error: this.nodeErrors[node.id] || null,
        output: this.nodeOutputs[node.id] || null,
      }));

      // Update edges
      this.edges = this.edges.map((edge) => ({
        ...edge,
        isActive: data.activeEdges && data.activeEdges.includes(edge.id),
      }));

      // Update animation state
      this.updateAnimationState(
        this.workflowStatus === "running" || this.workflowStatus === "error"
      );
    },
    updateWorkflowName(name) {
      this.workflowName = name;
    },
    stopPolling() {
      if (this.pollingTimer) {
        clearTimeout(this.pollingTimer);
        this.pollingTimer = null;
      }
    },
  },
  setup() {
    const route = useRoute();
    const handleWorkflowGeneratorRef = ref(null);
    const pollWorkflowStatusRef = ref(null);
    const activeWorkflowId = ref(null);
    const workflowName = ref("My Workflow");
    const customTools = ref([]);
    const isShareable = ref(false);
    const isLoading = ref(true);

    const getEndpoint = (operation) => {
      const localEndpoint = `${API_CONFIG.BASE_URL}`;
      const publicEndpoint = `${API_CONFIG.REMOTE_URL}`;

      switch (operation) {
        case "import":
        case "share":
          return publicEndpoint;
        case "save":
        case "load":
        case "delete":
          return localEndpoint;
        default:
          console.warn(
            `Unknown operation: ${operation}. Using local endpoint.`
          );
          return localEndpoint;
      }
    };

    const updateWorkflowName = (name) => {
      workflowName.value = name;
    };

    const loadWorkflow = async (id) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        await fetchCustomTools();

        const isImporting = id.startsWith("shared_");
        const endpoint = getEndpoint(isImporting ? "import" : "load");
        const workflowId = isImporting ? id.substring(7) : id;

        const response = await fetch(
          `${endpoint}/api/workflows/${workflowId}`,
          {
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(
              "This workflow is not shared or you don't have permission to access it."
            );
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (handleWorkflowGeneratorRef.value) {
          const isOwner = data.user_id === getUserIdFromToken(token);

          if (!isOwner && !data.workflow.isShareable) {
            throw new Error("This workflow is not shared.");
          }

          // If importing or not the owner, generate a new ID and set isShareable to false
          const newWorkflowId =
            isImporting || !isOwner ? generateUUID() : workflowId;
          const workflowIsShareable = isImporting
            ? false
            : isOwner
            ? data.workflow.isShareable
            : false;

          // Handle custom tools
          if (
            data.workflow.customTools &&
            data.workflow.customTools.length > 0
          ) {
            // Merge the workflow's custom tools with the user's custom tools
            const mergedCustomTools = [...customTools.value];
            data.workflow.customTools.forEach((tool) => {
              if (!mergedCustomTools.some((t) => t.type === tool.type)) {
                mergedCustomTools.push(tool);
              }
            });
            customTools.value = mergedCustomTools;
          }

          handleWorkflowGeneratorRef.value(data.workflow);

          if (data.workflow.name) {
            updateWorkflowName(data.workflow.name);
          }

          // Update localStorage with the loaded workflow
          const stateToSave = {
            id: newWorkflowId,
            name: data.workflow.name,
            nodes: data.workflow.nodes,
            edges: data.workflow.edges,
            zoomLevel: data.workflow.zoomLevel || 1,
            canvasOffsetX: data.workflow.canvasOffsetX || 0,
            canvasOffsetY: data.workflow.canvasOffsetY || 0,
            isTinyNodeMode: data.workflow.isTinyNodeMode || false,
            isShareable: workflowIsShareable,
          };
          localStorage.setItem("canvasState", JSON.stringify(stateToSave));
          localStorage.setItem("activeWorkflow", newWorkflowId);
          activeWorkflowId.value = newWorkflowId;
          isShareable.value = workflowIsShareable;

          if (pollWorkflowStatusRef.value) {
            pollWorkflowStatusRef.value();
          }

          // If importing or not the owner, show a message to the user
          if (isImporting || !isOwner) {
            alert("A new copy of the workflow has been created for you.");
          }
        } else {
          console.error("handleWorkflowGenerator is not available");
        }
      } catch (error) {
        console.error("Error loading workflow:", error);
        alert(error.message || "Failed to load workflow. Please try again.");
      }
    };

    const fetchCustomTools = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/custom-tools`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data.tools)) {
          customTools.value = data.tools.map((tool) => ({
            ...tool,
            category: "custom",
          }));
        } else {
          console.error("Received invalid data for custom tools:", data);
          customTools.value = [];
        }

        const customToolsArr = [];
        customTools.value.forEach((tool, index) => {
          customToolsArr.push({
            id: tool.id,
            title: tool.title,
            type: tool.type,
            icon: tool.icon,
          });
        });
      } catch (error) {
        console.error("Error fetching custom tools:", error);
        customTools.value = [];
      }
    };

    const loadWorkflowFromUrl = () => {
      const workflowId = route.query.id;
      if (workflowId) {
        // console.log("Loading workflow from URL with ID:", workflowId);
        loadWorkflow(workflowId);
      } else {
        return;
      }
    };

    const getUserIdFromToken = (token) => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId;
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    };

    const {
      tutorialConfig,
      startTutorial,
      onTutorialClose,
      initializeWorkflowDesigner,
    } = useWorkflowDesigner();

    onMounted(() => {
      initializeWorkflowDesigner();
    });

    onMounted(async () => {
      // Clear activeWorkflowId if not loading from URL
      if (!route.query.id) {
        localStorage.removeItem("activeWorkflow");
        localStorage.removeItem("canvasState");
        activeWorkflowId.value = generateUUID();
        localStorage.setItem("activeWorkflow", activeWorkflowId.value);
      }

      // Load workflow if ID param is set in URL
      loadWorkflowFromUrl();

      await fetchCustomTools();

      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    });

    // Watch for changes in activeWorkflowId
    // watch(activeWorkflowId, (newId) => {
    //   console.log("Active Workflow ID changed:", newId);
    // });

    return {
      tutorialConfig,
      startTutorial,
      onTutorialClose,
      loadWorkflow,
      handleWorkflowGeneratorRef,
      pollWorkflowStatusRef,
      activeWorkflowId,
      workflowName,
      updateWorkflowName,
      customTools,
      fetchCustomTools,
      isShareable,
      getEndpoint,
      isLoading
    };
  },
  async mounted() {
    // Assign the handleWorkflowGenerator method to the ref
    this.handleWorkflowGeneratorRef = this.handleWorkflowGenerator;
    // Assign the pollWorkflowStatus method to the ref
    this.pollWorkflowStatusRef = this.pollWorkflowStatus;
  },
  beforeUnmount() {
    this.stopPolling();
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
</script>

<style scoped>
/* GLOBAL SHARED STYLES FOR THIS PAGE HERE */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.hide {
  display: none;
}

.no-select {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.capitalize {
  text-transform: capitalize;
}

.canvas-state-controls {
  position: fixed;
  display: flex;
  top: 16px;
  right: 16px;
  z-index: 99;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.canvas-state-controls button {
  padding: 10px;
  border: 1px solid rgba(17, 27, 117, 0.25);
  background: transparent;
  color: var(--Dark-Navy, #01052a);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-content: center;
  transition: background-color 0.3s ease;
  cursor: pointer;
  opacity: 0.85;
}

.canvas-state-controls button:hover {
  cursor: pointer !important;
  opacity: 0.6;
}

.canvas-state-controls i {
  font-size: 16px;
  cursor: pointer !important;
}

div#workflow-name {
  margin-right: 16px;
  font-size: var(--font-size-sm);
  opacity: 0.5;
}

body.dark div#workflow-name {
  color: var(--color-med-navy);
}
</style>

<style>
header {
  display: none !important;
}
</style>
