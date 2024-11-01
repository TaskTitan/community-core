import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '@/views/Dashboard/Dashboard.vue';
import ChatView from '@/views/Chat/Chat.vue';
import ToolForge from '@/views/ToolForge/ToolForge.vue';
import WorkflowDesignerView from '@/views/WorkflowDesigner/WorkflowDesigner.vue';
import SettingsView from '@/views/Settings/Settings.vue';
import DocsView from '@/views/Docs/Docs.vue';
import store from '@/store/state';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/chat',
      name: 'Titan Chat',
      component: ChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/tool-forge',
      name: 'Tool Forge',
      component: ToolForge,
      meta: { requiresAuth: true }
    },
    {
      path: '/workflow-designer',
      name: 'Workflow Designer',
      component: WorkflowDesignerView,
      meta: { requiresAuth: true }
    },
    {
      path: '/docs',
      component: DocsView,
      children: [
        {
          path: '',
          name: 'Docs',
          component: DocsView,
        },
        {
          path: ':type/:page',
          name: 'DocsPage',
          component: DocsView,
        },
      ],
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth && !store.state.auth.user) {
    try {
      // If no user in store, try to fetch user data
      await store.dispatch('auth/fetchUserData');
      
      if (!store.state.auth.user) {
        // If still no user after fetch attempt, redirect to login
        next('/settings');
      } else {
        next();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      next('/settings');
    }
  } else {
    next();
  }
});

// Add error handling to prevent infinite loading on failed routes
router.onError((error) => {
  console.error('Router error:', error);
  // You might want to set isLoading to false here if you expose it globally
});

export default router;
