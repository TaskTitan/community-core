// Import CSS files
import '@/base/css/reset.css'
import '@/base/css/main.css'
import '@/base/css/dark.css'

import { createApp } from "vue";
import App from "@/App.vue";
import router from "@/router";
import axios from "axios";
import store from "@/store/state";

const app = createApp(App);

app.use(router);
app.use(store);

store.dispatch('theme/initDarkMode');

store.dispatch('auth/fetchUserData').catch(error => {
  console.error("Failed to fetch initial user data:", error);
});

app.mount("#app");

// Update axios interceptor to use auth module state
axios.interceptors.request.use(
  (config) => {
    const token = store.state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
