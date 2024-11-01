import { onMounted, onUpdated } from "vue";
import { attachFieldEventListeners } from "@/views/_components/base/fields";

export function useFieldsArea(formData, emit) {
  function updateFormData(key, value) {
    emit("form-updated", key, value);
  }

  function populateFields(newFormData) {
    Object.keys(newFormData).forEach(key => {
      if (key === 'customFields') {
        updateFormData('customFields', newFormData.customFields);
      } else {
        updateFormData(key, newFormData[key]);
      }
    });
  }

  function addCustomField(field) {
    const updatedCustomFields = {
      ...formData.value.customFields,
      [field.name]: {
        type: field.type,
        value: "",
        label: field.label
      },
    };
    updateFormData("customFields", updatedCustomFields);
  }

  function updateCustomField(key, value) {
    const updatedCustomFields = {
      ...formData.value.customFields,
      [key]: {
        ...formData.value.customFields[key],
        value: value,
      },
    };
    updateFormData("customFields", updatedCustomFields);
  }

  function deleteCustomField(key) {
    const updatedCustomFields = { ...formData.value.customFields };
    delete updatedCustomFields[key];
    updateFormData("customFields", updatedCustomFields);
  }

  onMounted(() => {
    attachFieldEventListeners();
  });

  onUpdated(() => {
    attachFieldEventListeners();
  });

  return {
    updateFormData,
    populateFields,
    addCustomField,
    updateCustomField,
    deleteCustomField
  };
}