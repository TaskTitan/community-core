<template>
  <div
    v-if="popupVisible"
    ref="popup"
    class="popup-tutorial"
    :style="popupStyle"
  >
    <button @click="closeTutorial" class="close-button">&times;</button>
    <h3>{{ currentStep.title }}</h3>
    <p>{{ currentStep.content }}</p>
    <div v-if="!currentStep.hideButton" class="button-container">
      <button @click="nextStep" class="next-button">
        {{ currentStep.buttonText || "Next" }}
      </button>
    </div>
    <div v-if="!isCentered" :class="['popup-arrow', arrowClass]"></div>
  </div>
  <div
    v-if="highlightStyle"
    class="highlight-border"
    :style="highlightStyle"
  ></div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from "vue";

export default {
  name: "PopupTutorial",
  props: {
    config: {
      type: Array,
      default: () => []
    },
    startTutorial: {
      type: Boolean,
      default: false,
    },
    tutorialId: {
      type: String,
      required: true,
    },
  },
  emits: ["close"],
  setup(props, { emit }) {
    const popup = ref(null);
    const currentStepIndex = ref(0);
    const popupVisible = ref(false);
    const popupStyle = ref({});
    const arrowClass = ref("");
    const isCentered = ref(false);
    const highlightStyle = ref(null);
    const completedSteps = ref([]);
    const currentStep = computed(
      () => props.config[currentStepIndex.value] || {}
    );

    const showPopup = () => {
      const step = currentStep.value;
      if (step.position === "center") {
        setCenteredPosition();
      } else {
        setPositionRelativeToTarget(step);
      }

      popupVisible.value = true;

      if (step.autoProgress) {
        setTimeout(nextStep, step.autoProgress);
      }
    };

    const setCenteredPosition = () => {
      isCentered.value = true;
      popupStyle.value = {
        top: "calc(50% - 48px)",
        left: "calc(50% - 48px)",
        transform: "translate(-33%, -6px)",
      };
      arrowClass.value = "";
      highlightStyle.value = null;
    };

    const getTargetElement = (target) => {
      if (target.startsWith('#')) {
        return document.getElementById(target.slice(1));
      } else if (target.startsWith('.')) {
        return document.querySelector(target);
      } else {
        return document.querySelector(target);
      }
    };

    const setPositionRelativeToTarget = async (step) => {
      isCentered.value = false;
      const targetElement = getTargetElement(step.target);
      if (!targetElement) {
        console.warn(
          `Target element "${step.target}" not found. Skipping this step.`
        );
        nextStep();
        return;
      }

      popupStyle.value = {
        top: "0px",
        left: "0px",
        visibility: "hidden",
      };

      await nextTick();

      const popupRect = popup.value.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      let top, left;
      switch (step.position) {
        case "top":
          top = targetRect.top - popupRect.height - 20;
          left = targetRect.left + (targetRect.width - popupRect.width) / 2;
          arrowClass.value = "popup-arrow-bottom";
          break;
        case "bottom":
          top = targetRect.bottom + 20;
          left = targetRect.left + (targetRect.width - popupRect.width) / 2;
          arrowClass.value = "popup-arrow-top";
          break;
        case "left":
          top = targetRect.top + (targetRect.height - popupRect.height) / 2;
          left = targetRect.left - popupRect.width - 20;
          arrowClass.value = "popup-arrow-right";
          break;
        case "right":
          top = targetRect.top + (targetRect.height - popupRect.height) / 2;
          left = targetRect.right + 20;
          arrowClass.value = "popup-arrow-left";
          break;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < 0) left = 0;
      if (left + popupRect.width > viewportWidth)
        left = viewportWidth - popupRect.width;
      if (top < 0) top = 0;
      if (top + popupRect.height > viewportHeight)
        top = viewportHeight - popupRect.height;

      popupStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
        visibility: "visible",
      };

      highlightStyle.value = {
        top: `${targetRect.top - 4}px`,
        left: `${targetRect.left - 4}px`,
        width: `${targetRect.width + 8}px`,
        height: `${targetRect.height + 8}px`,
      };
    };

    const loadCompletedSteps = () => {
      const savedSteps = localStorage.getItem(`tutorial_${props.tutorialId}`);
      if (savedSteps) {
        completedSteps.value = JSON.parse(savedSteps);
      }
    };

    const saveCompletedStep = (stepIndex) => {
      if (!completedSteps.value.includes(stepIndex)) {
        completedSteps.value.push(stepIndex);
        localStorage.setItem(`tutorial_${props.tutorialId}`, JSON.stringify(completedSteps.value));
      }
    };

    const nextStep = () => {
      saveCompletedStep(currentStepIndex.value);
      do {
        currentStepIndex.value++;
      } while (
        currentStepIndex.value < props.config.length &&
        completedSteps.value.includes(currentStepIndex.value)
      );

      if (currentStepIndex.value >= props.config.length) {
        closeTutorial();
      } else {
        showPopup();
      }
    };

    const startTutorial = () => {
      currentStepIndex.value = 0;
      while (
        currentStepIndex.value < props.config.length &&
        completedSteps.value.includes(currentStepIndex.value)
      ) {
        currentStepIndex.value++;
      }

      if (currentStepIndex.value < props.config.length) {
        showPopup();
      } else {
        emit("close");
      }
    };

    const closeTutorial = () => {
      popupVisible.value = false;
      highlightStyle.value = null;
      emit("close");
    };

    watch(
      () => props.startTutorial,
      (newStartTutorial) => {
        if (newStartTutorial) {
          startTutorial();
        } else {
          closeTutorial();
        }
      },
      { immediate: true }
    );

    onMounted(() => {
      loadCompletedSteps();
    });

    return {
      currentStep,
      popupVisible,
      popupStyle,
      arrowClass,
      isCentered,
      highlightStyle,
      nextStep,
      closeTutorial,
      popup,
    };
  },
};
</script>

