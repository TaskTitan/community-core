<template>
  <h2>My Outputs</h2>
  <div class="card-inner output-list">
    <div v-if="outputs.length > 0" class="create-new">
      <button @click="createNewOutput" class="icon create-output-btn">
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
        Create New Output
      </button>
    </div>
    <div id="saved-outputs" class="saved-items">
      <!-- JS will inject saved outputs here -->
    </div>
    <div v-if="outputs.length === 0" class="empty-state">
      <p>You don't have any saved outputs yet.</p>
      <button @click="createNewOutput" class="icon create-output-btn">
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
        Create New Output
      </button>
    </div>
  </div>
</template>

<script>
import { API_CONFIG } from '@/tt.config.js';
import { useRouter } from 'vue-router';

export default {
  name: "OutputList",
  data() {
    return {
      outputs: []
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    createNewOutput() {
      try {
        this.router.push('/tool-forge');
      } catch (error) {
        console.error('Navigation failed:', error);
        // Fallback for navigation failure
        window.location.href = '/tool-forge';
      }
    },
    async fetchSavedOutputs() {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/content-outputs`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.outputs = data.outputs.map(output => ({
          ...output,
          created_at: new Date(output.created_at),
        }));

        this.populateSavedOutputs(this.outputs);
      } catch (error) {
        console.error("Error fetching outputs:", error);
      }
    },
    populateSavedOutputs(outputs) {
      const savedOutputsContainer = document.getElementById("saved-outputs");

      // Create a table element if not already created
      let table = document.getElementById("output-table");
      if (!table) {
        table = document.createElement("table");
        table.id = "output-table";
        savedOutputsContainer.appendChild(table);
      }

      // Clear existing table contents except headers if any
      table.innerHTML = "<thead><tr><th>Date</th><th>Content Preview</th></tr></thead>";

      const tbody = document.createElement("tbody");
      table.appendChild(tbody);

      // Sort outputs by created_at in descending order
      const sortedOutputs = [...outputs].sort((a, b) => b.created_at - a.created_at);

      sortedOutputs.forEach((output) => {
        const row = tbody.insertRow(-1);
        const cellDate = row.insertCell(0);
        const cellPreview = row.insertCell(1);

        cellDate.innerHTML = `
          <a href="/tool-forge?content-id=${output.id}">
            ${this.formatDate(output.created_at)}
          </a>
        `;

        cellPreview.textContent = this.getPreviewText(output.content);
      });
    },
    formatDate(date) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    getPreviewText(content) {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      
      const textContent = tempElement.textContent || tempElement.innerText;
      
      const firstLine = textContent.split('\n')[0];
      return this.truncateText(firstLine);
    },
    truncateText(text, maxLength = 100) {
      if (typeof text !== 'string') {
        return '';
      }
      if (text.length <= maxLength) {
        return text;
      }
      return text.slice(0, maxLength) + '...';
    },
  },
  mounted() {
    this.fetchSavedOutputs();
  },
};
</script>

<style scoped>
div#saved-outputs {
  border: none !important;
  height: 100%;
  width: 100%;
}
</style>