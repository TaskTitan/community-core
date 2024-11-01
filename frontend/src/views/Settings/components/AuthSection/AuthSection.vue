<template>
  <inner-setting-panel class="auth-section">
    <div v-if="!isAuthenticated" class="google-auth">
      <button @click="connectGoogle">
        <SvgIcon name="google" />
        Login with Google
      </button>
    </div>
    <div class="google-auth" v-else>
      <p>Welcome, {{ user?.name || user?.email }}!</p>
      <button class="logout" @click="logout">Logout</button>
    </div>
  </inner-setting-panel>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import SvgIcon from "@/views/_components/common/SvgIcon.vue";
import { API_CONFIG } from '@/tt.config.js';

export default {
  name: "AuthSection",
  components: { SvgIcon },
  setup() {
    const store = useStore();
    const router = useRouter();

    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
    const user = computed(() => store.state.auth.user);

    const connectGoogle = () => {
      window.location.href = `${API_CONFIG.REMOTE_URL}/api/users/auth/google`;
    };

    const logout = () => store.dispatch('auth/logout');

    onMounted(async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newToken = urlParams.get('token');
      
      if (newToken) {
        store.commit('auth/SET_TOKEN', newToken);
        await store.dispatch('auth/fetchUserData');
        router.push('/');
      } else {
        await store.dispatch('auth/fetchUserData');
      }
    });

    return { isAuthenticated, user, connectGoogle, logout };
  },
};
</script>

<style scoped>
inner-setting-panel.auth-section {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
}

.google-auth {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-content: flex-start;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 8px;
}

button {
  display: flex;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--color-light-navy);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  justify-content: flex-start;
  align-content: center;
  flex-direction: row;
  flex-wrap: nowrap;
  width: fit-content;
}

body.dark button {
  color: var(--color-dull-white);
  background-color: var(--color-black-navy);
  border-color: var(--color-dull-navy);
}

button .svg-icon {
  margin-right: 10px;
}

body.dark button {
  color: var(--color-dull-white);
}
</style>
