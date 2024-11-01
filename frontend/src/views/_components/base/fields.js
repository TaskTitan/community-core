import { formatTextToDivId, unformatDivIdToText } from './utilities';

export function resizeTextarea(textarea) {
  textarea.addEventListener('focus', onTextareaFocus);
  textarea.addEventListener('blur', onTextareaBlur);

  // Remove any existing click listeners from the textarea's parent
  const fieldGroup = textarea.closest('.field-group');
  if (fieldGroup) {
    fieldGroup.removeEventListener('click', preventFocus);
    fieldGroup.addEventListener('click', preventFocus);
  }
}

function onTextareaFocus(event) {
  const textarea = event.target;
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight - 12 + "px";
}

function onTextareaBlur(event) {
  const textarea = event.target;
  textarea.style.height = "auto";
}

function preventFocus(event) {
  if (event.target.tagName !== 'TEXTAREA') {
    event.preventDefault();
    const textarea = event.currentTarget.querySelector('textarea');
    if (textarea) {
      textarea.blur();
    }
  }
}

export function populateFormFields(template) {
  document.getElementById("template-name").value = template.title || "";
  document.getElementById("template-instructions").value = template.parameters.instructions || "";

  // Set the description
  const descriptionField = document.getElementById("template-description");
  if (descriptionField) {
    descriptionField.value = template.description || "";
  }

  console.log("Template model:", template.parameters.model);

  // Set the provider and model
  const providerSelect = document.getElementById('provider-select');
  const modelSelect = document.getElementById('model-select');

  if (providerSelect && modelSelect) {
    // Set the provider first
    providerSelect.value = template.parameters.provider;
    
    // Trigger change event on provider select to update available models
    providerSelect.dispatchEvent(new Event('change'));

    // Wait for the next tick to ensure the model options have been updated
    setTimeout(() => {
      // Now set the model
      modelSelect.value = template.parameters.model;

      // Trigger change event on model select
      modelSelect.dispatchEvent(new Event('change'));

      console.log("Provider set to:", providerSelect.value);
      console.log("Model set to:", modelSelect.value);
    }, 0);
  } else {
    console.warn("Provider or model select not found");
  }

  // Populate custom fields
  const customFieldsContainer = document.querySelector(".custom-fields");
  customFieldsContainer.innerHTML = "";

  Object.entries(template.parameters).forEach(([key, value]) => {
    if (!["provider", "model", "instructions"].includes(key)) {
      const fieldDiv = document.createElement("div");
      fieldDiv.className = "field-group";
      
      let inputElement;
      if (typeof value === 'object' && value.type && value.value) {
        // Handle custom fields with type and value
        if (value.type === 'textarea') {
          inputElement = `<textarea id="${key}" name="${key}">${value.value}</textarea>`;
        } else {
          inputElement = `<input type="${value.type}" id="${key}" name="${key}" value="${value.value}">`;
        }
      } else {
        // Handle simple string values
        inputElement = `<input type="text" id="${key}" name="${key}" value="${value}">`;
      }

      fieldDiv.innerHTML = `
        <label for="${key}">${key}</label>
        ${inputElement}
        <button class="delete-field-button" title="Delete Field">
          <i class="fas fa-trash"></i>
        </button>
      `;
      customFieldsContainer.appendChild(fieldDiv);
    }
  });

  // Make sure the custom fields are visible
  customFieldsContainer.style.display = "flex";

  // Set the icon
  const iconOptions = document.querySelectorAll('.icon-option');
  iconOptions.forEach(option => {
    const iconName = option.querySelector('.svg-icon').getAttribute('data-icon-name');
    if (iconName === template.icon) {
      iconOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      const iconInput = document.getElementById('template-icon');
      if (iconInput) {
        iconInput.value = template.icon;
      }
    }
  });

  // Re-attach event listeners
  attachFieldEventListeners();
}

export function toggleDropdown(dropdown, show) {
  let optionsContainer = dropdown.querySelector('.options-container');
  let selected = dropdown.querySelector('.selected');

  if (show !== undefined) {
    optionsContainer.style.display = show ? 'block' : 'none';
    if (show) {
      selected.classList.add('open');
    } else {
      selected.classList.remove('open');
    }
  } else {
    if (optionsContainer.style.display === 'block') {
      optionsContainer.style.display = 'none';
      selected.classList.remove('open');
    } else {
      optionsContainer.style.display = 'block';
      selected.classList.add('open');
    }
  }
}

export function attachFieldEventListeners() {
  _addResizeEventListenerToAllTextareas();
  _attachRenameFieldFunctionality();
  _addDeleteEventListeners();
  _enableDragSort();
  _preventLabelFocus();
}

function _preventLabelFocus() {
  const labels = document.querySelectorAll('.field-group label');
  labels.forEach(label => {
    const associatedInput = document.getElementById(label.getAttribute('for'));
    if (associatedInput && (associatedInput.type === 'text' || associatedInput.tagName === 'TEXTAREA')) {
      label.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }
  });
}

