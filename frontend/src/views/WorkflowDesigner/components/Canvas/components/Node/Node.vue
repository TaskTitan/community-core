<template>
  <div
    :class="[
      'node',
      'no-select',
      {
        'label-node': node.type === 'label',
        selected: node.isSelected,
        'tiny-node': isTinyNodeMode,
      },
      node.category,
      { 'has-output': output },
      { 'has-error': error },
    ]"
    :style="nodeStyle"
    @mousedown.stop="startDragging"
    @click.stop="selectNode"
    :data-id="node.id"
  >
    <SvgIcon
      v-if="node.icon && node.type !== 'label'"
      :name="node.icon"
      class="node-icon"
    />
    <div
      class="node-content"
      @dblclick="startEditing"
      :contenteditable="node.isEditing"
      @blur="finishEditing"
      @keydown="handleNodeKeydown"
    >
      {{ node.text || "Untitled Node" }}
    </div>
    <template v-if="node.type !== 'label'">
      <template v-if="!error">
        <svg
          class="grabber"
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="14"
          viewBox="0 0 10 14"
          fill="none"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.07692 1.81486C3.07692 2.20777 2.91484 2.58459 2.62632 2.86242C2.3378 3.14025 1.94649 3.29634 1.53846 3.29634C1.13044 3.29634 0.739122 3.14025 0.450605 2.86242C0.162087 2.58459 0 2.20777 0 1.81486C0 1.42194 0.162087 1.04512 0.450605 0.76729C0.739122 0.489458 1.13044 0.333374 1.53846 0.333374C1.94649 0.333374 2.3378 0.489458 2.62632 0.76729C2.91484 1.04512 3.07692 1.42194 3.07692 1.81486ZM1.53846 8.48152C1.94649 8.48152 2.3378 8.32544 2.62632 8.04761C2.91484 7.76977 3.07692 7.39295 3.07692 7.00004C3.07692 6.60713 2.91484 6.23031 2.62632 5.95248C2.3378 5.67464 1.94649 5.51856 1.53846 5.51856C1.13044 5.51856 0.739122 5.67464 0.450605 5.95248C0.162087 6.23031 0 6.60713 0 7.00004C0 7.39295 0.162087 7.76977 0.450605 8.04761C0.739122 8.32544 1.13044 8.48152 1.53846 8.48152ZM1.53846 13.6667C1.94649 13.6667 2.3378 13.5106 2.62632 13.2328C2.91484 12.955 3.07692 12.5781 3.07692 12.1852C3.07692 11.7923 2.91484 11.4155 2.62632 11.1377C2.3378 10.8598 1.94649 10.7037 1.53846 10.7037C1.13044 10.7037 0.739122 10.8598 0.450605 11.1377C0.162087 11.4155 0 11.7923 0 12.1852C0 12.5781 0.162087 12.955 0.450605 13.2328C0.739122 13.5106 1.13044 13.6667 1.53846 13.6667ZM10 1.81486C10 2.20777 9.83791 2.58459 9.54939 2.86242C9.26088 3.14025 8.86956 3.29634 8.46154 3.29634C8.05351 3.29634 7.6622 3.14025 7.37368 2.86242C7.08517 2.58459 6.92308 2.20777 6.92308 1.81486C6.92308 1.42194 7.08517 1.04512 7.37368 0.76729C7.6622 0.489458 8.05351 0.333374 8.46154 0.333374C8.86956 0.333374 9.26088 0.489458 9.54939 0.76729C9.83791 1.04512 10 1.42194 10 1.81486ZM8.46154 8.48152C8.86956 8.48152 9.26088 8.32544 9.54939 8.04761C9.83791 7.76977 10 7.39295 10 7.00004C10 6.60713 9.83791 6.23031 9.54939 5.95248C9.26088 5.67464 8.86956 5.51856 8.46154 5.51856C8.05351 5.51856 7.6622 5.67464 7.37368 5.95248C7.08517 6.23031 6.92308 6.60713 6.92308 7.00004C6.92308 7.39295 7.08517 7.76977 7.37368 8.04761C7.6622 8.32544 8.05351 8.48152 8.46154 8.48152ZM8.46154 13.6667C8.86956 13.6667 9.26088 13.5106 9.54939 13.2328C9.83791 12.955 10 12.5781 10 12.1852C10 11.7923 9.83791 11.4155 9.54939 11.1377C9.26088 10.8598 8.86956 10.7037 8.46154 10.7037C8.05351 10.7037 7.6622 10.8598 7.37368 11.1377C7.08517 11.4155 6.92308 11.7923 6.92308 12.1852C6.92308 12.5781 7.08517 12.955 7.37368 13.2328C7.6622 13.5106 8.05351 13.6667 8.46154 13.6667Z"
            fill="#01052A"
            fill-opacity="0.25"
          />
        </svg>
      </template>
      <template v-else>
        <div class="node-error">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
      </template>
    </template>
    <template v-if="node.type !== 'label'">
      <div
        class="connector input"
        @mousedown.stop="startConnecting($event, 'input')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="8"
          height="6"
          viewBox="0 0 8 5"
          fill="none"
        >
          <path
            d="M1 1.00195L4 4.00195L1 1.00195ZM4 4.00195L7 1.00195L4 4.00195Z"
            fill="#01052A"
          />
          <path
            d="M1 1.00195L4 4.00195L7 1.00195"
            stroke="#01052A"
            stroke-opacity="0.5"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div
        class="connector output"
        @mousedown.stop="startConnecting($event, 'output')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="8"
          height="6"
          viewBox="0 0 8 5"
          fill="none"
        >
          <path
            d="M1 1.00195L4 4.00195L1 1.00195ZM4 4.00195L7 1.00195L4 4.00195Z"
            fill="#01052A"
          />
          <path
            d="M1 1.00195L4 4.00195L7 1.00195"
            stroke="#01052A"
            stroke-opacity="0.5"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </template>
    <div class="node-delete-button" @click.stop="deleteNode">x</div>
  </div>
