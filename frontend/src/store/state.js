import { createStore } from 'vuex';
import auth from './modules/auth';
import chat from './modules/chat';
import theme from './modules/theme';

const store = createStore({
  modules: {
    auth,
    chat,
    theme
  }
});

export default store;