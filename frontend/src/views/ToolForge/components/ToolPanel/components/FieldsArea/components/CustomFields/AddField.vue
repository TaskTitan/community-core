<template>
  <!-- CUSTOM FIELDS -->
  <div class="custom-fields" style="display: none">
    <!-- CUSTOM FIELDS APPENDED HERE DYNAMICALLY -->
  </div>
  <!-- NEW FIELDS MODAL -->
  <div class="new-field-modal" style="display: none">
    <button class="close" title="Close Field Form" @click="closeFieldForm">
      <i class="fas fa-times"></i>
    </button>
    <div class="field-group">
      <label for="field-name">Field Name</label>
      <input
        type="text"
        id="field-name"
        name="field-name"
        placeholder="Enter Field Name"
        autocomplete="off"
      />
    </div>
    <div class="field-group">
      <p class="label">Field Type</p>
      <CustomSelect
        :options="fieldTypeOptions"
        placeholder="Select Field Type"
        @option-selected="handleFieldTypeSelected"
      />
    </div>
    <button class="icon" tabindex="0" title="Add Field" @click="addCustomField">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
      >
        <rect
          x="0.5"
          y="0.5"
          width="31"
          height="31"
          stroke="#01052A"
          stroke-opacity="0.25"
          stroke-dasharray="2 2"
        />
        <path
          d="M13.2516 22.5L8 17.305L10.3932 14.9376L13.2516 17.7735L21.6068 9.5L24 11.8674L13.2516 22.5Z"
          fill="#01052A"
          fill-opacity="0.5"
        />
      </svg>
    </button>
  </div>
  <!-- ADD NEW FIELD BUTTON -->
  <div id="add-new-field" class="add-new-field">
    <button
      id="add-new-field-button"
      class="icon"
      tabindex="0"
      title="Add New Field"
      @click="showFieldForm"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="33"
        height="32"
        viewBox="0 0 33 32"
        fill="none"
      >
        <rect
          x="0.544922"
          y="0.5"
          width="31"
          height="31"
          rx="7.5"
          stroke="#01052A"
          stroke-opacity="0.25"
          stroke-dasharray="5 5"
        />
        <path
          d="M15.1878 16.8571H10.0449V15.1429H15.1878V10H16.9021V15.1429H22.0449V16.8571H16.9021V22H15.1878V16.8571Z"
          fill="#01052A"
          fill-opacity="0.5"
        />
      </svg>
    </button>
  </div>
</template>

<script>
import { formatTextToDivId } from "@/views/_utils/stringFormatting.js";
import { attachFieldEventListeners } from "@/views/_components/base/fields";
import CustomSelect from "@/views/_components/common/CustomSelect.vue";

export default {
  name: "AddField",
  emits: ["field-added"],
  components: {
    CustomSelect,
  },
  data() {
    return {
      selectedFieldType: "",
      fieldTypeOptions: [
        { label: "Text (Small)", value: "input" },
        { label: "Textarea (Large)", value: "textarea" },
        { label: "Document (DOCX, PDF, etc)", value: "document" },
      ],
    };
  },
  methods: {
    showFieldForm(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      document.querySelector(".add-new-field").style.display = "none";
      document.querySelector(".new-field-modal").style.display = "flex";
    },
    closeFieldForm(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      document.querySelector(".new-field-modal").style.display = "none";
      document.querySelector(".add-new-field").style.display = "flex";
      this.selectedFieldType = "";
    },
    handleFieldTypeSelected(option) {
      this.selectedFieldType = option.value;
    },
    addCustomField(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      let customFieldName = document.querySelector("#field-name").value;
      let customFieldType = this.selectedFieldType;
      let divId = formatTextToDivId(customFieldName);

      if (!divId) {
        alert("Please enter a valid field name.");
        return;
      }

      if (!customFieldType) {
        alert("Please select a valid field type.");
        return;
      }

      // Modify the field type for document to be 'file'
      const fieldType = customFieldType === 'document' ? 'file' : customFieldType;

      // Emit the new field data
      this.$emit("field-added", {
        name: divId,
        type: fieldType,
        label: customFieldName,
      });

      this.closeFieldForm();

      document.querySelector("#field-name").value = "";
      this.selectedFieldType = "";
    },
  },
  mounted() {
    attachFieldEventListeners();
  },
  updated() {
    attachFieldEventListeners();
  },
};
</script>