</template>

<script>
import SvgIcon from "@/views/_components/common/SvgIcon.vue";

export default {
  name: "Node",
  components: {
    SvgIcon,
  },
  props: {
    node: Object,
    index: Number,
    gridSize: Number,
    zoomLevel: Number,
    isTinyNodeMode: {
      type: Boolean,
      default: false,
    },
    output: Object,
    error: String,
  },
  watch: {
    node: {
      handler(newNode) {
        this.$emit("update:node", newNode);
      },
      deep: true,
    },
  },
  computed: {
    nodeStyle() {
      return {
        transform: `translate(${this.node.x}px, ${this.node.y}px)`,
        width: this.isTinyNodeMode ? "48px" : "288px",
        border: this.node.isSelected ? "2px solid var(--color-pink)" : "",
      };
    },
  },
  methods: {
    handleNodeKeydown(event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.finishEditing();
      }
    },
    selectNode() {
      this.$emit("select-node", this.index);
      this.$emit("node-selected", { ...this.node });
    },
    startDragging(e) {
      if (e.target.classList.contains("connector")) return;
      this.$emit("start-dragging", e, this.index);
    },
    startEditing() {
      this.$emit("start-editing", this.index);
    },
    finishEditing() {
      const nodeContent = this.$el.querySelector(".node-content");
      const content = nodeContent.textContent.trim();
      this.$emit("finish-editing", this.index, content);
    },
    adjustNodeSize(event) {
      // Implement node size adjustment logic here if needed
      this.$emit("adjust-node-size", this.index, event);
    },
    startConnecting(e, type) {
      this.$emit("start-connecting", e, this.node.id, type);
    },
    deleteNode() {
      this.$emit("delete-node", this.index);
    },
  },
};
</script>

