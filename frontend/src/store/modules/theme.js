export default {
  namespaced: true,
  state: {
    isDarkMode:
      localStorage.getItem("darkMode") !== null
        ? localStorage.getItem("darkMode") === "true"
        : true,
  },
  mutations: {
    SET_DARK_MODE(state, isDarkMode) {
      state.isDarkMode = isDarkMode;
      localStorage.setItem("darkMode", isDarkMode);
      document.body.classList.toggle("dark", isDarkMode);
    },
  },
  actions: {
    toggleDarkMode({ commit, state }) {
      commit("SET_DARK_MODE", !state.isDarkMode);
    },
    initDarkMode({ commit, state }) {
      document.body.classList.toggle("dark", state.isDarkMode);
    },
  },
  getters: {
    isDarkMode: (state) => state.isDarkMode,
  },
};
