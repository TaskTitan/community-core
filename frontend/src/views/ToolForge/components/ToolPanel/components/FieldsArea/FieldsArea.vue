<template>
  <template-fields id="template-fields">
    <form action="" id="template-form" enctype="multipart/form-data">
      <!-- TOOL NAME -->
      <div class="field-group">
        <label for="template-name">Tool Template Name</label>
        <input
          type="text"
          id="template-name"
          name="template-name"
          placeholder="Joke Generator"
          autocomplete="off"
          :value="formData.title"
          @input="updateFormData('title', $event.target.value)"
        />
      </div>
      <!-- TOOL INSTRUCTIONS -->
      <div class="field-group">
        <label for="template-instructions">Tool Instructions</label>
        <textarea
          id="template-instructions"
          name="template-instructions"
          placeholder="Generate a funny joke based on the following..."
          :value="formData.instructions"
          @input="updateFormData('instructions', $event.target.value)"
        ></textarea>
      </div>
      <!-- TOOL ICON -->
      <IconSelector
        :iconValue="formData.icon"
        @update:iconValue="updateFormData('icon', $event)"
      />
      <!-- MODEL SELECTOR -->
      <ModelSelector
        v-model:provider="formData.provider"
        v-model:model="formData.model"
      />
      <!-- CUSTOM FIELDS -->
      <div
        class="custom-fields"
        v-if="Object.keys(formData.customFields).length > 0"
      >
        <div
          v-for="(field, key) in formData.customFields"
          :key="key"
          class="field-group"
        >
          <label
            :for="key"
            contenteditable="true"
            draggable="true"
            style="cursor: grab"
            >{{ field.label || key }}</label
          >
          <textarea
            v-if="field.type !== 'file'"
            :id="key"
            :name="key"
            v-model="field.value"
            @input="updateCustomField(key, $event.target.value)"
          ></textarea>
          <input
            v-else
            type="file"
            :id="key"
            :name="key"
            @change="updateCustomField(key, $event.target.files[0])"
          />
          <button
            class="delete-field-button"
            title="Delete Field"
            @click="deleteCustomField(key)"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </form>
    <AddField @field-added="addCustomField" />
  </template-fields>
</template>

<script>
import { toRefs } from "vue";
import IconSelector from "./components/IconSelector/IconSelector.vue";
import ModelSelector from "./components/ModelSelector/ModelSelector.vue";
import AddField from "./components/CustomFields/AddField.vue";
import { useFieldsArea } from "./useFieldsArea";

export default {
  name: "FieldsArea",
  components: {
    ModelSelector,
    IconSelector,
    AddField,
  },
  props: {
    formData: {
      type: Object,
      required: true,
    },
  },
  emits: ["form-updated"],
  setup(props, { emit }) {
    const { formData } = toRefs(props);
    const {
      updateFormData,
      updateCustomField,
      deleteCustomField,
      addCustomField,
    } = useFieldsArea(formData, emit);

    return {
      formData,
      updateFormData,
      updateCustomField,
      deleteCustomField,
      addCustomField,
    };
  },
};
</script>

<style scoped>
template-fields {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  padding: 16px;
  width: 100%;
  width: -webkit-fill-available;
  height: 100%;
  overflow-y: scroll;
  background: transparent;
}
</style>
