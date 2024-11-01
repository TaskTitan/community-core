<template>
  <div class="custom-select" tabindex="0">
    <div class="selected">{{ displayValue }}</div>
    <div class="options-container">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="option"
        :class="[{ highlighted: index === selectedIndex }, option.class]"
        tabindex="0"
        @click="selectOption(option)"
        @keydown.enter="selectOption(option)"
      >
        <div class="option-inner">{{ option.label }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CustomSelect",
  props: {
    options: {
      type: Array,
      required: true,
    },
    placeholder: {
      type: String,
      default: "Select an Option",
    },
  },
  data() {
    return {
      selectedOption: null,
      selectedIndex: -1,
    };
  },
  computed: {
    displayValue() {
      return this.selectedOption ? this.selectedOption.label : this.placeholder;
    },
  },
  emits: ['option-selected'],
  methods: {
    initDropdown() {
      const customSelect = this.$el;

      customSelect.addEventListener("keydown", this.handleKeydown);
      customSelect.addEventListener("click", this.handleClick);
      document.addEventListener("click", this.handleOutsideClick);
    },
    toggleDropdown(dropdown, show) {
      let optionsContainer = dropdown.querySelector(".options-container");
      let selected = dropdown.querySelector(".selected");

      if (show !== undefined) {
        optionsContainer.style.display = show ? "block" : "none";
        if (show) {
          selected.classList.add("open");
        } else {
          selected.classList.remove("open");
        }
      } else {
        if (optionsContainer.style.display === "block") {
          optionsContainer.style.display = "none";
          selected.classList.remove("open");
        } else {
          optionsContainer.style.display = "block";
          selected.classList.add("open");
        }
      }
    },
    handleKeydown(event) {
      const optionsContainer = this.$el.querySelector(".options-container");
      const options = this.$el.querySelectorAll(".option");

      switch (event.key) {
        case "Enter":
          if (this.selectedIndex >= 0) {
            this.selectOption(this.options[this.selectedIndex]); // Ensure option is selected
          } else {
            this.toggleDropdown(
              this.$el,
              optionsContainer.style.display !== "block"
            );
          }
          event.preventDefault();
          break;
        case "ArrowDown":
          this.selectedIndex = (this.selectedIndex + 1) % options.length;
          options[this.selectedIndex].focus();
          event.preventDefault();
          break;
        case "ArrowUp":
          this.selectedIndex =
            (this.selectedIndex - 1 + options.length) % options.length;
          options[this.selectedIndex].focus();
          event.preventDefault();
          break;
        case "Escape":
          this.toggleDropdown(this.$el, false);
          this.selectedIndex = -1;
          break;
      }
    },
    handleClick(event) {
      this.toggleDropdown(this.$el);
      event.stopPropagation();
    },
    handleOutsideClick() {
      this.toggleDropdown(this.$el, false);
    },
    selectOption(option) {
      this.selectedOption = option;
      this.$emit("option-selected", option);
      
      // Add a small delay before closing the dropdown
      setTimeout(() => {
        this.toggleDropdown(this.$el, false);
      }, 50);
    },
    setSelectedOption(option) {
      this.selectOption(option);
    },
  },
  mounted() {
    this.initDropdown();
  },
  beforeUnmount() {
    const customSelect = this.$el;
    customSelect.removeEventListener("keydown", this.handleKeydown);
    customSelect.removeEventListener("click", this.handleClick);
    document.removeEventListener("click", this.handleOutsideClick);
  },
};
</script>

<style scoped>
.option.create-new-option {
    color: var(--color-pink);
    font-weight: 500;
}
body.dark .option.create-new-option {
    color: var(--color-green);
    font-weight: 400;
}
</style>