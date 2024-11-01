<template>
  <h2>Account Stats</h2>
  <div class="card-inner gradient-border">
    <div class="user-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <h3>Total Workflows</h3>
          <p>{{ stats.totalWorkflows }}</p>
        </div>
        <div class="stat-item">
          <h3>Total Custom Tools</h3>
          <p>{{ stats.totalCustomTools }}</p>
        </div>
        <!-- <div class="stat-item">
          <h3>Total Executions</h3>
          <p>{{ stats.totalExecutions }}</p>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import axios from "axios";
import { API_CONFIG } from '@/tt.config.js';

export default {
  name: "WorkflowStats",
  setup() {
    const stats = ref({
      totalWorkflows: 0,
      totalExecutions: 0,
      totalCustomTools: 0,
    });

    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const response = await axios.get(
          `${API_CONFIG.BASE_URL}/api/users/user-stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        stats.value = response.data;
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };

    onMounted(fetchUserStats);

    return { stats };
  },
};
</script>

<style scoped>
.user-stats {
  padding: 16px;
  height: 100%;
  width: calc(100% - 32px);
}

.stats-grid {
  display: flex;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 0;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-evenly;
  align-items: center;
  height: 100%;
}

.stat-item {
  text-align: center;
}

.stat-item h3 {
  font-size: 14px;
  margin-bottom: 16px;
}

.stat-item p {
  font-size: 36px;
  font-weight: bold;
}

.card-inner.gradient-border {
    overflow: visible !important;
}
</style>
