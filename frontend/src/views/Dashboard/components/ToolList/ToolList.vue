<template>
  <h2>My Tools</h2>
  <div class="card-inner">
    <div v-if="tools.length > 0" class="create-new">
        <button @click="createNewTool" class="icon create-tool-btn">
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
          Create New Tool
        </button>
    </div>
    <div id="saved-templates" class="saved-items">
      <table id="template-table">
        <thead>
          <tr>
            <th>Icon</th>
            <th>Name</th>
            <th>Instructions</th>
            <th>Provider</th>
            <th>Model</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="tools.length > 0">
            <tr v-for="tool in tools" :key="tool.id">
              <td><SvgIcon :name="tool.icon" /></td>
              <td>
                <a :href="`/tool-forge?tool-id=${tool.id}`">
                  {{ truncateText(tool.title) }}
                </a>
              </td>
              <td>{{ truncateText(getInstructions(tool.parameters)) }}</td>
              <td>{{ truncateText(getProvider(tool.parameters)) }}</td>
              <td>{{ truncateText(getModel(tool.parameters)) }}</td>
            </tr>
          </template>
          <!-- <template v-else>
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <p>You don't have any tools yet.</p>
                  <button @click="createNewTool" class="icon create-tool-btn">
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
                    Create New Tool
                  </button>
                </div>
              </td>
            </tr>
          </template> -->
        </tbody>
      </table>
    </div>
    <div v-if="tools.length === 0" class="empty-state">
      <p>You don't have any tools yet.</p>
      <button @click="createNewTool" class="icon create-tool-btn">
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
        Create New Tool
      </button>
    </div>
  </div>
</template>

<script>
import SvgIcon from "@/views/_components/common/SvgIcon.vue";
import { API_CONFIG } from "@/tt.config.js";
import { useRouter } from "vue-router";

export default {
  name: "ToolList",
  components: {
    SvgIcon,
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      tools: [],
    };
  },
  methods: {
    createNewTool() {
      try {
        this.router.push("/tool-forge");
      } catch (error) {
        console.error("Navigation failed:", error);
        // Fallback for navigation failure
        window.location.href = "/tool-forge";
      }
    },
    async fetchCustomTools() {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/custom-tools/`,
          {
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.tools = data.tools;
      } catch (error) {
        console.error("Error fetching custom tools:", error);
      }
    },
    parseProperties(parameters) {
      return typeof parameters === "string"
        ? JSON.parse(parameters)
        : parameters;
    },
    getInstructions(parameters) {
      const params = this.parseProperties(parameters);
      return params.instructions || "";
    },
    getProvider(parameters) {
      const params = this.parseProperties(parameters);
      return params.provider || "";
    },
    getModel(parameters) {
      const params = this.parseProperties(parameters);
      return params.model || "";
    },
    getOtherParams(parameters) {
      const params = this.parseProperties(parameters);
      const { instructions, provider, model, ...otherParams } = params;
      return otherParams;
    },
    truncateText(text, maxLength = 150) {
      if (typeof text !== "string") {
        return "";
      }
      if (text.length <= maxLength) {
        return text;
      }
      return text.slice(0, maxLength) + "...";
    },
  },
  mounted() {
    this.fetchCustomTools();
  },
};
</script>

<style scoped>
div#saved-templates {
  border: none !important;
  height: 100%;
  width: 100%;
}

.param-item strong {
  display: block;
  font-weight: 500;
}

.param-item span {
  font-weight: 400;
  color: var(--color-med-navy);
}

.param-item span.param-value {
  opacity: 1;
}

.param-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
</style>
