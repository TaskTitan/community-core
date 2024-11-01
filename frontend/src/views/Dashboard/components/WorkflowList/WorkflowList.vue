<template>
  <h2>My Workflows</h2>
  <div class="card-inner workflow-list">
    <div v-if="workflows.length > 0" class="create-new">
      <button @click="createNewWorkflow" class="icon create-workflow-btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="33"
          height="32"
          viewBox="0 0 33 32"
          fill="none"
        >
          <rect
            x="0.544922"
            y="0.5"
            width="31"
            height="31"
            rx="7.5"
            stroke="#01052A"
            stroke-opacity="0.25"
            stroke-dasharray="5 5"
          ></rect>
          <path
            d="M15.1878 16.8571H10.0449V15.1429H15.1878V10H16.9021V15.1429H22.0449V16.8571H16.9021V22H15.1878V16.8571Z"
            fill="#01052A"
            fill-opacity="0.5"
          ></path>
        </svg>
        Create New Workflow
      </button>
    </div>
    <div id="saved-workflows" class="saved-items">
      <!-- JS will inject saved workflows here -->
    </div>
    <div v-if="workflows.length === 0" class="empty-state">
      <p>You don't have any workflows yet.</p>
      <button @click="createNewWorkflow" class="icon create-workflow-btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="33"
          height="32"
          viewBox="0 0 33 32"
          fill="none"
        >
          <rect
            x="0.544922"
            y="0.5"
            width="31"
            height="31"
            rx="7.5"
            stroke="#01052A"
            stroke-opacity="0.25"
            stroke-dasharray="5 5"
          />
          <path
            d="M15.1878 16.8571H10.0449V15.1429H15.1878V10H16.9021V15.1429H22.0449V16.8571H16.9021V22H15.1878V16.8571Z"
            fill="#01052A"
            fill-opacity="0.5"
          />
        </svg>
        Create New Workflow
      </button>
    </div>
  </div>
</template>

<script>
import { API_CONFIG } from "@/tt.config.js";
import { useRouter } from "vue-router";

