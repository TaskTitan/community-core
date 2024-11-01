import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ModelSelector from './ModelSelector.vue'

// Simple mock for CustomSelect
const CustomSelectMock = {
  template: '<div class="custom-select"><slot></slot></div>',
  props: ['options', 'placeholder'],
  methods: {
    setSelectedOption: vi.fn()
  }
}

describe('ModelSelector', () => {
  const createWrapper = (props = {}) => {
    return mount(ModelSelector, {
      global: {
        stubs: {
          CustomSelect: CustomSelectMock
        }
      },
      props
    })
  }

  it('renders correctly', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('#model-selector').exists()).toBe(true)
    expect(wrapper.findAllComponents(CustomSelectMock)).toHaveLength(2)
  })

  it('emits default provider and model when mounted with no props', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('update:provider')).toBeTruthy()
    expect(wrapper.emitted('update:model')).toBeTruthy()
  })

  it('emits update:provider and update:model when provider CustomSelect emits option-selected', async () => {
    const wrapper = createWrapper()
    const providerSelect = wrapper.findAllComponents(CustomSelectMock)[0]
    await providerSelect.vm.$emit('option-selected', { value: 'SomeProvider' })
    
    expect(wrapper.emitted('update:provider')).toBeTruthy()
    expect(wrapper.emitted('update:model')).toBeTruthy()
  })

  it('emits update:model when model CustomSelect emits option-selected', async () => {
    const wrapper = createWrapper()
    const modelSelect = wrapper.findAllComponents(CustomSelectMock)[1]
    await modelSelect.vm.$emit('option-selected', { value: 'SomeModel' })
    
    expect(wrapper.emitted('update:model')).toBeTruthy()
  })
})