<style scoped>
.popup-tutorial {
  position: fixed;
  background-color: var(--color-navy);
  border-radius: 8px;
  border: 3px solid var(--color-pink);
  padding: 16px 32px 16px 16px;
  max-width: 360px;
  width: fit-content;
  z-index: 1000;
  transition: opacity 0.3s ease-in-out;
}

.popup-tutorial h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--color-white);
}
.popup-tutorial p {
  color: var(--color-light-navy);
  line-height: 1.35;
}
.button-container {
  display: flex;
  justify-content: flex-start;
  margin-top: 12px;
}
.next-button {
  /* background-color: var(--color-pink); */
  background-image: linear-gradient(45deg, #e53d8f, #e53de3);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.next-button:hover {
  background-color: var(--color-pink);
}
.close-button {
  position: absolute;
  top: 0px;
  right: 0px;
  padding: 3px 8px 8px 8px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #7f8c8d;
}
.close-button:hover {
  color: var(--color-white);
}
.popup-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}
.popup-arrow-top {
  border-width: 0 10px 10px 10px;
  border-color: transparent transparent var(--color-pink) transparent;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
}
.popup-arrow-bottom {
  border-width: 10px 10px 0 10px;
  border-color: var(--color-pink) transparent transparent transparent;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
}
.popup-arrow-left {
  border-width: 10px 10px 10px 0;
  border-color: transparent var(--color-pink) transparent transparent;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
}
.popup-arrow-right {
  border-width: 10px 0 10px 10px;
  border-color: transparent transparent transparent var(--color-pink);
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
}
.highlight-border {
  position: fixed;
  border: 4px solid var(--color-pink);
  border-radius: 4px;
  pointer-events: none;
  z-index: 99;
  transition: all 0.3s ease-in-out;
  margin-top: -5px;
  margin-left: -4px;
}

body.dark .popup-tutorial {
  background-color: var(--color-dark-navy);
}

body.dark .popup-arrow-top {
  border-color: transparent transparent var(--color-pink) transparent;
}
body.dark .popup-arrow-bottom {
  border-color: var(--color-pink) transparent transparent transparent;
}
body.dark .popup-arrow-left {
  border-color: transparent var(--color-pink) transparent transparent;
}
body.dark .popup-arrow-right {
  border-color: transparent transparent transparent var(--color-pink);
}
</style>
