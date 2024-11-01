import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomSelect from './CustomSelect.vue'

// Mock the toggleDropdown function
vi.mock('@/base/js/fields', () => ({
  toggleDropdown: vi.fn(),
}))

describe('CustomSelect', () => {
  const options = [
    { label: 'Option 1', value: 1 },
    { label: 'Option 2', value: 2 },
    { label: 'Option 3', value: 3 },
  ]

  it('renders correctly with default placeholder', () => {
    const wrapper = mount(CustomSelect, {
      props: { options }
    })
    expect(wrapper.find('.selected').text()).toBe('Select an Option')
    expect(wrapper.findAll('.option')).toHaveLength(3)
  })

  it('renders correctly with custom placeholder', () => {
    const placeholder = 'Choose an option'
    const wrapper = mount(CustomSelect, {
      props: { options, placeholder }
    })
    expect(wrapper.find('.selected').text()).toBe('Choose an option')
  })

  it('selects an option when clicked', async () => {
    const wrapper = mount(CustomSelect, {
      props: { options }
    })
    
    await wrapper.findAll('.option')[1].trigger('click')
    
    expect(wrapper.find('.selected').text()).toBe('Option 2')
    expect(wrapper.emitted('option-selected')).toBeTruthy()
    expect(wrapper.emitted('option-selected')[0]).toEqual([{ label: 'Option 2', value: 2 }])
  })

  it('handles keyboard navigation', async () => {
    const wrapper = mount(CustomSelect, {
      props: { options }
    })
    
    // Open the dropdown
    await wrapper.find('.selected').trigger('click') // Ensure dropdown is open
    
    // Check if the first option is highlighted
    await wrapper.trigger('keydown', { key: 'ArrowDown' })
    await wrapper.vm.$nextTick() // Ensure DOM updates are processed
    expect(wrapper.findAll('.option')[0].classes()).toContain('highlighted')
    
    // Navigate down again
    await wrapper.trigger('keydown', { key: 'ArrowDown' })
    await wrapper.vm.$nextTick() // Ensure DOM updates are processed
    
    // Check if the second option is highlighted
    expect(wrapper.findAll('.option')[1].classes()).toContain('highlighted')
    
    // Press Enter to select the highlighted option
    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick() // Ensure DOM updates are processed
    
    // Check if the correct option is selected
    expect(wrapper.find('.selected').text()).toBe('Option 2')
    expect(wrapper.emitted('option-selected')).toBeTruthy()
    expect(wrapper.emitted('option-selected')[0]).toEqual([{ label: 'Option 2', value: 2 }])
  })
})