<template>
  <main-area>
    <LoadingOverlay v-if="isLoading" />
    <asset-panel>
      <div class="card-row">
        <div class="card full">
          <WorkflowList @workflows-loaded="onWorkflowsLoaded"></WorkflowList>
        </div>
        <!-- <div class="card half">
          <WorkflowStats />
        </div> -->
      </div>
      <div class="card-row">
        <div class="card full">
          <WorkflowStats />
        </div>
      </div>
      <div class="card-row">
        <div class="card full">
          <ToolList></ToolList>
        </div>
      </div>
      <div class="card-row">
        <div class="card full">
          <OutputList></OutputList>
        </div>
      </div>
    </asset-panel>
  </main-area>
</template>

<script>
import WorkflowList from "./components/WorkflowList/WorkflowList.vue";
import WorkflowStats from "./components/WorkflowStats/WorkflowStats.vue";
import OutputList from "./components/OutputList/OutputList.vue";
import ToolList from "./components/ToolList/ToolList.vue";
import LoadingOverlay from "@/views/_components/utility/LoadingOverlay.vue";

export default {
  name: "Dashboard",
  components: {
    WorkflowList,
    WorkflowStats,
    OutputList,
    ToolList,
    LoadingOverlay,
  },
  data() {
    return {
      isLoading: true,
    };
  },
  methods: {
    onWorkflowsLoaded() {
      setTimeout(() => {
        this.isLoading = false;
      }, 500);
    },
  },
  mounted() {
    document.body.setAttribute("data-page", "dashboard");
  },
};
</script>

<style scoped>
main-area {
  justify-content: center;
}

.p-0 {
  padding: 0 !important;
}
.m-0 {
  margin: 0 !important;
}

asset-panel {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  max-width: 848px;
  height: fit-content;
  overflow: scroll;
  padding-bottom: 30px;
  align-content: flex-start;
}
.card-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin: 24px 4px;
  margin-bottom: 0;
  height: fit-content;
}

.card {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  margin-right: 24px;
  padding: 0;
  /* border: 1px solid var(--color-light-navy); */
  /* border-radius: 8px; */
  /* background: var(--color-ultra-light-navy); */
}

.card:last-child {
  margin-right: 0;
}

.card-inner {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  width: calc(100% - 34px); /* ACCOUNTS FOR BORDER 2px */
  width: -webkit-fill-available;
  height: fit-content;
  max-height: 360px;
  margin-top: 12px;
  padding: 0;
  border: 1px solid var(--color-light-navy);
  border-radius: 8px;
  background: var(--color-dull-white);
  max-height: 356px;
  overflow: scroll;
}

.card-inner .card-inner {
  /* height: calc(100% - 50px); */
  margin-top: 0;
}

body.dark #agent-list {
  border: 1px solid var(--color-dull-navy);
}

.full {
  width: 100% !important;
}

.card .title {
  color: var(--color-navy);
}

body.dark .card .title {
  color: var(--color-med-navy);
}

.table-wrapper {
  width: calc(
    100% - 2px
  ); /* WHY THE F DO I HAVE TO ACCOUNT FOR THE BORDER??? */
  border: 1px solid var(--color-light-navy);
  border-radius: 8px;
  overflow: scroll;
  margin: 16px 0 0;
  /* cursor: n-resize; */
}

/* THIS MAKES FIRST ROW STAY WHILE BOTTOM IS SCROLLABLE */
tr:first-child {
  position: sticky;
  top: 0;
}

tr:last-child td {
  border-bottom: none !important;
}

body.dark .table-wrapper {
  border: 1px solid var(--color-dull-navy);
}

/* THIS MAKES FIRST ROW STAY WHILE BOTTOM IS SCROLLABLE */
tr:first-child {
  position: sticky;
  top: 0;
}

#my-agents {
  border-top: none;
  border-left: none;
  border-right: none;
}

.card-inner.gradient-border {
  overflow: visible;
  border: none;
}
</style>

<style>
/* GLOBAL SCOPE FOR CHILD CARDS */
body[data-page="dashboard"] .card-inner {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: fit-content;
  max-height: 360px;
  overflow: scroll;
  margin: 16px 0 0;
  border-radius: 8px;
  background: var(--color-dull-white);
  border: 1px solid var(--color-light-navy);
}
body[data-page="dashboard"].dark .card-inner {
  background: var(--color-ultra-dark-navy);
  border: 1px solid var(--color-dull-navy);
}
body[data-page="dashboard"] tr:last-child {
  border-bottom: none !important;
}
body[data-page="dashboard"] .card h2 {
  padding-left: 1px;
}
body[data-page="dashboard"] table#workflow-table {
  border-radius: 8px;
}
body[data-page="dashboard"] .empty-state,
body[data-page="dashboard"] .create-new {
  display: flex;
  width: 100%;
  padding: 24px 0;
  text-align: center;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: center;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--color-light-navy);
}

body[data-page="dashboard"].dark .create-new {
  border-bottom: 1px solid var(--color-dull-navy);
}
body[data-page="dashboard"].dark .empty-state {
  border-bottom: none;
}
body[data-page="dashboard"] button.icon {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  color: var(--color-pink);
  font-weight: 600;
}
body[data-page="dashboard"].dark button.icon {
  color: var(--color-green);
  font-weight: 400;
}
</style>
