import { Message, ChatWindow } from "@/views/_components/base/ChatWindow";

export default {
  namespaced: true,
  state: {
    mainChatWindow: new ChatWindow(),
    activeStreamId: null,
    isStreaming: false,
    messageCount: 0,
    messages: [],
    page: null,
  },
  mutations: {
    SET_PAGE(state, page) {
      state.page = page;
    },
    SET_STREAMING(state, value) {
      state.isStreaming = value;
    },
    SET_ACTIVE_STREAM(state, value) {
      state.activeStreamId = value;
    },
    ADD_MESSAGE(state, message) {
      state.messages.push(message);
    },
    RECEIVE_MESSAGE(state, { id, sender, content, timestamp }) {
      const message = new Message(id, sender, content, timestamp);
      state.mainChatWindow.receiveMessage(message);
    },
    CREATE_THREAD(state, messageId) {
      state.mainChatWindow.createThread(messageId);
    },
    ADD_MESSAGE_TO_THREAD(state, { threadId, id, sender, content, timestamp }) {
      const message = new Message(id, sender, content, timestamp);
      state.mainChatWindow.threads.get(threadId)?.addMessage(message);
    },
    INCREMENT_MESSAGE_COUNT(state) {
      state.messageCount += 1;
    },
  },
  actions: {
    receiveNewMessage({ commit }, messageData) {
      commit("RECEIVE_MESSAGE", messageData);
    },
    createThreadFromMessage({ commit }, messageId) {
      commit("CREATE_THREAD", messageId);
    },
    addMessageToThread({ commit }, messageData) {
      commit("ADD_MESSAGE_TO_THREAD", messageData);
    },
    incrementMessageCount({ commit }) {
      commit("INCREMENT_MESSAGE_COUNT");
    },
  },
};
