<template>
  <div class="chat-input-container">
    <form action="" id="template-form" enctype="multipart/form-data">
      <chat-input class="field-group chat-generate">
        <textarea
          id="user-current-message"
          name="user-current-message"
          placeholder="Tell me a funny joke..."
          @input="adjustTextareaHeight"
          @focus="adjustTextareaHeight"
          @blur="handleBlur"
          @paste="$nextTick(adjustTextareaHeight)"
          ref="textarea"
          :class="{ 'expanded': isExpanded }"
        ></textarea>
      </chat-input>
    </form>
    <button class="generate" @click="handleGenerateClickWrapper" :class="{ 'expanded': isExpanded }">
      <img src="../../../assets/icons/create-light.svg" alt="" />Send
    </button>
  </div>
</template>

<script>
import { handleGenerateClick } from "@/views/_components/base/stream";
import { ref, computed, onMounted } from 'vue';

export default {
  name: "ChatInput",
  setup() {
    const textarea = ref(null);
    const textareaHeight = ref(55);

    const isExpanded = computed(() => textareaHeight.value > 55);

    const handleGenerateClickWrapper = () => {
      if (textarea.value) {
        // Call the original handleGenerateClick function
        handleGenerateClick();
        
        // Clear the textarea
        textarea.value.value = '';
        
        // Reset the textarea height
        textarea.value.style.height = '55px';
        textareaHeight.value = 55;
      }
    };

    const adjustTextareaHeight = () => {
      if (textarea.value) {
        // Forcibly remove expanded class if textarea is empty
        if (textarea.value.value.length === 0) {
          textarea.value.style.height = '55px';
          textareaHeight.value = 55;
          return;
        }

        // Reset height to auto and set a very small height to force recalculation
        textarea.value.style.height = 'auto';
        textarea.value.style.height = '1px';
        
        // Set the height to the scrollHeight
        const newHeight = Math.max(55, textarea.value.scrollHeight);
        textarea.value.style.height = `${newHeight}px`;
        textareaHeight.value = newHeight;
      }
    };

    const handleBlur = () => {
      if (textarea.value && textarea.value.value === '') {
        textarea.value.style.height = '55px';
        textareaHeight.value = 55;
      }
    };

    onMounted(() => {
      if (textarea.value) {
        adjustTextareaHeight();
      }
    });

    return {
      handleGenerateClickWrapper,
      adjustTextareaHeight,
      handleBlur,
      textarea,
      isExpanded
    };
  },
};
</script>

<style scoped>
.chat-input-container {
  position: relative;
  width: 100%;
  margin-bottom: 24px;
}
form#template-form {
  gap: 16px;
}
.generate {
  position: absolute;
  width: fit-content;
  height: 100%;
  max-height: 56px;
  right: 0;
  bottom: 0;
  padding: 0 32px;
  border-radius: 0 0 32px 0;
  outline-offset: -1px;
  outline-color: var(--color-white);
  border: none;
}
textarea#user-current-message {
  min-height: 55px;
  height: 55px;
  border-radius: 0 0 32px 32px;
  padding: 0 160px 0 24px;
  overflow-y: hidden;
  align-content: space-evenly;
  transition: padding 0.3s ease;
}
textarea#user-current-message.expanded {
  padding-top: 12px;
  padding-bottom: 24px;
  padding-left: 24px;
  padding-right: 24px;
}
.generate.expanded {
  height: 36px;
  max-height: none;
}
</style>