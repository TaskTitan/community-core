import { ref, computed, watch } from 'vue';

export function useToolSelector(props, emit) {
  const customSelect = ref(null);

  const templateOptions = computed(() => {
    const createNewOption = { 
      label: "Create New Tool", 
      value: "create-new", 
      highlight: true,
      class: 'create-new-option'
    };

    const sortedTools = [...props.tools].sort((a, b) => 
      a.title.localeCompare(b.title)
    );

    const toolOptions = sortedTools.map((tool) => ({
      label: tool.title,
      value: tool.id,
    }));

    return [createNewOption, ...toolOptions];
  });

  const handleOptionSelected = (option) => {
    if (option && option.value === "create-new") {
      emit("update:selectedTool", "create-new");
    } else if (option) {
      const selected = props.tools.find((t) => t.id === option.value);
      emit("update:selectedTool", selected);
    } else {
      emit("update:selectedTool", null);
    }
  };

  watch(() => props.selectedTool, (newTool) => {
    if (customSelect.value && customSelect.value.setSelectedOption) {
      if (newTool) {
        const option = templateOptions.value.find(opt => opt.value === newTool.id);
        customSelect.value.setSelectedOption(option || null);
      } else {
        customSelect.value.setSelectedOption(null);
      }
    }
  }, { immediate: true });

  return {
    customSelect,
    templateOptions,
    handleOptionSelected,
  };
}