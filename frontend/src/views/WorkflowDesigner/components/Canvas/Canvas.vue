<template>
  <div id="canvas-container">
    <div
      id="canvas"
      class="tiny-nodes"
      ref="canvas"
      @mousedown.prevent="startPanning"
      @dragover.prevent
      @drop="handleDrop"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @click="handleCanvasClick"
      @wheel="handleZoom"
      @keydown="handleKeyDown"
      tabindex="0"
    >
      <div id="grid-overlay" class="grid-overlay"></div>
      <Node
        v-for="(node, index) in nodes"
        :key="index"
        :node="node"
        :index="index"
        :gridSize="gridSize"
        :isTinyNodeMode="isTinyNodeMode"
        :nodeWidth="nodeWidth"
        :output="node.output"
        :error="node.error"
        @select-node="selectNode"
        @start-dragging="startDragging"
        @start-editing="$emit('start-editing', $event)"
        @finish-editing="
          (index, content) => $emit('finish-editing', index, content)
        "
        @update-content="$emit('update-content', $event)"
        @adjust-node-size="$emit('adjust-node-size', $event)"
        @start-connecting="startConnecting"
        @delete-node="$emit('delete-node', $event)"
      />
      <svg class="edges">
        <Edge
          v-for="(edge, index) in edges"
          :key="index"
          :edge="edge"
          :isAnimating="isAnimating"
          :nodeWidth="nodeWidth"
          :isSelected="edge.id === selectedEdgeId"
          @select-edge="selectEdge(edge.id)"
        />
      </svg>
      <svg v-if="tempEdge" class="temp-edge">
        <Edge
          :edge="tempEdge"
          :isAnimating="false"
          :isTemp="true"
          :nodeWidth="nodeWidth"
        />
      </svg>
    </div>
  </div>
</template>

<script>
import Node from "./components/Node/Node.vue";
import Edge from "./components/Edge/Edge.vue";

