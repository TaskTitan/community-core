import axios from 'axios';
import { API_CONFIG } from '@/tt.config.js';

export default {
  namespaced: true,
  state: {
    token: localStorage.getItem('token') || null,
    user: null,
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token;
      localStorage.setItem('token', token);
    },
    CLEAR_TOKEN(state) {
      state.token = null;
      localStorage.removeItem('token');
    },
    SET_USER(state, user) {
      state.user = user;
    }
  },
  actions: {
    async fetchUserData({ commit, state }) {
      if (!state.token) return;

      try {
        const response = await axios.get(`${API_CONFIG.REMOTE_URL}/api/users/auth/status`, {
          headers: { Authorization: `Bearer ${state.token}` },
          withCredentials: true
        });

        if (response.data.isAuthenticated && response.data.user) {
          commit('SET_USER', response.data.user);
        } else {
          console.error('Auth status returned but no user data:', response.data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    },
    logout({ commit }) {
      commit('CLEAR_TOKEN');
      commit('SET_USER', null);
    }
  },
  getters: {
    isAuthenticated: state => !!state.token
  }
};