function _addResizeEventListenerToAllTextareas() {
  const textareas = document.getElementsByTagName('textarea');
  for (let i = 0; i < textareas.length; i++) {
    resizeTextarea(textareas[i]);
  }
}

function _createAndPopulateCustomField(fieldName, fieldValue, fieldType) {
  const customFields = document.querySelector('.custom-fields');
  const divId = formatTextToDivId(fieldName);
  const unformattedFieldName = unformatDivIdToText(fieldName);

  let inputElement = '';

  switch (fieldType) {
    case 'text':
      inputElement = `<input type="text" id="${divId}" name="${divId}" placeholder="Enter text" value="${fieldValue || ''}" autocomplete="off" />`;
      break;
    case 'textarea':
      inputElement = `<textarea id="${divId}" name="${divId}" placeholder="Enter text">${fieldValue || ''}</textarea>`;
      break;
    case 'file':
      inputElement = `
        <input type="file" id="${divId}" name="${divId}" accept=".doc,.docx,.md,.pdf,.txt,.csv,.css,.js, image/png, image/jpeg" multiple />
      `;
      break;
  }

  const html = `
    <div class="field-group">
      <label for="${divId}">${unformattedFieldName}</label>
      ${inputElement}
      <button class="delete-field-button" title="Delete Field">
        <i class="fas fa-trash"></i> <!-- Font Awesome trash can icon -->
      </button>
    </div>
  `;

  customFields.insertAdjacentHTML('beforeend', html);
  customFields.style.display = 'flex';

  _addResizeEventListenerToAllTextareas();
  _attachRenameFieldFunctionality();
  _addDeleteEventListeners();
  _enableDragSort();
}

function _attachRenameFieldFunctionality() {
  document.querySelector('.custom-fields').addEventListener('dblclick', function(event) {
    if (event.target.tagName === 'LABEL' && event.target.closest('.field-group')) {
      const label = event.target;
      const originalText = label.innerText;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = originalText;
      label.parentNode.replaceChild(input, label);
      input.focus();

      function updateLabelAndFieldId(newText) {
        const associatedField = document.getElementById(formatTextToDivId(originalText));
        // Create new ID based on the new text
        const newId = formatTextToDivId(newText);
        // Rename the field ID
        if (associatedField) {
          associatedField.id = newId;
          associatedField.name = newId; // Optionally update the name attribute as well
        }
        // Update the label
        const newLabel = document.createElement('label');
        newLabel.textContent = newText;
        input.parentNode.replaceChild(newLabel, input);
        _enableDragSort();
      }

      // Save on blur
      input.onblur = () => {
        if (input.value.trim()) {
          updateLabelAndFieldId(input.value.trim());
          // saveFormDataToLocalStorage();
        } else {
          updateLabelAndFieldId(originalText);
        }
      };

      // Save on Enter key press
      input.onkeypress = function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (input.value.trim()) {
            updateLabelAndFieldId(input.value.trim());
            // saveFormDataToLocalStorage();
          } else {
            updateLabelAndFieldId(originalText);
          }
        }
      };
    }
  });
}

function _enableDragSort() {
  let draggableElements = document.querySelectorAll('.custom-fields .field-group > label');
  let draggingElement;
  let placeholder;

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggingElement) return;

    const target = e.target.closest('.field-group'); // Make sure we get .field-group
    if (target && placeholder !== target) {
      if (placeholder) {
        placeholder.classList.remove('drop-placeholder');
      }
      placeholder = target;
      placeholder.classList.add('drop-placeholder'); // Visually indicates drop location
    }
  };

  const onDragEnd = (e) => {
    if (placeholder) {
      placeholder.before(draggingElement.parentElement); // Perform actual drop
      placeholder.classList.remove('drop-placeholder'); // Clean up placeholder styling
      placeholder = null; // Reset the placeholder reference
      draggingElement = null; // Reset the dragging element reference
    }
  };

  draggableElements.forEach((label) => {
    label.setAttribute('draggable', true);
    label.style.cursor = 'grab';
    label.addEventListener('dragstart', function (e) {
      draggingElement = label;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text', ''); // Required for drag to work in Firefox
      document.querySelectorAll('.custom-fields .field-group').forEach((group) => group.classList.add('drag-target'));
    });
    label.addEventListener('dragend', onDragEnd);
    label.addEventListener('dragover', onDragOver);
  });
}

function _handleDeleteField(event) {
  event.preventDefault();
  const fieldGroupElement = event.target.closest('.field-group');
  if (fieldGroupElement && confirm('Do you want to delete this field?')) {
    fieldGroupElement.remove();
    // You may want to add any additional cleanup or saving logic here
  }
}

function _addDeleteEventListeners() {
  const deleteButtons = document.querySelectorAll('.delete-field-button');
  deleteButtons.forEach((button) => {
    button.addEventListener('click', _handleDeleteField);
  });
}