export default {
  name: "WorkflowList",
  emits: ['workflows-loaded'],
  data() {
    return {
      editingWorkflow: null,
      workflows: [],
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    createNewWorkflow() {
      try {
        this.router.push("/workflow-designer");
      } catch (error) {
        console.error("Navigation failed:", error);
        // Fallback for navigation failure
        window.location.href = "/workflow-designer";
      }
    },
    async fetchSavedWorkflows() {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/workflows/`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const updatedWorkflows = data.workflows.map((workflow) => ({
          ...workflow,
          status: workflow.status || "Unknown",
          isActive: workflow.isActive || false,
          errors: workflow.errors || {},
          updated_at: new Date(workflow.updated_at),
        }));

        // Update only the workflows that have changed
        this.workflows = this.workflows.map((existingWorkflow) => {
          const updatedWorkflow = updatedWorkflows.find(
            (w) => w.id === existingWorkflow.id
          );
          return updatedWorkflow || existingWorkflow;
        });

        // Add any new workflows
        const newWorkflows = updatedWorkflows.filter(
          (updatedWorkflow) =>
            !this.workflows.some((w) => w.id === updatedWorkflow.id)
        );
        this.workflows = [...this.workflows, ...newWorkflows];

        this.populateSavedWorkflows(this.workflows);

        this.$emit('workflows-loaded');
      } catch (error) {
        console.error("Error fetching workflows:", error);
        this.$emit('workflows-loaded');
      }
    },
    populateSavedWorkflows(workflows) {
      const savedWorkflowsContainer =
        document.getElementById("saved-workflows");

      // Create a table element if not already created
      let table = document.getElementById("workflow-table");
      if (!table) {
        table = document.createElement("table");
        table.id = "workflow-table";
        savedWorkflowsContainer.appendChild(table);
      }

      // Clear existing table contents except headers if any
      table.innerHTML =
        "<thead><tr><th>Name</th><th>Status</th><th>Actions</th></tr></thead>";

      const tbody = document.createElement("tbody");
      table.appendChild(tbody);

      // Sort workflows by updated_at in descending order
      const sortedWorkflows = [...workflows].sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );

      sortedWorkflows.forEach((workflow) => {
        const row = tbody.insertRow(-1);
        const cellName = row.insertCell(0);
        const cellStatus = row.insertCell(1);
        const cellActions = row.insertCell(2);

        cellName.innerHTML = `
      <a href="/workflow-designer?id=${workflow.id}">
        ${workflow.workflow.name || "My Workflow"}
      </a>
      <i class="fas fa-edit edit-icon" data-workflow-id="${workflow.id}"></i>
    `;

        const status = this.determineWorkflowStatus(workflow);
        const isActive = status === "running" || status === "listening";
        const isQueued = status === "queued";
        const isStopping = status === "stopping";

        cellStatus.textContent = this.capitalizeFirstLetter(status);
        cellStatus.className =
          status === "error"
            ? "error"
            : isActive
            ? "active"
            : isQueued
            ? "queued"
            : isStopping
            ? "stopping"
            : "";

        let buttonClass, iconClass;
        if (status === "error") {
          buttonClass = "error-workflow";
          iconClass = "fas fa-exclamation-circle";
        } else if (isActive) {
          buttonClass = "stop-workflow";
          iconClass = "fas fa-stop-circle";
        } else if (isQueued) {
          buttonClass = "queued-workflow";
          iconClass = "fas fa-hourglass-half";
        } else if (isStopping) {
          buttonClass = "stopping-workflow";
          iconClass = "fas fa-spinner fa-spin";
        } else {
          buttonClass = "start-workflow";
          iconClass = "fas fa-play-circle";
        }

        cellActions.innerHTML = `
      <button class="${buttonClass}" data-workflow-id="${workflow.id}" ${
          isQueued || isStopping ? "disabled" : ""
        }>
        <i class="${iconClass}"></i>
      </button>
    `;

        // Add error tooltip if there's an error
        if (status === "error") {
          const errorMessage = Object.values(workflow.errors)[0];
          cellStatus.title = errorMessage;
          cellStatus.style.cursor = "help";
        }

        const editIcon = cellName.querySelector(".edit-icon");
        editIcon.addEventListener("click", () =>
          this.editWorkflowName(workflow)
        );

        const actionButton = cellActions.querySelector("button");
        actionButton.addEventListener("click", (event) => {
          this.toggleWorkflowStatus(workflow, event);
        });
      });
    },
    async toggleWorkflowStatus(workflow, event) {
      const button = event.currentTarget;
      button.disabled = true; // Disable the button immediately

      const token = localStorage.getItem("token");
      const action =
        workflow.status === "running" || workflow.status === "listening"
          ? "stop"
          : "start";

      if (action === "start") {
        workflow.status = "queued";
        // Force update UI
        this.populateSavedWorkflows(this.workflows);

        // Start the workflow immediately
        const startWorkflowPromise = fetch(
          `${API_CONFIG.BASE_URL}/api/workflows/${workflow.id}/${action}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        // Force "queued" state for at least 1 seconds
        const queuedStatePromise = new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );

        try {
          // Wait for both the 2-second delay and the startWorkflow promise to resolve
          const [response] = await Promise.all([
            startWorkflowPromise,
            queuedStatePromise,
          ]);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Update the local state based on the server response
          const result = await response.json();

          // Only update the status if it's different from "queued"
          if (result.status && result.status !== "queued") {
            workflow.status = result.status;
          }
        } catch (error) {
          console.error(`Error starting workflow:`, error);
          workflow.status = "stopped";
        }
      } else if (action === "stop") {
        workflow.status = "stopping";
        this.populateSavedWorkflows(this.workflows);

        // Force "stopping" state for at least 1 seconds
        const stoppingStatePromise = new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );

        try {
          const stopPromise = fetch(
            `${API_CONFIG.BASE_URL}/api/workflows/${workflow.id}/${action}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
            }
          );

          // Wait for both the 2-second delay and the stopWorkflow promise to resolve
          const [response] = await Promise.all([
            stopPromise,
            stoppingStatePromise,
          ]);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          workflow.status = result.status;
        } catch (error) {
          console.error(`Error stopping workflow:`, error);
          workflow.status = "running"; // Revert to running if stop fails
        }
      }

      // Update the UI
      this.populateSavedWorkflows(this.workflows);
      button.disabled = false; // Re-enable the button
    },
    editWorkflowName(workflow) {
      const newName = prompt(
        "Enter new workflow name:",
        workflow.workflow.name
      );
      if (newName !== null && newName !== workflow.workflow.name) {
        this.updateWorkflowName(workflow.id, newName);
      }
    },
    async updateWorkflowName(workflowId, newName) {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/workflows/${workflowId}/name`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: newName }),
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Update the local state
        const updatedWorkflow = this.workflows.find((w) => w.id === workflowId);
        if (updatedWorkflow) {
          updatedWorkflow.workflow.name = newName;
        }

        // Refresh the table
        this.populateSavedWorkflows(this.workflows);
      } catch (error) {
        console.error("Error updating workflow name:", error);
      }
    },
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    determineWorkflowStatus(workflow) {
      if (workflow.errors && Object.keys(workflow.errors).length > 0) {
        return "error";
      }
      return workflow.status || "Stopped";
    },
    getButtonTitle(status) {
      switch (status) {
        case "error":
          return "Workflow Error";
        case "running":
        case "listening":
          return "Stop Workflow";
        case "queued":
          return "Workflow is queued";
        default:
          return "Start Workflow";
      }
    },
    startPolling() {
      this.pollingInterval = setInterval(() => {
        this.fetchSavedWorkflows();
      }, 5000); // Poll every 5 seconds
    },
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },
  },
  mounted() {
    this.fetchSavedWorkflows();
    this.startPolling();
  },
  beforeUnmount() {
    this.stopPolling();
  },
};
</script>

