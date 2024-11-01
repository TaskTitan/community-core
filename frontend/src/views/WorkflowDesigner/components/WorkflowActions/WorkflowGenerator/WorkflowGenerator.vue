<template>
  <button
    id="workflow-magic-button"
    @click="workflowGenerator"
    title="Generate Workflow with AI"
  >
    <i class="fas fa-magic"></i>
  </button>
</template>

<script>
import toolLibrary from "../../../tools/toolLibrary.json";
import generateUUID from "@/views/_utils/generateUUID.js";
import store from "@/store/state";
import { API_CONFIG } from '@/tt.config.js';

export default {
  name: "WorkflowGenerator",
  methods: {
    async workflowGenerator() {
      // Prompt the user for an overview of what the template should do
      const templateOverview = prompt(
        "Please describe what the workflow should do:"
      );
      // If the user cancels the prompt, do nothing
      if (!templateOverview) return;

      // Use the AI API to generate a new template based on the user's description
      try {
        let generatedTemplateData = await this.generateWorkflowViaAI(
          templateOverview
        );

        generatedTemplateData = this.removeMarkdownJson(
          generatedTemplateData.trim()
        );
        console.log(generatedTemplateData);

        const parsedData = JSON.parse(generatedTemplateData);
        console.log(parsedData);

        const newWorkflowId = generateUUID();
        parsedData.id = newWorkflowId;

        localStorage.setItem("activeWorkflow", newWorkflowId);
        localStorage.setItem("canvasState", JSON.stringify(parsedData));

        this.$emit("workflow-generated", parsedData);
        this.$emit("update-active-workflow-id", newWorkflowId);
        alert(
          "Your AI-generated workflow has been created and is ready to use!"
        );
      } catch (error) {
        console.error("Error generating workflow:", error);
        alert(
          "We encountered an issue while creating your workflow. Please try again."
        );
      }
    },
    async generateWorkflowViaAI(templateOverview) {
      const customTools = await this.fetchCustomTools();

      let workflowOverview = `[WORKFLOW OVERVIEW FROM USER]:
        ${templateOverview}
  
        **** The system is guaranteed to fail if you use any tool types outside of the below list: 
  
        [AVAILABLE TOOLS]:
        ${JSON.stringify(toolLibrary)}
        
        [USER'S CUSTOM TOOLS]:
        ${JSON.stringify(customTools)}
        
        [NEW WORKFLOW OBJECT USING ONLY AVAILABLE TOOLS AND CUSTOM TOOLS]:`;

      try {
        this.showGeneratingModal();
        const authToken = localStorage.getItem("token");
        const response = await fetch(
          "http://127.0.0.1:3333/api/stream/generate-workflow",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              workflowOverview: workflowOverview,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data.workflow;
        } else {
          console.error("Error: Server responded with status", response.status);
          return "Error: Unable to generate workflow";
        }
      } catch (error) {
        console.error("Error:", error);
        return "Error: " + error.message;
      } finally {
        this.hideGeneratingModal();
      }
    },
    async fetchCustomTools() {
      const userId = store.state.auth.user?.id;
      if (!userId) {
        console.log("No user ID found in store, skipping fetch");
        return [];
      }

      try {
        const token = localStorage.getItem("token");
        console.log("Fetching custom tools for user:", userId);
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/custom-tools`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched custom tools:", data);

        // Check if the response has a 'tools' property
        const tools = data.tools || data;

        if (!Array.isArray(tools)) {
          console.error("Unexpected response format:", data);
          return [];
        }

        return tools.map((tool) => ({
          ...tool,
          category: "custom",
        }));
      } catch (error) {
        console.error("Error fetching custom tools:", error);
        return [];
      }
    },
    removeMarkdownJson(str) {
      // Remove ```json and ``` markers
      const withoutMarkdown = str.replace(/```json|```/g, "");
      // Remove newlines and extra whitespace
      return withoutMarkdown.replace(/\s+/g, " ").trim();
    },
    showGeneratingModal() {
      document.getElementById("generating-modal").style.display = "flex";
    },
    hideGeneratingModal() {
      document.getElementById("generating-modal").style.display = "none";
    },
    escapeJsonString(str) {
      return str
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
    },
  },
  mounted() {},
};
</script>

<style scoped>
button {
  padding: 10px;
  border: 1px solid rgba(1, 5, 42, 0.25);
  background: var(--Bright-White, #fcfcfc);
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

button:hover {
  cursor: pointer !important;
  opacity: 0.6;
}

i {
  font-size: 16px;
  cursor: pointer !important;
}
</style>