export default {
  name: "Canvas",
  components: { Node, Edge },
  props: {
    nodes: Array,
    edges: Array,
    gridSize: Number,
    isAnimating: Boolean,
    selectedEdgeId: {
      type: String,
      default: null,
    },
    selectedNodeIndex: {
      type: Number,
      default: null,
    },
    isTinyNodeMode: {
      type: Boolean,
      default: false,
    },
    nodeWidth: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      draggedNodeIndex: null,
      offsetX: 0,
      offsetY: 0,
      startConnector: null,
      tempEdge: null,
      isPanning: false,
      panStartX: 0,
      panStartY: 0,
      canvasOffsetX: 0,
      canvasOffsetY: 0,
      zoomLevel: 1,
      minZoomLevel: 0.5,
      maxZoomLevel: 2,
      zoomSpeed: 0.001,
      selectedEdgeIndex: null,
    };
  },
  methods: {
    handleDrop(e) {
      try {
        const data = JSON.parse(e.dataTransfer.getData("text"));
        const rect = this.$refs.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoomLevel;
        const y = (e.clientY - rect.top) / this.zoomLevel;
        this.$emit("create-node", data, x, y);
      } catch (error) {
        console.error("Error parsing dropped data:", error);
      }
    },
    startDragging(e, index) {
      // Deselect edge immediately when starting to drag a node
      if (this.selectedEdgeIndex !== null) {
        this.selectedEdgeIndex = null;
        this.$emit("deselect-all-edges");
      }

      if (e.target.classList.contains("connector")) return;
      this.$emit("select-node", index);
      this.draggedNodeIndex = index;

      const nodeElement = e.target.closest(".node");
      const rect = nodeElement.getBoundingClientRect();
      const canvasRect = this.$refs.canvas.getBoundingClientRect();

      this.offsetX =
        (e.clientX - rect.left) / this.zoomLevel +
        this.canvasOffsetX / this.zoomLevel;
      this.offsetY =
        (e.clientY - rect.top) / this.zoomLevel +
        this.canvasOffsetY / this.zoomLevel;

      document.body.classList.add("no-select");
      document.addEventListener("mousemove", this.drag);
      document.addEventListener("mouseup", this.stopDragging);
    },
    drag(e) {
      if (this.draggedNodeIndex === null) return;
      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      const gridSize = this.gridSize;

      const x =
        Math.round(
          ((e.clientX - canvasRect.left) / this.zoomLevel +
            this.canvasOffsetX / this.zoomLevel -
            this.offsetX) /
            gridSize
        ) * gridSize;
      const y =
        Math.round(
          ((e.clientY - canvasRect.top) / this.zoomLevel +
            this.canvasOffsetY / this.zoomLevel -
            this.offsetY) /
            gridSize
        ) * gridSize;

      this.$emit(
        "update:nodes",
        this.nodes.map((node, index) =>
          index === this.draggedNodeIndex ? { ...node, x, y } : node
        )
      );
      this.$emit("update-edges");
    },
    stopDragging() {
      this.draggedNodeIndex = null;
      document.body.classList.remove("no-select");
      document.removeEventListener("mousemove", this.drag);
      document.removeEventListener("mouseup", this.stopDragging);

      // Ensure the edge stays deselected after dragging
      if (this.selectedEdgeIndex !== null) {
        this.selectedEdgeIndex = null;
        this.$emit("deselect-all-edges");
      }
    },
    handleCanvasMouseMove(e) {
      if (this.draggedNodeIndex !== null) {
        // Handled by drag method
      } else if (this.tempEdge) {
        const canvasRect = this.$refs.canvas.getBoundingClientRect();
        this.tempEdge.endX = (e.clientX - canvasRect.left) / this.zoomLevel;
        this.tempEdge.endY = (e.clientY - canvasRect.top) / this.zoomLevel;
      }
    },
    handleCanvasMouseUp(e) {
      if (this.draggedNodeIndex !== null) {
        this.$emit("select-node", this.draggedNodeIndex);
        this.draggedNodeIndex = null;
      } else if (this.tempEdge) {
        const endConnector = this.findConnectorAtPosition(e.clientX, e.clientY);
        if (
          endConnector &&
          this.startConnector.type !== endConnector.type &&
          this.startConnector.nodeId !== endConnector.nodeId
        ) {
          this.$emit("create-edge", this.startConnector, endConnector);
        } else if (this.startConnector.type === "input") {
          const existingEdge = this.edges.find(
            (edge) => edge.end.id === this.startConnector.nodeId
          );
          if (!existingEdge) {
            this.$emit(
              "create-edge",
              { nodeId: null, type: "output" },
              this.startConnector
            );
          }
        }
        this.tempEdge = null;
      }
      this.startConnector = null;
    },
    startConnecting(e, nodeId, type) {
      e.stopPropagation();
      const rect = this.$refs.canvas.getBoundingClientRect();
      this.startConnector = { nodeId, type };

      if (type === "input") {
        const existingEdge = this.edges.find((edge) => edge.end.id === nodeId);
        if (existingEdge) {
          this.startConnector = {
            nodeId: existingEdge.start.id,
            type: "output",
          };
          this.tempEdge = {
            start: { ...existingEdge.start },
            end: { id: null, type: "input" },
            startX: existingEdge.startX,
            startY: existingEdge.startY,
            endX: (e.clientX - rect.left) / this.zoomLevel,
            endY: (e.clientY - rect.top) / this.zoomLevel,
          };
          this.$emit(
            "update:edges",
            this.edges.filter((edge) => edge !== existingEdge)
          );
        } else {
          return;
        }
      } else {
        this.tempEdge = {
          start: { id: nodeId, type },
          end: { id: null, type: "input" },
          startX: (e.clientX - rect.left) / this.zoomLevel,
          startY: (e.clientY - rect.top) / this.zoomLevel,
          endX: (e.clientX - rect.left) / this.zoomLevel,
          endY: (e.clientY - rect.top) / this.zoomLevel,
        };
      }
    },
    findConnectorAtPosition(x, y) {
      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      const adjustedX = x - canvasRect.left - this.canvasOffsetX;
      const adjustedY = y - canvasRect.top - this.canvasOffsetY;
      const connectors = this.$refs.canvas.querySelectorAll(".connector");
      for (let i = 0; i < connectors.length; i++) {
        const rect = connectors[i].getBoundingClientRect();
        const connectorX = rect.left - canvasRect.left - this.canvasOffsetX;
        const connectorY = rect.top - canvasRect.top - this.canvasOffsetY;
        if (
          adjustedX >= connectorX &&
          adjustedX <= connectorX + rect.width &&
          adjustedY >= connectorY &&
          adjustedY <= connectorY + rect.height
        ) {
          return {
            nodeId: connectors[i].closest(".node").getAttribute("data-id"),
            type: connectors[i].classList.contains("input")
              ? "input"
              : "output",
          };
        }
      }
      return null;
    },
    startPanning(e) {
      if (e.button !== 1 && e.button !== 0) return; // Only start panning on left click or middle mouse button
      this.isPanning = true;
      this.panStartX = e.clientX - this.canvasOffsetX;
      this.panStartY = e.clientY - this.canvasOffsetY;
      document.addEventListener("mousemove", this.pan);
      document.addEventListener("mouseup", this.stopPanning);
      document.getElementById("grid-overlay").classList.add("grabbed");
      document.getElementById("canvas-container").classList.add("grabbed");
      document.body.classList.add("no-select"); // Add this line
      e.preventDefault(); // Add this line to prevent default browser behavior
    },
    pan(e) {
      if (!this.isPanning) return;
      const dx = e.clientX - this.panStartX;
      const dy = e.clientY - this.panStartY;
      this.canvasOffsetX = dx;
      this.canvasOffsetY = dy;
      this.updateCanvasTransform();
    },
    stopPanning() {
      this.isPanning = false;
      document.removeEventListener("mousemove", this.pan);
      document.removeEventListener("mouseup", this.stopPanning);
      document.getElementById("grid-overlay").classList.remove("grabbed");
      document.getElementById("canvas-container").classList.remove("grabbed");
      document.body.classList.remove("no-select"); // Add this line
    },
    updateGridSize(size) {
      this.gridSize = size;
      document.documentElement.style.setProperty("--grid-size", `${size}px`);
    },
    handleZoom(e) {
      e.preventDefault();
      const delta = e.deltaY * this.zoomSpeed;
      this.zoomLevel = Math.max(
        this.minZoomLevel,
        Math.min(this.maxZoomLevel, this.zoomLevel - delta)
      );
      this.updateCanvasTransform();
    },
    updateCanvasTransform() {
      const canvas = this.$refs.canvas;
      canvas.style.transform = `translate(${this.canvasOffsetX}px, ${this.canvasOffsetY}px) scale(${this.zoomLevel})`;
    },
    selectNode(index) {
      if (this.selectedEdgeId) {
        this.$emit("deselect-all-edges");
      }
      this.$emit("update:selectedNodeIndex", index);
    },
    selectEdge(edgeId) {
      this.$emit("select-edge", edgeId);
    },
    handleCanvasClick(e) {
      if (!e.target.closest(".node") && !e.target.closest("path")) {
        this.$emit("deselect-all-nodes");
        this.$emit("deselect-all-edges");
        this.selectedEdgeIndex = null;
        if (document.activeElement) {
          document.activeElement.blur();
        }
      }
    },
    handleKeyDown(event) {
      if (event.key === "Delete" || event.key === "Backspace") {
        // Check if the focused element is within a node
        const focusedElement = document.activeElement;
        const node = focusedElement.closest(".node");

        // If focused on a Label node or any editable content within a node, don't proceed with deletion
        if (
          node &&
          (node.classList.contains("label-node") ||
            focusedElement.tagName === "INPUT" ||
            focusedElement.tagName === "TEXTAREA" ||
            focusedElement.getAttribute("contenteditable") === "true")
        ) {
          return;
        }

        if (this.selectedEdgeId) {
          this.$emit("delete-selected-edge");
        } else if (this.selectedNodeIndex !== null) {
          this.$emit("delete-selected-node", this.selectedNodeIndex);
        }
      }
    },
  },
  emits: [
    "update:nodes",
    "update:edges",
    "update:selectedNodeIndex",
    "select-node",
    "select-edge",
    "deselect-all-nodes",
    "deselect-all-edges",
    "create-edge",
    "update-edges",
    "create-node",
    "start-editing",
    "finish-editing",
    "adjust-node-size",
    "delete-node",
    "update-content",
    "delete-selected-edge",
    "delete-selected-node",
  ],
};
</script>

<style scoped>
#canvas-container {
  margin-left: 0;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: var(--color-bright-light-navy);
}

#canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  transition: transform 0.05s ease-out;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: 16px 16px;
  background-image: radial-gradient(circle, #01052ab0 1px, transparent 1px);
  background-position: center;
  opacity: 0.1;
  z-index: 0;
  width: 10000%;
  height: 10000%;
  transform: translate(-50%, -50%);
  cursor: grab;
}

.grid-overlay.grabbed {
  cursor: grabbing;
}

svg.edges:focus,
div#canvas:focus {
  outline: none !important;
  border: none !important;
}
</style>