<style>
@keyframes running-breathe-inset {
  0%,
  100% {
    box-shadow: inset 0 0 0 2px #19ef83;
  }
  50% {
    box-shadow: inset 0 0 0 3px #19ef83;
  }
}

@keyframes error-breathe-inset {
  0%,
  100% {
    box-shadow: inset 0 0 0 2px #fe4e4e;
  }
  50% {
    box-shadow: inset 0 0 0 3px #fe4e4e;
  }
}

div#saved-workflows {
  width: 100%;
}

table#workflow-table button {
  z-index: 1000;
  border: 1px solid rgba(1, 5, 42, 0.25);
  background: transparent;
  color: var(--color-navy);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-items: center;
  transition: background-color 0.3s ease;
  cursor: pointer;
  opacity: 0.9;
}

table#workflow-table thead,
table#template-table th,
table#output-table th {
  position: sticky;
  top: -1px;
  background: var(--color-dull-white);
  border-bottom: none;
  z-index: 1;
  opacity: 1;
}

table#workflow-table td {
  padding: 4px 12px;
}

table#workflow-table thead::after,
table#template-table th::after,
table#output-table th::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  border-bottom: 1px solid var(--color-light-navy);
}

table#workflow-table tr th:last-child,
table#workflow-table tr td:last-child {
  text-align: -webkit-center;
}

table#workflow-table button i {
  font-size: 16px;
  border: none;
}

table#workflow-table td.active {
  color: #19ef83;
  font-weight: 600;
}

table#workflow-table td.error {
  color: #ff4136; /* Red color for error status */
  font-weight: 600;
}

table#workflow-table td.queued {
  color: #ffa500; /* Orange color for queued status */
  font-weight: 600;
}

body.dark table#workflow-table td.active,
body.dark table#workflow-table td.error,
body.dark table#workflow-table td.queued {
  font-weight: 400;
}

body.dark table#workflow-table button {
  border: 1px solid var(--color-dull-navy);
}

body.dark table#workflow-table button i {
  color: var(--color-med-navy);
}

body.dark table#workflow-table thead,
body.dark table#template-table th,
body.dark table#output-table th {
  background: var(--color-ultra-dark-navy);
}

body.dark table#workflow-table thead::after,
body.dark table#template-table th::after,
body.dark table#output-table th::after {
  border-bottom: 1px solid var(--color-dull-navy);
}

table#workflow-table button.stop-workflow {
  border: none;
  animation: running-breathe-inset 1s infinite ease-in-out;
}

table#workflow-table button.error-workflow {
  border: none;
  animation: error-breathe-inset 1s infinite ease-in-out;
}

table#workflow-table button:disabled {
  opacity: 0.5;
  user-select: none;
  /* cursor: not-allowed; */
}

table#workflow-table .edit-icon {
  font-size: var(--font-size-sm);
  float: right;
  cursor: pointer;
  opacity: 0.25;
  color: var(--color-navy);
  margin-top: 4px;
}

body.dark table#workflow-table .edit-icon {
  color: var(--color-med-navy);
}
</style>
