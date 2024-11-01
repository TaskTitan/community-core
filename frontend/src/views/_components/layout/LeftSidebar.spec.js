import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory, RouterLink } from 'vue-router'
import LeftSidebar from './LeftSidebar.vue'

// Create a mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/workflow-designer', name: 'WorkflowDesigner', component: { template: '<div>Workflow Designer</div>' } },
    { path: '/tool-forge', name: 'ToolForge', component: { template: '<div>Tool Forge</div>' } },
    { path: '/chat', name: 'Chat', component: { template: '<div>Chat</div>' } },
    { path: '/docs', name: 'Documentation', component: { template: '<div>Documentation</div>' } },
    { path: '/settings', name: 'Settings', component: { template: '<div>Settings</div>' } },
  ]
})

describe('LeftSidebar', () => {
  it('mounts without crashing', () => {
    const wrapper = mount(LeftSidebar, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('contains the correct number of navigation links', () => {
    const wrapper = mount(LeftSidebar, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: RouterLink
        }
      }
    })
    const navLinks = wrapper.findAllComponents(RouterLink)
    expect(navLinks).toHaveLength(6) // 6 RouterLinks in the component
  })

  it('has the correct links in the top navigation', () => {
    const wrapper = mount(LeftSidebar, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: RouterLink
        }
      }
    })
    const topNav = wrapper.find('.left-sidebar-top-nav')
    const topNavLinks = topNav.findAllComponents(RouterLink)

    expect(topNavLinks).toHaveLength(4)
    expect(topNavLinks[0].props('to')).toBe('/')
    expect(topNavLinks[1].props('to')).toBe('/workflow-designer')
    expect(topNavLinks[2].props('to')).toBe('/tool-forge')
    expect(topNavLinks[3].props('to')).toBe('/chat')
  })

  it('has the correct links in the bottom navigation', () => {
    const wrapper = mount(LeftSidebar, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: RouterLink
        }
      }
    })
    const bottomNav = wrapper.find('.left-sidebar-bottom-nav')
    const bottomNavLinks = bottomNav.findAllComponents(RouterLink)

    expect(bottomNavLinks).toHaveLength(2)
    expect(bottomNavLinks[0].props('to')).toBe('/docs')
    expect(bottomNavLinks[1].props('to')).toBe('/settings')
  })

  it('applies the correct CSS classes', () => {
    const wrapper = mount(LeftSidebar, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.attributes('id')).toBe('left-sidebar')
    expect(wrapper.find('.left-sidebar-top-nav').exists()).toBe(true)
    expect(wrapper.find('.left-sidebar-bottom-nav').exists()).toBe(true)
  })

  it('renders SVG icons for each link', () => {
    const wrapper = mount(LeftSidebar, {
      global: {
        plugins: [router]
      }
    })
    const svgIcons = wrapper.findAll('svg.svg-icon')
    expect(svgIcons).toHaveLength(6) // One SVG icon for each link
  })
})