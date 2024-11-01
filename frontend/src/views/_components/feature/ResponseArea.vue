<!-- THIS HAS TO BE IN A SCRIPT WITH A SETUP ATTRIBUTE -->
<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <inner-editor-area id="response-area" :contenteditable="route.path === '/tool-forge'">
    <!-- Content for /chat route -->
    <div v-if="route.path === '/chat'" id="placeholder-text" class="placeholder-text" spellcheck="false" style="user-select: none">
      <h4 class="placeholder">Send a message from the chat input below.</h4>
    </div>

    <!-- Content for /tool-forge route -->
    <div v-else-if="route.path === '/tool-forge'" id="placeholder-text" class="placeholder-text" spellcheck="false" style="user-select: none">
      <h3 class="placeholder">Fill out your template fields and click generate...</h3>
      <hr />
      <h4 class="placeholder">Then your AI generated content will show up here.</h4>
    </div>
  </inner-editor-area>
</template>

<script>
import { ref } from 'vue';
import { getContentFromQueryParam, addPlaceholderEventListeners } from '../base/response';

export default {
  name: 'SharedResponseArea',
  emits: ['content-loaded'],
  setup(props, { emit }) {
    const isContentLoaded = ref(false);

    return {
      isContentLoaded,
      emit
    };
  },
  methods: {
    initResponseArea() {
      // CLEAR SELECTION FROM EDITOR AREA IF CLICK AWAY
      const editorArea = document.querySelector('editor-area');
      editorArea.addEventListener('mousedown', function (event) {
        const innerEditorArea = editorArea.querySelector('inner-editor-area');
        if (innerEditorArea && !innerEditorArea.contains(event.target)) {
          if (window.getSelection) {
            window.getSelection().removeAllRanges();
          } else if (document.selection) {
            document.selection.empty();
          }
        }
      });
    },
    async loadContent() {
      try {
        await getContentFromQueryParam();
        addPlaceholderEventListeners();
        this.isContentLoaded = true;
        this.$emit('content-loaded');
      } catch (error) {
        console.error('Error loading content:', error);
        // Optionally, you can still emit the event or handle the error differently
        this.$emit('content-loaded');
      }
    }
  },
  mounted() {
    this.initResponseArea();
    this.loadContent();
  },
};
</script>

<style>
/* FIXES THE WEIRD SPACE AT THE START OF THE GENERATED CODE BLOCKS BY SHOWDOWN */
pre code {
    margin-top: 0;
}

body.dark #response-area hr {
    border: none;
    border-bottom: 1px solid var(--color-dull-navy);
}


.message-receive {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
}

.assistant-message-receive {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}

.assistant-message-receive:focus {
    outline: none;
    border: none;
}

body[data-page='chat'] .assistant-message-receive {
  width: 100%;
  border-radius: 0 16px 16px 16px;
  gap: 16px;
  align-self: flex-start;
}

body[data-page='chat'] .user-message-sent {
  width: fit-content;
  max-width: calc(100% - 48px);
  margin-left: 24px;
  padding: 16px 24px;
  /* background: var(--color-white); */
  border: 1px solid var(--color-light-navy);
  border-radius: 16px 16px 0 16px;
  gap: 16px;
  align-self: flex-end;
}


</style>