<template>
  <div class="oauth-manager">
    <h2>App Connections</h2>

    <div class="search-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search apps..."
        @input="searchApps"
      />
    </div>

    <div class="categories">
      <template v-for="(category, index) in categories" :key="category">
        <button
          @click="selectCategory(category)"
          :class="{ active: selectedCategory === category }"
        >
          {{ category }}
        </button>
        <span v-if="index < categories.length - 1" class="category-separator"
          >|</span
        >
      </template>
    </div>

    <div class="all-apps">
      <h3>{{ categoryHeading }}</h3>
      <div class="app-grid" ref="appGrid" @scroll="handleScroll">
        <div v-for="app in visibleApps" :key="app.id" class="app-item">
          <SvgIcon :name="app.icon" />
          <span>{{ app.name }}</span>
          <ToggleSwitch
            :model-value="app.connected"
            @update:model-value="toggleConnection(app.id, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import ToggleSwitch from "./components/ToggleSwitch/ToggleSwitch.vue";
import SvgIcon from "@/views/_components/common/SvgIcon.vue";

const searchQuery = ref("");
const selectedCategory = ref("All");
const categories = [
  "All",
  "Productivity",
  "Social Media",
  "Development",
  "Finance",
];
const categoryHeading = computed(() => {
  if (selectedCategory.value === "All") {
    return "All Apps";
  } else {
    return `${selectedCategory.value} Apps`;
  }
});

const allApps = ref([
  // This would be populated from an API call
  {
    id: "google",
    name: "Google",
    icon: "google",
    connected: true,
    category: "Productivity",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "slack",
    connected: true,
    category: "Productivity",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: "dropbox",
    connected: false,
    category: "Productivity",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "github",
    connected: false,
    category: "Development",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: "twitter",
    connected: false,
    category: "Social Media",
  },
]);

const visibleApps = ref([]);
const currentPage = ref(1);
const appsPerPage = 20;

const filteredApps = computed(() => {
  return allApps.value.filter(
    (app) =>
      (selectedCategory.value === "All" ||
        app.category === selectedCategory.value) &&
      app.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const appGrid = ref(null);
const loadingMore = ref(false);

const handleScroll = () => {
  if (loadingMore.value) return;

  const grid = appGrid.value;
  if (!grid) return;

  const bottomOfGrid = grid.scrollTop + grid.clientHeight;
  const totalHeight = grid.scrollHeight;

  if (bottomOfGrid >= totalHeight - 100) {
    // Load more when within 100px of bottom
    loadMoreApps();
  }
};

const loadMoreApps = () => {
  if (loadingMore.value) return;
  loadingMore.value = true;

  const start = (currentPage.value - 1) * appsPerPage;
  const end = start + appsPerPage;
  const newApps = filteredApps.value.slice(start, end);

  if (newApps.length > 0) {
    visibleApps.value = [...visibleApps.value, ...newApps];
    currentPage.value++;
  }

  loadingMore.value = false;
};

const searchApps = () => {
  currentPage.value = 1;
  visibleApps.value = [];
  loadMoreApps();
};

const selectCategory = (category) => {
  selectedCategory.value = category;
  searchApps();
};

const toggleConnection = (appId, newValue) => {
  const app = allApps.value.find((a) => a.id === appId);
  if (app) {
    app.connected = newValue;
    // Here you would implement the actual connection/disconnection logic
    console.log(
      `${app.connected ? "Connecting to" : "Disconnecting from"} ${app.name}`
    );
  }
};

onMounted(() => {
  loadMoreApps();
  window.addEventListener("resize", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleScroll);
});
</script>

<style scoped>
.oauth-manager {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
}

.oauth-manager h2,
.oauth-manager h3 {
  padding-left: 1px;
}

.app-grid {
  display: flex;
  gap: 20px;
  max-height: 600px;
  overflow-y: auto;
  flex-wrap: wrap;
  flex-direction: row;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.app-item :deep(svg) {
  width: 18px;
  height: 18px;
  margin-bottom: 3px;
}

.all-apps h3 {
  margin-bottom: 16px;
}

.categories {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}

.search-bar {
  width: 100%;
}

.categories button {
  padding: 4px 8px;
  border: 1px solid var(--color-light-navy);
  border-radius: 8px;
}

.categories button.active {
  outline: 2px solid var(--color-pink);
}

body.dark .categories button {
  border: 1px solid var(--color-dull-navy);
}

.category-separator {
  font-weight: normal;
  margin-top: 3px;
  opacity: 0.15;
}
</style>
