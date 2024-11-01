<template>
  <button
    id="workflow-engine-toggle"
    @click="toggleWorkflow"
    :title="getButtonTitle"
    :disabled="isButtonDisabled"
  >
    <i :class="getButtonIcon"></i>
  </button>
</template>

<script>
import { API_CONFIG } from '@/tt.config.js';

export default {
  name: "WorkflowEngine",
  props: {
    workflowId: {
      type: String,
      default: null,
    },
    edges: {
      type: Array,
      required: true,
    },
    canvasRef: {
      type: Object,
      default: null,
    },
    workflowStatus: {
      type: String,
      default: "stopped",
    },
  },
  data() {
    return {
      isAnimating: false,
      animationInterval: null,
      pollInterval: null,
      pollTimeout: null,
      isPolling: false,
      localWorkflowStatus: this.workflowStatus,
    };
  },
  computed: {
    getButtonIcon() {
      if (this.localWorkflowStatus === "queued") {
        return "fas fa-hourglass-half";
      } else if (this.localWorkflowStatus === "stopping") {
        return "fas fa-spinner fa-spin";
      }
      return this.isAnimating ? "fas fa-stop-circle" : "fas fa-play-circle";
    },
    getButtonTitle() {
      if (this.localWorkflowStatus === "queued") {
        return "Workflow is queued";
      } else if (this.localWorkflowStatus === "stopping") {
        return "Workflow is stopping";
      }
      return this.isAnimating ? "Stop Workflow" : "Start Workflow";
    },
    isButtonDisabled() {
      return (
        this.localWorkflowStatus === "queued" ||
        this.localWorkflowStatus === "stopping"
      );
    },
  },
  methods: {
    async toggleWorkflow() {
      if (!this.isAnimating) {
        // Start workflow logic
        this.localWorkflowStatus = "queued";
        this.isAnimating = true;

        const workflow = localStorage.getItem("canvasState");
        const workflowObj = JSON.parse(workflow);
        this.$emit("workflow-id-set", workflowObj.id);

        this.startAnimation();
        this.$emit("workflow-started");
        this.$emit("animation-state-changed", this.isAnimating);

        // Start the workflow immediately
        const startWorkflowPromise = this.startWorkflow(workflow);

        // Force "queued" state for at least 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
          const startResult = await startWorkflowPromise;

          console.log("Workflow ID:", workflowObj.id);
          localStorage.setItem("activeWorkflow", workflowObj.id);
          this.activeWorkflowId = workflowObj.id;
          this.$emit("workflow-id-set", workflowObj.id);
          this.startPolling();

          this.localWorkflowStatus = startResult.status || "listening";
        } catch (error) {
          console.error("Failed to send workflow:", error);
          this.isAnimating = false;
          this.localWorkflowStatus = "stopped";
          this.$emit("animation-state-changed", this.isAnimating);
          this.$emit("workflow-error", error.message);
        }
      } else {
        // Stop workflow logic
        this.localWorkflowStatus = "stopping";
        this.$emit("animation-state-changed", this.isAnimating);

        const workflowId = localStorage.getItem("activeWorkflow");

        // Start the stop workflow process
        const stopPromise = this.stopWorkflow(workflowId);

        // Force "stopping" state for at least 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          await stopPromise;

          console.log("Workflow ID Stopped:", workflowId);
          // localStorage.removeItem("activeWorkflow");
          this.stopPolling();
          this.isAnimating = false;
          this.localWorkflowStatus = "stopped";
        } catch (error) {
          console.error("Failed to stop workflow:", error);
          this.isAnimating = true;
          this.$emit("workflow-error", error.message);
        } finally {
          this.stopAnimation();
          this.$emit("workflow-stopped");
          this.$emit("animation-state-changed", this.isAnimating);
        }
      }
    },
    startAnimation() {
      this.playAnimation();
      this.animationInterval = setInterval(this.playAnimation, 5000);
    },
    stopAnimation() {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
      this.edges.forEach(this.stopEdgeAnimation);
    },
    playAnimation() {
      if (this.canvasRef) {
        this.edges.forEach(this.animateEdge);
      }
    },
    animateEdge(edge) {
      if (!this.canvasRef) return;
      const edgeEl = this.canvasRef.querySelector(
        `.edge[data-start="${edge.start.index}-${edge.start.type}"][data-end="${edge.end.index}-${edge.end.type}"]`
      );
      if (edgeEl) {
        const path = edgeEl.querySelector("path");
        if (path) {
          const pathLength = path.getTotalLength();
          path.style.strokeDasharray = `20 10`;
          path.style.strokeDashoffset = `${pathLength}`;
          path.style.animation = "none";
          path.getBoundingClientRect(); // Force reflow
          path.style.animation = "dashOffset 20s linear infinite";
        }
      }
    },
    stopEdgeAnimation(edge) {
      if (!this.canvasRef) return;
      const edgeEl = this.canvasRef.querySelector(
        `.edge[data-start="${edge.start.index}-${edge.start.type}"][data-end="${edge.end.index}-${edge.end.type}"]`
      );
      if (edgeEl) {
        const path = edgeEl.querySelector("path");
        if (path) {
          path.style.animation = "none";
        }
      }
    },
    async startWorkflow(workflow) {
      console.log(workflow);
      try {
        const workflowObj = JSON.parse(workflow);
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        workflowObj.userId = userId;

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/workflows/${workflowObj.id}/start`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ workflow: workflowObj }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `HTTP error! status: ${response.status}`
          );
        }

        console.log("Workflow started successfully:", data);
        this.$emit("workflow-status-update", {
          status: "running",
          isActive: true,
        });

        // Only update local status if it's not "queued"
        if (this.localWorkflowStatus !== "queued") {
          this.localWorkflowStatus = "running";
        }

        // Start polling immediately
        this.activeWorkflowId = workflowObj.id;
        this.startPolling();

        return data;
      } catch (error) {
        console.error("Error sending workflow:", error);
        this.$emit("workflow-error", error.message);
        throw error;
      }
    },
    async stopWorkflow(workflowId) {
      const token = localStorage.getItem("token");
      const apiUrl = `${API_CONFIG.BASE_URL}/api/workflows/${workflowId}/stop`;

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Workflow stopped successfully:", data);

        // Check the actual status after stopping
        const statusResponse = await fetch(
          `${API_CONFIG.BASE_URL}/api/workflows/${workflowId}/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        const statusData = await statusResponse.json();

        this.isAnimating = statusData.isActive;
        this.$emit("workflow-stopped", workflowId);
        this.$emit("workflow-status-update", statusData);

        if (!statusData.isActive) {
          this.stopPolling();
        } else {
          console.log("Workflow is still active, continuing to poll");
          this.startPolling();
        }
      } catch (error) {
        console.error("Error stopping workflow:", error);
        this.$emit("workflow-error", error.message);
        throw error;
      }
    },
    async getWorkflow(workflowId) {
      const apiUrl = `${API_CONFIG.BASE_URL}/api/workflows/${workflowId}`;

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `HTTP error! status: ${response.status}`
          );
        }

        console.log("Workflow retrieved successfully:", data);
        return data.workflow;
      } catch (error) {
        console.error("Error retrieving workflow:", error);
        this.$emit("workflow-error", error.message);
        throw error;
      }
    },
    async updateWorkflow(workflowId, workflow) {
      const apiUrl = `${API_CONFIG.BASE_URL}/api/workflows/${workflowId}`;

      try {
        const response = await fetch(apiUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ workflow: JSON.parse(workflow) }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `HTTP error! status: ${response.status}`
          );
        }

        console.log("Workflow updated successfully:", data);
        this.$emit("workflow-updated", workflowId);
        return data;
      } catch (error) {
        console.error("Error updating workflow:", error);
        this.$emit("workflow-error", error.message);
        throw error;
      }
    },
    async pollWorkflowStatus() {
      if (!this.activeWorkflowId) {
        return;
      }

      if (this.isPolling) {
        console.log("Already polling, skipping");
        return;
      }

      this.isPolling = true;

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
        console.log("Received status update:", data);

        // Only emit if the status has changed
        if (JSON.stringify(data) !== JSON.stringify(this.lastStatusUpdate)) {
          this.$emit("workflow-status-update", data);
          this.lastStatusUpdate = data;
        }

        // Continue polling if the workflow is still running or has an error
        if (
          data.status === "running" ||
          data.status === "queued" ||
          data.status === "error" ||
          data.isActive
        ) {
          this.schedulePoll();
        } else {
          console.log("Workflow is no longer running, stopping polling");
          this.$emit("workflow-stopped");
          this.stopPolling();
        }
      } catch (error) {
        console.error("Error polling workflow status:", error);
        this.$emit("workflow-error", error);
        this.schedulePoll();
      } finally {
        this.isPolling = false;
      }
    },
    schedulePoll() {
      if (this.pollTimeout) {
        clearTimeout(this.pollTimeout);
      }
      this.pollTimeout = setTimeout(() => this.pollWorkflowStatus(), 5000);
    },
    startPolling() {
      this.stopPolling(); // Ensure any existing polling is stopped
      this.pollWorkflowStatus(); // Poll immediately
    },
    stopPolling() {
      if (this.pollTimeout) {
        clearTimeout(this.pollTimeout);
        this.pollTimeout = null;
      }
      this.isPolling = false;
    },
  },
  beforeDestroy() {
    clearInterval(this.animationInterval);
  },
  mounted() {
    // this.startPolling();
  },
  beforeUnmount() {
    this.stopPolling();
  },
  watch: {
    workflowId: {
      immediate: true,
      handler(newId) {
        this.stopPolling();
        if (newId) {
          this.startPolling();
        }
      },
    },
    workflowStatus: {
      immediate: true,
      handler(newStatus) {
        const shouldBeAnimating =
          newStatus === "running" || newStatus === "error";
        this.localWorkflowStatus = newStatus;
        if (this.isAnimating !== shouldBeAnimating) {
          this.isAnimating = shouldBeAnimating;
          this.$emit("animation-state-changed", this.isAnimating);
        }
      },
    },
  },
};
</script>

<style scoped>
#workflow-engine-toggle {
  /* position: fixed;
    top: 8px;
    right: 180px; */
  z-index: 1000;
  padding: 10px;
  border: 1px solid rgba(1, 5, 42, 0.25);
  background: transparent;
  color: var(--Dark-Navy, #01052a);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  cursor: pointer;
  opacity: 1;
}

#workflow-engine-toggle:hover {
  cursor: pointer !important;
  opacity: 0.6;
}

#workflow-engine-toggle i {
  font-size: 16px;
  cursor: pointer !important;
}

#workflow-engine-toggle:disabled i {
  /* cursor: not-allowed !important; */
  user-select: none;
  opacity: 0.5;
}
#workflow-engine-toggle:disabled {
  /* cursor: not-allowed !important; */
  user-select: none;
  opacity: 0.5;
}
#workflow-engine-toggle:disabled:hover {
  opacity: 0.5;
}
</style>
