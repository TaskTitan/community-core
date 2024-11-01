import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the store with chat module
vi.mock('../../store/state', () => ({
  default: {
    commit: vi.fn(),  // Add commit mock for mutations
    state: {
      chat: {         // Add chat module structure
        page: ''
      }
    }
  }
}))

// Mock the response functions
vi.mock('../_components/base/response', () => ({
  getContentFromQueryParam: vi.fn(),
  addPlaceholderEventListeners: vi.fn()
}))

// Mock the useTutorial composable
const mockStartTutorial = vi.fn()
const mockOnTutorialClose = vi.fn()
vi.mock('./useTutorial', () => ({
  useTutorial: vi.fn(() => ({
    tutorialConfig: { value: [{ step: 1 }, { step: 2 }] },
    startTutorial: { value: false },
    onTutorialClose: mockOnTutorialClose
  }))
}))

// Mock the vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    query: {}
  }))
}))

// Import the module under test after all mocks are defined
import useToolForge from './useToolForge'
import store from '../../store/state'
import { getContentFromQueryParam, addPlaceholderEventListeners } from '../_components/base/response'

describe('useToolForge', () => {
  let toolForge

  beforeEach(() => {
    vi.useFakeTimers()
    toolForge = useToolForge()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('initializes ToolForge correctly', () => {
    toolForge.initializeToolForge()

    expect(document.body.getAttribute('data-page')).toBe('create')
    expect(store.commit).toHaveBeenCalledWith('chat/SET_PAGE', 'create')  // Updated to check for commit
    expect(getContentFromQueryParam).toHaveBeenCalled()
    expect(addPlaceholderEventListeners).toHaveBeenCalled()
  })

  it('starts the tutorial after a delay', () => {
    toolForge.initializeToolForge()
    
    expect(toolForge.startTutorial.value).toBe(false)
    
    vi.advanceTimersByTime(3000)
    
    expect(toolForge.startTutorial.value).toBe(true)
  })

  it('closes the tutorial correctly', () => {
    toolForge.onTutorialClose()
    
    expect(mockOnTutorialClose).toHaveBeenCalled()
  })

  it('has the correct tutorial configuration', () => {
    expect(Array.isArray(toolForge.tutorialConfig.value)).toBe(true)
    expect(toolForge.tutorialConfig.value.length).toBe(2)
    expect(toolForge.tutorialConfig.value[0]).toHaveProperty('step', 1)
    expect(toolForge.tutorialConfig.value[1]).toHaveProperty('step', 2)
  })
})