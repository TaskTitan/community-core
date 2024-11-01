import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PopupTutorial from './PopupTutorial.vue';

describe('PopupTutorial', () => {
  let wrapper;
  const mockConfig = [
    { title: 'Step 1', content: 'This is step 1', position: 'center' },
    { title: 'Step 2', content: 'This is step 2', position: 'bottom', target: 'target-element' },
    { title: 'Step 3', content: 'This is step 3', position: 'right', target: 'target-element', autoProgress: 1000 },
  ];

  beforeEach(() => {
    // Mock querySelector to always return an element
    document.querySelector = vi.fn(() => ({
      getBoundingClientRect: () => ({
        width: 100, height: 100, top: 50, left: 50, bottom: 150, right: 150,
      }),
    }));

    // Mock window dimensions
    global.innerWidth = 1024;
    global.innerHeight = 768;
  });

  it('renders when startTutorial is true', async () => {
    wrapper = mount(PopupTutorial, {
      props: { config: mockConfig, startTutorial: true },
    });
    expect(wrapper.find('.popup-tutorial').exists()).toBe(true);
  });

  it('does not render when startTutorial is false', () => {
    wrapper = mount(PopupTutorial, {
      props: { config: mockConfig, startTutorial: false },
    });
    expect(wrapper.find('.popup-tutorial').exists()).toBe(false);
  });

  it('displays the correct content for each step', async () => {
    wrapper = mount(PopupTutorial, {
      props: { config: mockConfig, startTutorial: true },
    });

    expect(wrapper.find('h3').text()).toBe('Step 1');
    expect(wrapper.find('p').text()).toBe('This is step 1');

    await wrapper.find('.next-button').trigger('click');
    expect(wrapper.find('h3').text()).toBe('Step 2');
    expect(wrapper.find('p').text()).toBe('This is step 2');
  });

  it('closes the tutorial when close button is clicked', async () => {
    wrapper = mount(PopupTutorial, {
      props: { config: mockConfig, startTutorial: true },
    });

    await wrapper.find('.close-button').trigger('click');
    expect(wrapper.emitted().close).toBeTruthy();
  });

  it('emits close event when tutorial is completed', async () => {
    wrapper = mount(PopupTutorial, {
      props: { config: mockConfig, startTutorial: true },
    });

    // Go through all steps
    for (let i = 0; i < mockConfig.length; i++) {
      await wrapper.find('.next-button').trigger('click');
    }

    expect(wrapper.emitted().close).toBeTruthy();
  });
});