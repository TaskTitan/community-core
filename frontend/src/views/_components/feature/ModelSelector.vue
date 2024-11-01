<template>
  <div id="model-selector" class="field-group model-selector">
    <div class="select-wrapper">
      <p class="label">Provider:</p>
      <CustomSelect
        :options="providerOptions"
        :placeholder="'Select Provider'"
        @option-selected="updateProvider"
        ref="providerSelect"
      />
    </div>
    <div class="select-wrapper">
      <p class="label">Model:</p>
      <CustomSelect
        :options="modelOptions"
        :placeholder="'Select Model'"
        @option-selected="updateModel"
        ref="modelSelect"
      />
    </div>
  </div>
</template>

<script>
import CustomSelect from "@/views/_components/common/CustomSelect.vue";
import { AI_PROVIDERS_CONFIG } from "@/tt.config";

export default {
  components: {
    CustomSelect,
  },
  props: {
    provider: {
      type: String,
      default: "",
    },
    model: {
      type: String,
      default: "",
    },
  },
  emits: ["update:provider", "update:model"],
  data() {
    return {
      initialized: false,
      internalProvider: this.provider,
      internalModel: this.model,
      providers: AI_PROVIDERS_CONFIG.providers,
      modelsByProvider: AI_PROVIDERS_CONFIG.modelsByProvider,
    };
  },
  computed: {
    currentProvider() {
      return this.provider || this.providers[0];
    },
    availableModels() {
      return this.modelsByProvider[this.currentProvider] || [];
    },
    currentModel() {
      return this.model || this.availableModels[0] || "";
    },
    providerOptions() {
      return this.providers.map((p) => ({ label: p, value: p }));
    },
    modelOptions() {
      return this.availableModels.map((m) => ({ label: m, value: m }));
    },
  },
  methods: {
    updateProvider(option) {
      const newProvider = option.value;
      if (this.initialized && newProvider !== this.internalProvider) {
        // console.log('Provider changed:', newProvider);
        this.internalProvider = newProvider;
        this.$emit("update:provider", newProvider);
        this.updateModels(newProvider);
      }
    },
    updateModel(option) {
      const newModel = option.value;
      if (this.initialized && newModel !== this.internalModel) {
        // console.log('Model changed:', newModel);
        this.internalModel = newModel;
        this.$emit("update:model", newModel);
      }
    },
    updateModels(newProvider) {
      const newModels = this.modelsByProvider[newProvider] || [];
      if (!newModels.includes(this.currentModel)) {
        const newModel = newModels[0] || "";
        if (newModel !== this.internalModel && newModel !== "") {
          // console.log('Model changed (due to provider change):', newModel);
          this.internalModel = newModel;
          this.$emit("update:model", newModel);
        }
      }
      this.$nextTick(() => {
        if (this.$refs.modelSelect) {
          this.$refs.modelSelect.setSelectedOption({
            label: this.currentModel,
            value: this.currentModel,
          });
        }
      });
    },
    setDefaultProvider() {
      const defaultProvider = this.providers[0];
      if (!this.initialized) {
        this.internalProvider = defaultProvider;
        this.$emit("update:provider", defaultProvider);
      }
      this.$nextTick(() => {
        if (this.$refs.providerSelect) {
          this.$refs.providerSelect.setSelectedOption({
            label: defaultProvider,
            value: defaultProvider,
          });
        }
      });
      this.updateModels(defaultProvider);
    },
  },
  watch: {
    provider: {
      immediate: true,
      handler(newProvider) {
        if (newProvider !== this.internalProvider) {
          this.internalProvider = newProvider;
          this.updateModels(newProvider);
          this.$nextTick(() => {
            if (this.$refs.providerSelect) {
              this.$refs.providerSelect.setSelectedOption({
                label: newProvider || this.providers[0],
                value: newProvider || this.providers[0],
              });
            }
          });
        }
      },
    },
    model: {
      immediate: true,
      handler(newModel) {
        if (newModel !== this.internalModel) {
          this.internalModel = newModel;
          this.$nextTick(() => {
            if (this.$refs.modelSelect) {
              this.$refs.modelSelect.setSelectedOption({
                label: newModel || this.availableModels[0] || "",
                value: newModel || this.availableModels[0] || "",
              });
            }
          });
        }
      },
    },
  },

  mounted() {
    if (!this.internalProvider) {
      this.setDefaultProvider();
    }
    if (!this.internalModel) {
      this.internalModel = this.currentModel;
      this.$emit("update:model", this.internalModel);
    }
    this.$nextTick(() => {
      this.initialized = true;
    });
  },
};
</script>

<style scoped>
.field-group.model-selector {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: space-evenly;
  align-items: flex-start;
  width: 100%;
  border: none;
  color: var(--color-navy);
  padding: 0;
  border-radius: 0px;
}

body[data-page="chat"] .field-group.model-selector {
  width: calc(100% - 18px);
  padding: 8px;
  border: 1px solid var(--color-light-navy);
}

body[data-page="chat"].dark .field-group.model-selector {
  border: 1px solid var(--color-dull-navy);
}

.select-wrapper {
  display: flex;
  flex-direction: column;
  margin-right: 0;
  width: 50%;
}

.select-wrapper label {
  margin-bottom: 4px;
  font-size: 14px;
}

select {
  padding: 7px 0px 5px 4px;
  border: 1px solid var(--color-light-navy);
  border-radius: 6px;
  background-color: var(--color-ultra-light-navy);
  color: var(--color-navy);
  font-family: "League Spartan", sans-serif;
  font-size: 16px;
  font-weight: 400;
  width: inherit;
}

select option {
  font-weight: 400;
}

body.dark select option {
  font-weight: 300;
}

body.dark select {
  background-color: var(--color-ultra-dark-navy);
  border: 1px solid var(--color-dull-navy);
  font-weight: 300;
}

body[data-page="create"] .field-group.model-selector {
  font-size: 15px;
  font-weight: 500;
}
</style>

<style>
#template-fields div#model-selector .custom-select .selected {
  margin-top: -5px;
}
#template-fields div#model-selector .custom-select .selected::after {
  top: 14px;
}
#template-fields div#model-selector .custom-select .option-inner {
  margin-top: -4px;
}
</style>