<style scoped>
.node {
  position: absolute;
  width: 288px;
  height: 48px;
  margin: auto;
  border-radius: 8px;
  border: 1px solid rgba(1, 5, 42, 0.25);
  background: var(--color-dull-white);
  color: var(--Dark-Navy, #01052a);
  font-family: "League Spartan";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  cursor: move;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  box-sizing: border-box;
  z-index: 2;
  margin: auto;
  text-align: center;
  transition: width 0.25s ease, stroke 0.25s ease;
  will-change: stroke, d;
}

.node::after {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid transparent;
  border-radius: 8px;
  z-index: -1;
  pointer-events: none;
  transition: border-color 0.25s ease;
}

.node.trigger::after {
  border-radius: 32px;
}

.node.selected::after {
  border-color: var(--color-pink);
}

.node.selected {
  border: 3px solid var(--color-pink) !important;
  /* border: none !important; */
  /* transition: none; */
  animation: none !important;
}

.node.trigger {
  border-radius: 32px;
}

.node.trigger .input {
  display: none;
  user-select: none;
}

.node-content {
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  flex-wrap: nowrap;
  width: -webkit-fill-available;
  padding: 10px;
  transition: opacity 0.35s ease, transform 0.35s ease, visibility 0.35s ease;
  opacity: 1;
  transform: scale(1);
  visibility: visible;
  white-space: nowrap;
  text-wrap: nowrap;
}

.node svg.grabber {
  transition: opacity 0.35s ease, transform 0.35s ease, visibility 0.35s ease;
  opacity: 1;
  transform: scale(1);
  visibility: visible;
}

.node-icon {
  display: flex;
}

.node-content[contenteditable="true"] {
  cursor: text;
  user-select: text;
  outline: 2px solid #01052a25;
  border-radius: 6px;
}

.node-content:focus {
  outline: none;
}

.node.label-node {
  font-size: larger;
  font-weight: 600;
  line-height: 120%;
}

.node-delete-button {
  position: absolute;
  top: -10px;
  right: -15px;
  width: 12px;
  height: 12px;
  border: none;
  background: transparent;
  color: var(--Dark-Navy, #01052a75);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 20px;
  font-weight: 400;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.node:hover .node-delete-button {
  opacity: 1;
}

.node-delete-button:hover {
  color: var(--Dark-Navy, #e53d8f);
  transform: scale(1.2);
}

.label-node {
  justify-content: center;
  background: transparent;
  border: none;
  box-shadow: none;
}

.node.starter.label {
  justify-content: center;
}

.label-node .node-content {
  padding: 5px;
  min-width: 50px;
  min-height: 20px;
  white-space: pre-wrap;
  word-break: break-word;
}

.label-node:hover {
  background: rgba(0, 0, 0, 0.05);
}

.label-node:focus-within {
  background: rgba(0, 0, 0, 0.1);
}

.connector {
  width: 16px;
  height: 16px;
  border: 1px solid rgba(1, 5, 42, 0.25);
  background: var(--color-white);
  color: var(--Dark-Navy, #01052a);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  align-content: center;
  flex-direction: row;
  opacity: 0;
  transition: 0.15s ease-in-out;
}

.node:hover .connector {
  opacity: 1;
}

.connector:hover {
  transform: translateY(-50%) scale(1.2);
  border: 1px solid rgba(1, 5, 42, 0.5);
}

.connector svg {
  transform: rotate(270deg);
}

.input {
  left: -8px;
}

.output {
  right: -8px;
}

/* IF TINY NODES ENABLED */
.node.tiny-node .node-content {
  /* display: none; */
  width: 0;
  padding: 0;
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}

/* .node.tiny-node.label-node .node-content {
      display: block;
  } */

.node.tiny-node .node-icon {
  padding: 16px;
  transform: scale(1);
}

.node.tiny-node.label-node .node-content {
  width: initial;
  padding: initial;
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.node.tiny-node svg.grabber {
  display: none;
  opacity: 0;
  transform: scale(0.5);
  pointer-events: none;
}

.node.tiny-node {
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  padding: 0;
  text-align: center;
  align-content: center;
  transition: width 0.5s ease, height 0.5s ease, padding 0.5s ease;
}

.node.tiny-node .node-content,
.node.tiny-node svg.grabber {
  transition: opacity 0.5s ease, transform 0.5s ease, visibility 0s linear 0.5s;
  opacity: 0;
  transform: scale(0.5);
  visibility: hidden;
}

.node.tiny-node.label-node {
  width: 272px !important;
}

.node.tiny-node.label-node .node-content {
  opacity: 1;
  transform: scale(1);
  visibility: initial;
}

.node.tiny-node .connector {
  width: 14px;
  height: 14px;
}

.node.tiny-node .connector svg {
  transform: rotate(270deg) scale(0.75);
}

.node.has-output {
  /* border: 2px solid #14FF89; */
  border: 2px solid #19ef83;
}

body.dark .node.has-output {
  border: 2px solid #19ef83;
  /* border: 2px solid var(--color-blue); */
}

.node.has-error {
  border: 2px solid #fe4e4e;
  /* color: #FE4E4E; */
  animation: breathe 1.25s ease-in-out infinite;
  border-color: #fe4e4e;
}

body.dark .node.has-error.has-output {
  border: 2px solid #fe4e4e;
  border-color: #fe4e4e;
}

/* .node.has-error.selected::after {
    border-color: #FE4E4E;
  } */

.node-error {
  color: #fe4e4e;
  font-family: monospace;
  font-size: 0.8em;
  margin-right: 0;
}

.node.tiny-node .node-error {
  display: none;
}
</style>
